import { Module, Global } from '@nestjs/common';
import { createClient } from 'redis';

const redisClientFactory = {
    provide: 'REDIS_CLIENT',
    useFactory: async () => {
        const redisPassword = process.env.REDIS_PASSWORD;
        console.log('🔍 Redis Config:', {
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || '6379',
            hasPassword: !!redisPassword,
            passwordLength: redisPassword?.length || 0
        });

        const redisConfig: any = {
            socket: {
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT || '6379', 10),
            },
            database: parseInt(process.env.REDIS_DB || '0', 10),
        };

        // Only add password if it's defined and not empty
        if (redisPassword && redisPassword.trim() !== '') {
            redisConfig.password = redisPassword;
        }

        const client = createClient(redisConfig);

        client.on('error', (err) => console.error('❌ Redis Client Error:', err));
        client.on('connect', () => console.log('✅ Redis connected'));
        client.on('ready', () => console.log('✅ Redis ready'));
        client.on('reconnecting', () => console.log('🔄 Redis reconnecting...'));

        try {
            await client.connect();
            console.log('✅ Redis client.connect() completed successfully');
        } catch (error) {
            console.error('❌ Redis connection failed:', error);
            throw error;
        }
        return client;
    },
};

@Global()
@Module({
    providers: [redisClientFactory],
    exports: ['REDIS_CLIENT'],
})
export class RedisModule { }
