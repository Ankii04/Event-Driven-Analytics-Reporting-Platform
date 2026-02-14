import { Injectable, Inject } from '@nestjs/common';
import { Producer } from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';
import { CreateEventDto } from './dto/create-event.dto';

@Injectable()
export class EventsService {
    private readonly topic = process.env.KAFKA_TOPICS_USER_EVENTS || 'user-events';

    constructor(
        @Inject('KAFKA_PRODUCER') private readonly producer: Producer,
    ) { }

    async publishEvent(createEventDto: CreateEventDto): Promise<{ eventId: string }> {
        const eventId = uuidv4();

        const event = {
            eventId,
            eventType: createEventDto.eventType,
            userId: createEventDto.userId,
            timestamp: createEventDto.timestamp || new Date().toISOString(),
            data: createEventDto.data,
            metadata: createEventDto.metadata || {},
        };

        try {
            await this.producer.send({
                topic: this.topic,
                messages: [
                    {
                        key: createEventDto.userId, // Partition by userId for ordering
                        value: JSON.stringify(event),
                        headers: {
                            'event-type': createEventDto.eventType,
                            'event-id': eventId,
                        },
                    },
                ],
            });

            console.log(`✅ Event published: ${eventId} (${createEventDto.eventType})`);
            return { eventId };
        } catch (error) {
            console.error('❌ Failed to publish event:', error);
            throw new Error('Failed to publish event to Kafka');
        }
    }
}
