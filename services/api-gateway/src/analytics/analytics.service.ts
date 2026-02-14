import { Injectable, Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { RedisClientType } from 'redis';
import { firstValueFrom } from 'rxjs';
import { Logger } from '../common/logger';

@Injectable()
export class AnalyticsService {
    private readonly logger = new Logger(AnalyticsService.name);
    private readonly queryServiceUrl = process.env.QUERY_SERVICE_URL || 'http://localhost:3003';
    private readonly cacheTTL = parseInt(process.env.REDIS_CACHE_TTL || '300', 10);

    constructor(
        private readonly httpService: HttpService,
        @Inject('REDIS_CLIENT') private readonly redisClient: RedisClientType,
    ) { }

    async getDailyMetrics(startDate: string, endDate: string): Promise<any> {
        const finalEndDate = endDate || new Date().toISOString().split('T')[0];
        const cacheKey = `daily_metrics:${startDate}:${finalEndDate}`;

        const today = new Date().toISOString().split('T')[0];
        const isHistorical = finalEndDate < today;

        // 1. Only use cache for historical data
        if (isHistorical) {
            const cached = await this.redisClient.get(cacheKey);
            if (cached) {
                this.logger.debug('Cache hit for daily metrics', { startDate, finalEndDate });
                return JSON.parse(cached);
            }
        }

        // 2. Fetch from query service
        try {
            const response = await firstValueFrom(
                this.httpService.get(`${this.queryServiceUrl}/analytics/daily`, {
                    params: { startDate, endDate: finalEndDate },
                }),
            );

            // 3. Only cache historical data
            if (isHistorical) {
                await this.redisClient.setEx(cacheKey, this.cacheTTL, JSON.stringify(response.data));
            }

            this.logger.log('Fetched daily metrics', { startDate, finalEndDate });
            return response.data;
        } catch (error) {
            this.logger.error('Failed to fetch daily metrics', error.stack, {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data
            });
            throw new Error(`Failed to fetch analytics data: ${error.message}`);
        }
    }

    async getActiveUsers(timeRange: string): Promise<number> {
        const cacheKey = `active_users:${timeRange}`;

        const cached = await this.redisClient.get(cacheKey);
        if (cached) {
            return parseInt(cached, 10);
        }

        try {
            const response = await firstValueFrom(
                this.httpService.get(`${this.queryServiceUrl}/analytics/active-users`, {
                    params: { timeRange },
                }),
            );

            await this.redisClient.setEx(cacheKey, 60, response.data.count.toString());
            return response.data.count;
        } catch (error) {
            this.logger.error('Failed to fetch active users', error.message);
            throw new Error('Failed to fetch active users');
        }
    }
}
