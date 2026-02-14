import { Injectable, Inject } from '@nestjs/common';
import { Db } from 'mongodb';
import { RedisClientType } from 'redis';
import { Client as ElasticsearchClient } from '@elastic/elasticsearch';

@Injectable()
export class AnalyticsService {
    private readonly cacheTTL = parseInt(process.env.REDIS_CACHE_TTL || '300', 10);

    constructor(
        @Inject('MONGO_CLIENT') private readonly db: Db,
        @Inject('REDIS_CLIENT') private readonly redisClient: RedisClientType,
        @Inject('ELASTICSEARCH_CLIENT') private readonly esClient: ElasticsearchClient,
    ) { }

    async getDailyMetrics(startDate: string, endDate?: string): Promise<any[]> {
        console.log(`📊 Requesting metrics: ${startDate} to ${endDate || 'now'}`);
        const finalEndDate = endDate || new Date().toISOString().split('T')[0];
        const cacheKey = `daily_metrics:${startDate}:${finalEndDate}`;

        const today = new Date().toISOString().split('T')[0];
        const isHistorical = finalEndDate < today;

        // Check cache (only for historical data)
        if (isHistorical) {
            const cached = await this.redisClient.get(cacheKey);
            if (cached) {
                console.log('✅ Cache hit for daily metrics');
                return JSON.parse(cached);
            }
        }

        // Query MongoDB
        const [dailyMetrics, typeMetrics] = await Promise.all([
            this.db.collection('daily_metrics').find({
                date: { $gte: startDate, $lte: finalEndDate },
            }).sort({ date: 1 }).toArray(),
            this.db.collection('event_type_metrics').find({
                date: { $gte: startDate, $lte: finalEndDate },
            }).toArray()
        ]);

        // Merge type metrics into daily metrics
        const metrics = dailyMetrics.map(m => {
            const types = typeMetrics.filter(t => t.date === m.date);
            const eventsByType = {};
            types.forEach(t => {
                eventsByType[t.eventType] = t.count;
            });
            return { ...m, eventsByType };
        });

        // Cache result (only for historical data)
        if (isHistorical) {
            await this.redisClient.setEx(cacheKey, this.cacheTTL, JSON.stringify(metrics));
        }

        return metrics;
    }

    async getActiveUsers(timeRange: string): Promise<{ count: number }> {
        const now = new Date();
        let hourKey: string;

        if (timeRange === '1h') {
            const dateKey = now.toISOString().split('T')[0];
            hourKey = `${dateKey}:${now.getUTCHours()}`;
        } else {
            // Default to current hour
            const dateKey = now.toISOString().split('T')[0];
            hourKey = `${dateKey}:${now.getUTCHours()}`;
        }

        const count = await this.redisClient.pfCount(`active_users:${hourKey}`);

        return { count };
    }

    async searchEvents(filters: any): Promise<any> {
        const { eventType, userId, startDate, endDate, limit = 100 } = filters;

        const must: any[] = [];

        if (eventType) {
            must.push({ term: { eventType } });
        }

        if (userId) {
            must.push({ term: { userId } });
        }

        if (startDate || endDate) {
            must.push({
                range: {
                    timestamp: {
                        ...(startDate && { gte: startDate }),
                        ...(endDate && { lte: endDate }),
                    },
                },
            });
        }

        const result = await this.esClient.search({
            index: process.env.ELASTICSEARCH_INDEX_EVENTS || 'user-events',
            body: {
                query: {
                    bool: { must },
                },
                size: limit,
                sort: [{ timestamp: { order: 'desc' } }],
            },
        });

        return {
            total: result.hits.total,
            events: result.hits.hits.map((hit: any) => hit._source),
        };
    }

    async getEventTypeMetrics(startDate: string, endDate: string): Promise<any[]> {
        return this.db
            .collection('event_type_metrics')
            .find({
                date: { $gte: startDate, $lte: endDate },
            })
            .sort({ count: -1 })
            .toArray();
    }

    async getUserAggregates(userId: string): Promise<any> {
        const cacheKey = `user_aggregates:${userId}`;

        const cached = await this.redisClient.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }

        const aggregate = await this.db.collection('user_aggregates').findOne({ userId });

        if (aggregate) {
            await this.redisClient.setEx(cacheKey, this.cacheTTL, JSON.stringify(aggregate));
        }

        return aggregate;
    }

    async resetAllData(): Promise<{ success: boolean; message: string }> {
        try {
            // Clear MongoDB collections
            await this.db.collection('daily_metrics').deleteMany({});
            await this.db.collection('event_type_metrics').deleteMany({});
            await this.db.collection('user_aggregates').deleteMany({});
            console.log('✅ MongoDB collections cleared');

            // Clear Redis cache
            await this.redisClient.flushAll();
            console.log('✅ Redis cache flushed');

            // Clear Elasticsearch index
            const indexName = process.env.ELASTICSEARCH_INDEX_EVENTS || 'user-events';
            const exists = await this.esClient.indices.exists({ index: indexName });
            if (exists) {
                await this.esClient.deleteByQuery({
                    index: indexName,
                    body: { query: { match_all: {} } },
                    refresh: true
                });
            }
            console.log('✅ Elasticsearch index cleared');

            return {
                success: true,
                message: 'All data cleared successfully'
            };
        } catch (error) {
            console.error('❌ Reset failed:', error);
            return {
                success: false,
                message: 'Failed to reset: ' + error.message
            };
        }
    }
}
