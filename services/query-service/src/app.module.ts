import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
    imports: [DatabaseModule, AnalyticsModule],
})
export class AppModule { }
