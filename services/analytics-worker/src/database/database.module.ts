import { Module, Global } from '@nestjs/common';
import { Pool } from 'pg';
import { MongoClient } from 'mongodb';
import { createClient } from 'redis';
import { Client as ElasticsearchClient } from '@elastic/elasticsearch';

// PostgreSQL
const postgresProvider = {
    provide: 'POSTGRES_POOL',
    useFactory: () => {
        const pool = new Pool({
            host: process.env.POSTGRES_HOST || 'localhost',
            port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
            user: process.env.POSTGRES_USER || 'analytics',
            password: process.env.POSTGRES_PASSWORD || 'analytics123',
            database: process.env.POSTGRES_DB || 'analytics_db',
            min: parseInt(process.env.POSTGRES_POOL_MIN || '2', 10),
            max: parseInt(process.env.POSTGRES_POOL_MAX || '10', 10),
        });

        pool.on('connect', () => console.log('✅ PostgreSQL connected'));
        pool.on('error', (err) => console.error('❌ PostgreSQL error:', err));

        return pool;
    },
};

// MongoDB
const mongoProvider = {
    provide: 'MONGO_CLIENT',
    useFactory: async () => {
        const client = new MongoClient(
            process.env.MONGODB_URI || 'mongodb://analytics:analytics123@localhost:27017/analytics_db?authSource=admin',
            {
                maxPoolSize: parseInt(process.env.MONGODB_POOL_SIZE || '10', 10),
            },
        );

        await client.connect();
        console.log('✅ MongoDB connected');

        return client.db('analytics_db');
    },
};

// Redis
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

        client.on('error', (err) => console.error('❌ Redis error:', err));
        await client.connect();
        console.log('✅ Redis connected');

        return client;
    },
};

// Elasticsearch
const elasticsearchProvider = {
    provide: 'ELASTICSEARCH_CLIENT',
    useFactory: () => {
        const client = new ElasticsearchClient({
            node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
            maxRetries: parseInt(process.env.ELASTICSEARCH_MAX_RETRIES || '3', 10),
            requestTimeout: 30000,
        });

        console.log('✅ Elasticsearch client created');
        return client;
    },
};

@Global()
@Module({
    providers: [postgresProvider, mongoProvider, redisProvider, elasticsearchProvider],
    exports: ['POSTGRES_POOL', 'MONGO_CLIENT', 'REDIS_CLIENT', 'ELASTICSEARCH_CLIENT'],
})
export class DatabaseModule { }
