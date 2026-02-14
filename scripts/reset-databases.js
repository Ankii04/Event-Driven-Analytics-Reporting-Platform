#!/usr/bin/env node

const { Client } = require('pg');
const { MongoClient } = require('mongodb');
const { createClient } = require('redis');
const { Client: ElasticsearchClient } = require('@elastic/elasticsearch');
require('dotenv').config();

async function resetDatabases() {
    console.log('🧹 Starting database reset...\n');

    // 1. Reset PostgreSQL
    try {
        const pgClient = new Client({
            host: process.env.POSTGRES_HOST || 'localhost',
            port: parseInt(process.env.POSTGRES_PORT || '5432'),
            user: process.env.POSTGRES_USER || 'analytics',
            password: process.env.POSTGRES_PASSWORD || 'analytics123',
            database: process.env.POSTGRES_DB || 'analytics_db',
        });
        await pgClient.connect();
        await pgClient.query('TRUNCATE TABLE events CASCADE');
        await pgClient.end();
        console.log('🐘 PostgreSQL: events table truncated');
    } catch (e) {
        console.warn('⚠️ PostgreSQL reset failed (might not be installed locally):', e.message);
    }

    // 2. Reset MongoDB
    try {
        const mongoClient = new MongoClient(process.env.MONGODB_URI || 'mongodb://analytics:analytics123@localhost:27017/analytics_db?authSource=admin');
        await mongoClient.connect();
        const db = mongoClient.db();
        await db.collection('daily_metrics').deleteMany({});
        await db.collection('event_type_metrics').deleteMany({});
        await db.collection('user_aggregates').deleteMany({});
        await mongoClient.close();
        console.log('🍃 MongoDB: Collections cleared');
    } catch (e) {
        console.warn('⚠️ MongoDB reset failed:', e.message);
    }

    // 3. Reset Redis
    try {
        const redisClient = createClient({
            url: `redis://${process.env.REDIS_PASSWORD ? `:${process.env.REDIS_PASSWORD}@` : ''}${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`
        });
        await redisClient.connect();
        await redisClient.flushAll();
        await redisClient.disconnect();
        console.log('🔴 Redis: Database flushed');
    } catch (e) {
        console.warn('⚠️ Redis reset failed:', e.message);
    }

    // 4. Reset Elasticsearch
    try {
        const esClient = new ElasticsearchClient({
            node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200'
        });
        const indexName = process.env.ELASTICSEARCH_INDEX_EVENTS || 'user-events';
        const exists = await esClient.indices.exists({ index: indexName });
        if (exists) {
            await esClient.deleteByQuery({
                index: indexName,
                body: { query: { match_all: {} } }
            });
        }
        console.log('🔍 Elasticsearch: Index cleared');
    } catch (e) {
        console.warn('⚠️ Elasticsearch reset failed:', e.message);
    }

    console.log('\n✨ Database reset complete! Your platform is now empty and ready for a new demo.');
}

resetDatabases().catch(console.error);
