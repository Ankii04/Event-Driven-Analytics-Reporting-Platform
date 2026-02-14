import { Injectable, Inject } from '@nestjs/common';
import { RedisClientType } from 'redis';

@Injectable()
export class RedisRepository {
    constructor(@Inject('REDIS_CLIENT') private readonly redisClient: RedisClientType) { }

    async updateCounters(event: any): Promise<void> {
        const now = new Date(event.timestamp);
        const dateKey = now.toISOString().split('T')[0];
        const hourKey = `${dateKey}:${now.getUTCHours()}`;

        try {
            // Increment hourly active users (using HyperLogLog for unique count)
            await this.redisClient.pfAdd(`active_users:${hourKey}`, event.userId);

            // Increment event counters
            await this.redisClient.incr(`events:${dateKey}:total`);
            await this.redisClient.incr(`events:${dateKey}:${event.eventType}`);

            // Set expiration (7 days)
            await this.redisClient.expire(`active_users:${hourKey}`, 604800);
            await this.redisClient.expire(`events:${dateKey}:total`, 604800);
            await this.redisClient.expire(`events:${dateKey}:${event.eventType}`, 604800);

            // Track revenue for purchase events
            if (event.eventType === 'purchase' && event.data.amount) {
                await this.redisClient.incrByFloat(`revenue:${dateKey}`, event.data.amount);
                await this.redisClient.expire(`revenue:${dateKey}`, 604800);
            }
        } catch (error) {
            console.error('Redis update error:', error);
            throw error;
        }
    }
}
