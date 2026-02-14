import { Injectable, Inject } from '@nestjs/common';
import { RedisClientType } from 'redis';
import { PostgresRepository } from './repositories/postgres.repository';
import { MongoRepository } from './repositories/mongo.repository';
import { RedisRepository } from './repositories/redis.repository';
import { ElasticsearchRepository } from './repositories/elasticsearch.repository';

@Injectable()
export class EventProcessor {
    private readonly maxRetries = 3;
    private readonly idempotencyTTL = 86400; // 24 hours

    constructor(
        @Inject('REDIS_CLIENT') private readonly redisClient: RedisClientType,
        private readonly postgresRepo: PostgresRepository,
        private readonly mongoRepo: MongoRepository,
        private readonly redisRepo: RedisRepository,
        private readonly elasticsearchRepo: ElasticsearchRepository,
    ) { }

    async process(event: any): Promise<void> {
        // 1. Check idempotency (prevent duplicate processing)
        const isProcessed = await this.checkIdempotency(event.eventId);
        if (isProcessed) {
            console.log(`⏭️  Event ${event.eventId} already processed, skipping`);
            return;
        }

        // 2. Process with retry logic
        await this.processWithRetry(event);

        // 3. Mark as processed
        await this.markAsProcessed(event.eventId);
    }

    private async processWithRetry(event: any, attempt = 1): Promise<void> {
        try {
            // Store in all databases in parallel
            await Promise.all([
                this.postgresRepo.saveEvent(event),
                this.mongoRepo.updateAggregates(event),
                this.redisRepo.updateCounters(event),
                this.elasticsearchRepo.indexEvent(event),
            ]);

            console.log(`✅ Event ${event.eventId} processed successfully`);
        } catch (error) {
            console.error(`❌ Attempt ${attempt} failed for event ${event.eventId}:`, error.message);

            if (attempt < this.maxRetries) {
                // Exponential backoff: 2^attempt seconds
                const backoffMs = Math.pow(2, attempt) * 1000;
                console.log(`⏳ Retrying in ${backoffMs}ms...`);

                await this.sleep(backoffMs);
                return this.processWithRetry(event, attempt + 1);
            }

            // Max retries exceeded
            throw new Error(`Failed to process event after ${this.maxRetries} attempts: ${error.message}`);
        }
    }

    private async checkIdempotency(eventId: string): Promise<boolean> {
        const key = `processed:${eventId}`;
        const exists = await this.redisClient.exists(key);
        return exists === 1;
    }

    private async markAsProcessed(eventId: string): Promise<void> {
        const key = `processed:${eventId}`;
        await this.redisClient.setEx(key, this.idempotencyTTL, '1');
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
