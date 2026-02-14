import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from root .env file
config({ path: resolve(__dirname, '../../../.env') });

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    app.enableCors();

    const port = process.env.PORT || 3003;
    await app.listen(port);

    console.log(`🚀 Query Service running on http://localhost:${port}`);
}

bootstrap();
