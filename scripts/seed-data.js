#!/usr/bin/env node

const axios = require('axios');

const EVENT_INGESTION_URL = process.env.EVENT_INGESTION_URL || 'http://localhost:3001';
const NUM_EVENTS = parseInt(process.argv[2]) || 1000;

const eventTypes = ['purchase', 'view', 'click', 'add_to_cart', 'search'];
const products = ['prod_001', 'prod_002', 'prod_003', 'prod_004', 'prod_005'];

function generateRandomEvent() {
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const userId = `user_${Math.floor(Math.random() * 100)}`;
    const productId = products[Math.floor(Math.random() * products.length)];

    const event = {
        eventType,
        userId,
        data: {
            productId,
            timestamp: new Date().toISOString(),
        },
        metadata: {
            source: 'seed-script',
            ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        },
    };

    if (eventType === 'purchase') {
        event.data.amount = Math.floor(Math.random() * 500) + 10;
        event.data.currency = 'USD';
        event.data.paymentMethod = Math.random() > 0.5 ? 'card' : 'paypal';
    }

    return event;
}

async function seedEvents() {
    console.log(`🌱 Seeding ${NUM_EVENTS} events to ${EVENT_INGESTION_URL}...\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < NUM_EVENTS; i++) {
        const event = generateRandomEvent();

        try {
            await axios.post(`${EVENT_INGESTION_URL}/events`, event);
            successCount++;

            if ((i + 1) % 100 === 0) {
                console.log(`  ✅ Sent ${i + 1}/${NUM_EVENTS} events`);
            }
        } catch (error) {
            errorCount++;
            console.error(`  ❌ Failed to send event ${i + 1}:`, error.message);
        }

        // Small delay to avoid overwhelming the system
        if (i % 10 === 0) {
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
    }

    console.log(`\n📊 Seeding complete!`);
    console.log(`  ✅ Success: ${successCount}`);
    console.log(`  ❌ Errors: ${errorCount}`);
}

seedEvents().catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
});
