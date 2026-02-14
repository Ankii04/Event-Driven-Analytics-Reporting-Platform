import { Module, Global } from '@nestjs/common';
import { MongoClient } from 'mongodb';
import { createClient } from 'redis';
import { Client as ElasticsearchClient } from '@elastic/elasticsearch';

const mongoProvider = {
    provide: 'MONGO_CLIENT',
    useFactory: async () => {
        const client = new MongoClient(
            process.env.MONGODB_URI || 'mongodb://analytics:analytics123@localhost:27017/analytics_db?authSource=admin',
        );

        await client.connect();
        console.log('✅ MongoDB connected');

        return client.db('analytics_db');
    },
};

const redisProvider = {
    provide: 'REDIS_CLIENT',
    useFactory: async () => {
        const client = createClient({
            socket: {
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT || '6379', 10),
            },
            password: process.env.REDIS_PASSWORD,
        });

        await client.connect();
        console.log('✅ Redis connected');

        return client;
    },
};

const elasticsearchProvider = {
    provide: 'ELASTICSEARCH_CLIENT',
    useFactory: () => {
        const client = new ElasticsearchClient({
            node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
        });

        console.log('✅ Elasticsearch client created');
        return client;
    },
};

@Global()
@Module({
    providers: [mongoProvider, redisProvider, elasticsearchProvider],
    exports: ['MONGO_CLIENT', 'REDIS_CLIENT', 'ELASTICSEARCH_CLIENT'],
})
export class DatabaseModule { }
