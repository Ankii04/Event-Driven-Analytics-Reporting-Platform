import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from root .env file
config({ path: resolve(__dirname, '../../../.env') });

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { Logger } from './common/logger';

async function bootstrap() {
    const logger = new Logger('Bootstrap');

    const app = await NestFactory.create(AppModule, {
        logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    // Global validation pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    // Enable CORS
    app.enableCors({
        origin: process.env.CORS_ORIGIN || '*',
        credentials: true,
    });

    const port = process.env.PORT || 4000;
    await app.listen(port);

    logger.log(`🚀 API Gateway running on http://localhost:${port}/graphql`);
    logger.log(`📊 Health check: http://localhost:${port}/health`);
}

bootstrap();
