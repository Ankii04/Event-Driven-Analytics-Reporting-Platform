import { Controller, Get, Inject } from '@nestjs/common';
import { RedisClientType } from 'redis';

@Controller('health')
export class HealthController {
    constructor(
        @Inject('REDIS_CLIENT') private readonly redisClient: RedisClientType,
    ) { }

    @Get()
    async check() {
        const redisStatus = await this.checkRedis();

        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            service: 'api-gateway',
            version: '1.0.0',
            checks: {
                redis: redisStatus,
            },
        };
    }

    @Get('ready')
    async ready() {
        const redisStatus = await this.checkRedis();

        if (redisStatus !== 'healthy') {
            return {
                status: 'not_ready',
                reason: 'Redis not available',
            };
        }

        return {
            status: 'ready',
            timestamp: new Date().toISOString(),
        };
    }

    @Get('live')
    live() {
        return {
            status: 'alive',
            timestamp: new Date().toISOString(),
        };
    }

    private async checkRedis(): Promise<string> {
        try {
            await this.redisClient.ping();
            return 'healthy';
        } catch (error) {
            return 'unhealthy';
        }
    }
}
