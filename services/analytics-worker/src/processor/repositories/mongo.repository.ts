import { Injectable, Inject } from '@nestjs/common';
import { Db } from 'mongodb';

@Injectable()
export class MongoRepository {
    constructor(@Inject('MONGO_CLIENT') private readonly db: Db) { }

    async updateAggregates(event: any): Promise<void> {
        const date = new Date(event.timestamp).toISOString().split('T')[0];

        try {
            // Update daily metrics
            await this.db.collection('daily_metrics').updateOne(
                { date },
                {
                    $inc: { totalEvents: 1 },
                    $addToSet: { users: event.userId },
                    $set: { updatedAt: new Date() },
                    $setOnInsert: { createdAt: new Date() },
                },
                { upsert: true },
            );

            // Update event type metrics
            await this.db.collection('event_type_metrics').updateOne(
                { eventType: event.eventType, date },
                {
                    $inc: { count: 1 },
                    $addToSet: { uniqueUsers: event.userId },
                    $set: { updatedAt: new Date() },
                    $setOnInsert: { createdAt: new Date() },
                },
                { upsert: true },
            );

            // Update user aggregates
            await this.db.collection('user_aggregates').updateOne(
                { userId: event.userId },
                {
                    $inc: { totalEvents: 1, [`eventCounts.${event.eventType}`]: 1 },
                    $set: { lastActivityAt: new Date(), updatedAt: new Date() },
                    $setOnInsert: { firstSeenAt: new Date(), createdAt: new Date() },
                },
                { upsert: true },
            );

            // Handle purchase events
            if (event.eventType === 'purchase' && event.data.amount) {
                await this.db.collection('daily_metrics').updateOne(
                    { date },
                    { $inc: { totalRevenue: event.data.amount } },
                );

                await this.db.collection('user_aggregates').updateOne(
                    { userId: event.userId },
                    { $inc: { totalRevenue: event.data.amount } },
                );
            }
        } catch (error) {
            console.error('MongoDB update error:', error);
            throw error;
        }
    }
}
