import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from root .env file
config({ path: resolve(__dirname, '../../../.env') });

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);

    console.log('🚀 Analytics Worker Service started');
    console.log('📊 Consuming events from Kafka...');

    // Keep the application running
    process.on('SIGTERM', async () => {
        console.log('SIGTERM received, shutting down gracefully...');
        await app.close();
        process.exit(0);
    });
}

bootstrap();
