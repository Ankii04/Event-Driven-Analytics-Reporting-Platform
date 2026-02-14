import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Logger } from '../common/logger';

@Injectable()
export class EventsService {
    private readonly logger = new Logger(EventsService.name);
    private readonly eventIngestionUrl = process.env.EVENT_INGESTION_URL || 'http://localhost:3001';

    constructor(private readonly httpService: HttpService) { }

    async publishEvent(eventType: string, userId: string, data: any): Promise<any> {
        try {
            const response = await firstValueFrom(
                this.httpService.post(`${this.eventIngestionUrl}/events`, {
                    eventType,
                    userId,
                    data,
                    timestamp: new Date().toISOString(),
                }),
            );

            this.logger.log('Event published successfully', { eventType, userId });
            return response.data;
        } catch (error) {
            this.logger.error('Failed to publish event', error.message, { eventType, userId });
            throw new Error('Failed to publish event');
        }
    }
}
