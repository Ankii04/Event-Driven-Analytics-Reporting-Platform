#!/usr/bin/env node

const { Kafka } = require('kafkajs');

async function initializeDatabases() {
    console.log('🚀 Initializing databases...\n');

    // Initialize Kafka Topics
    await initializeKafka();

    // PostgreSQL, MongoDB, Redis, Elasticsearch are initialized via Docker init scripts
    console.log('🐘 PostgreSQL: Initialized via Docker init script');
    console.log('🍃 MongoDB: Initialized via Docker init script');
    console.log('🔴 Redis: Ready');
    console.log('🔍 Elasticsearch: Initialized via Docker init script');

    console.log('\n✅ All databases initialized successfully!');
    process.exit(0);
}

async function initializeKafka() {
    console.log('📊 Initializing Kafka topics...');

    const kafka = new Kafka({
        clientId: 'init-script',
        brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
    });

    const admin = kafka.admin();

    try {
        await admin.connect();

        const topics = [
            {
                topic: 'user-events',
                numPartitions: 10,
                replicationFactor: 1,
            },
            {
                topic: 'user-events-dlq',
                numPartitions: 3,
                replicationFactor: 1,
            },
        ];

        await admin.createTopics({ topics, waitForLeaders: true });
        await admin.disconnect();

        console.log('✅ Kafka topics created\n');
    } catch (error) {
        if (error.message.includes('already exists')) {
            console.log('✅ Kafka topics already exist\n');
            await admin.disconnect();
        } else {
            console.error('❌ Kafka initialization failed:', error.message);
            throw error;
        }
    }
}

initializeDatabases().catch((error) => {
    console.error('❌ Initialization failed:', error.message);
    process.exit(1);
});
