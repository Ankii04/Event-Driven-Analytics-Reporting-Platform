import { Injectable, Inject } from '@nestjs/common';
import { Client } from '@elastic/elasticsearch';

@Injectable()
export class ElasticsearchRepository {
    private readonly indexName = process.env.ELASTICSEARCH_INDEX_EVENTS || 'user-events';

    constructor(@Inject('ELASTICSEARCH_CLIENT') private readonly esClient: Client) { }

    async indexEvent(event: any): Promise<void> {
        try {
            await this.esClient.index({
                index: this.indexName,
                id: event.eventId,
                document: {
                    eventId: event.eventId,
                    eventType: event.eventType,
                    userId: event.userId,
                    timestamp: event.timestamp,
                    data: event.data,
                    metadata: event.metadata,
                    createdAt: new Date(),
                },
            });
        } catch (error) {
            console.error('Elasticsearch index error:', error);
            throw error;
        }
    }
}
