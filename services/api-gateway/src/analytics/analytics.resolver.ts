import { Resolver, Query, Args } from '@nestjs/graphql';
import { AnalyticsService } from './analytics.service';

@Resolver()
export class AnalyticsResolver {
    constructor(private readonly analyticsService: AnalyticsService) { }

    @Query(() => String)
    async dailyMetrics(
        @Args('startDate') startDate: string,
        @Args('endDate', { nullable: true }) endDate?: string,
    ): Promise<string> {
        console.log(`🔍 GraphQL Query: dailyMetrics(${startDate}, ${endDate})`);
        const data = await this.analyticsService.getDailyMetrics(startDate, endDate);
        return JSON.stringify(data);
    }

    @Query(() => Number)
    async activeUsers(@Args('timeRange') timeRange: string): Promise<number> {
        return this.analyticsService.getActiveUsers(timeRange);
    }
}
