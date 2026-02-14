import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ThrottlerModule } from '@nestjs/throttler';
import { join } from 'path';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { EventsModule } from './events/events.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ActionsModule } from './actions/actions.module';
import { RedisModule } from './redis/redis.module';

@Module({
    imports: [
        // GraphQL Configuration
        GraphQLModule.forRoot<ApolloDriverConfig>({
            driver: ApolloDriver,
            autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
            sortSchema: true,
            playground: process.env.NODE_ENV !== 'production',
            introspection: true,
            context: ({ req, res }) => ({ req, res }),
            formatError: (error) => {
                return {
                    message: error.message,
                    code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
                    path: error.path,
                };
            },
        }),

        // Rate Limiting
        ThrottlerModule.forRoot([{
            ttl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10) * 1000,
            limit: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
        }]),

        // Feature Modules
        RedisModule,
        HealthModule,
        AuthModule,
        EventsModule,
        AnalyticsModule,
        ActionsModule,
    ],
})
export class AppModule { }
