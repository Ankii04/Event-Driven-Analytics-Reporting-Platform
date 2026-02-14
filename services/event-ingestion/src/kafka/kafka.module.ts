import { Module, Global } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';

const kafkaProducerFactory = {
    provide: 'KAFKA_PRODUCER',
    useFactory: async (): Promise<Producer> => {
        const kafka = new Kafka({
            clientId: process.env.KAFKA_CLIENT_ID || 'event-ingestion-service',
            brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
            retry: {
                initialRetryTime: 100,
                retries: 8,
            },
        });

        const producer = kafka.producer({
            allowAutoTopicCreation: true,
            transactionTimeout: 30000,
        });

        await producer.connect();
        console.log('✅ Kafka Producer connected');

        return producer;
    },
};

@Global()
@Module({
    providers: [kafkaProducerFactory],
    exports: ['KAFKA_PRODUCER'],
})
export class KafkaModule { }
