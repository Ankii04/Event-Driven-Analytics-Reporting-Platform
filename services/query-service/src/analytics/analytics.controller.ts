import { Controller, Get, Post, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Controller('analytics')
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    @Get('daily')
    async getDailyMetrics(
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
    ) {
        return this.analyticsService.getDailyMetrics(startDate, endDate);
    }

    @Get('active-users')
    async getActiveUsers(@Query('timeRange') timeRange: string) {
        return this.analyticsService.getActiveUsers(timeRange);
    }

    @Get('search')
    async searchEvents(
        @Query('eventType') eventType?: string,
        @Query('userId') userId?: string,
        @Query('eventId') eventId?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('limit') limit?: string,
    ) {
        return this.analyticsService.searchEvents({
            eventType,
            userId,
            eventId,
            startDate,
            endDate,
            limit: limit ? parseInt(limit, 10) : 100,
        });
    }

    @Get('event-types')
    async getEventTypeMetrics(
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
    ) {
        return this.analyticsService.getEventTypeMetrics(startDate, endDate);
    }

    @Get('user/:userId')
    async getUserAggregates(@Query('userId') userId: string) {
        return this.analyticsService.getUserAggregates(userId);
    }

    @Post('trigger-seed')
    async triggerSeed() {
        try {
            // Run seed script in background
            const projectRoot = process.cwd() + '/../../..';
            execAsync('npm run seed:events', { cwd: projectRoot }).catch(err =>
                console.error('Seed script error:', err)
            );

            return {
                success: true,
                message: 'Seeding 1000 events in background...'
            };
        } catch (error) {
            return {
                success: false,
                message: 'Failed to trigger seed: ' + error.message
            };
        }
    }

    @Post('reset-data')
    async resetData() {
        return this.analyticsService.resetAllData();
    }
}
