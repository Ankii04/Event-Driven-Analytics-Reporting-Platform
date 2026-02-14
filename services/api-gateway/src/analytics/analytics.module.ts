import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AnalyticsResolver } from './analytics.resolver';
import { AnalyticsService } from './analytics.service';

@Module({
    imports: [HttpModule],
    providers: [AnalyticsResolver, AnalyticsService],
})
export class AnalyticsModule { }
