import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class PostgresRepository {
    constructor(@Inject('POSTGRES_POOL') private readonly pool: Pool) { }

    async saveEvent(event: any): Promise<void> {
        const query = `
      INSERT INTO events (event_id, event_type, user_id, timestamp, data, metadata, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (event_id) DO NOTHING
    `;

        const values = [
            event.eventId,
            event.eventType,
            event.userId,
            event.timestamp,
            JSON.stringify(event.data),
            JSON.stringify(event.metadata || {}),
        ];

        try {
            await this.pool.query(query, values);
        } catch (error) {
            console.error('PostgreSQL save error:', error);
            throw error;
        }
    }
}
