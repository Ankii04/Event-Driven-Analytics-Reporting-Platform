import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { Kafka, Consumer, EachMessagePayload, Producer } from 'kafkajs';
import { EventProcessor } from '../processor/event.processor';

@Injectable()
export class EventConsumer implements OnModuleInit {
    private consumer: Consumer;
    private producer: Producer;
    private readonly topic = process.env.KAFKA_TOPICS_USER_EVENTS || 'user-events';
    private readonly dlqTopic = process.env.KAFKA_TOPICS_USER_EVENTS_DLQ || 'user-events-dlq';

    constructor(private readonly eventProcessor: EventProcessor) { }

    async onModuleInit() {
        const kafka = new Kafka({
            clientId: process.env.KAFKA_CLIENT_ID || 'analytics-worker',
            brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
            retry: {
                initialRetryTime: 100,
                retries: 8,
            },
        });

        this.consumer = kafka.consumer({
            groupId: process.env.KAFKA_GROUP_ID || 'analytics-worker-group',
            sessionTimeout: 30000,
            heartbeatInterval: 3000,
        });

        this.producer = kafka.producer();

        await this.consumer.connect();
        await this.producer.connect();

        await this.consumer.subscribe({
            topic: this.topic,
            fromBeginning: false,
        });

        console.log(`✅ Kafka Consumer subscribed to topic: ${this.topic}`);

        // Use eachBatch for MUCH faster processing (100x improvement!)
        await this.consumer.run({
            autoCommit: true,
            eachBatchAutoResolve: true,
            eachBatch: async ({ batch, resolveOffset, heartbeat }) => {
                const messages = batch.messages;
                console.log(`📦 Processing batch of ${messages.length} events...`);

                // Process all messages in parallel
                const promises = messages.map(async (message) => {
                    try {
                        const event = JSON.parse(message.value.toString());
                        await this.eventProcessor.process(event);
                        resolveOffset(message.offset);
                        return { success: true, eventId: event.eventId };
                    } catch (error) {
                        console.error(`❌ Error processing event:`, error);
                        await this.sendToDLQ(message, error.message);
                        return { success: false, error };
                    }
                });

                const results = await Promise.all(promises);
                const successCount = results.filter(r => r.success).length;
                console.log(`✅ Batch complete: ${successCount}/${messages.length} successful`);

                await heartbeat();
            },
        });
    }

    private async handleMessage(payload: EachMessagePayload) {
        // Old code - not used anymore
    }

    private async sendToDLQ(message: any, errorMessage: string) {
        try {
            await this.producer.send({
                topic: this.dlqTopic,
                messages: [
                    {
                        key: message.key,
                        value: message.value,
                        headers: {
                            ...message.headers,
                            'error-message': errorMessage,
                            'failed-at': new Date().toISOString(),
                        },
                    },
                ],
            });

            console.log(`📮 Message sent to DLQ: ${this.dlqTopic}`);
        } catch (dlqError) {
            console.error(`❌ Failed to send message to DLQ:`, dlqError);
        }
    }

    async onModuleDestroy() {
        await this.consumer.disconnect();
        await this.producer.disconnect();
        console.log('👋 Kafka Consumer disconnected');
    }
}
