import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { EventProcessor } from './event.processor';
import { PostgresRepository } from './repositories/postgres.repository';
import { MongoRepository } from './repositories/mongo.repository';
import { RedisRepository } from './repositories/redis.repository';
import { ElasticsearchRepository } from './repositories/elasticsearch.repository';

@Module({
    imports: [DatabaseModule],
    providers: [
        EventProcessor,
        PostgresRepository,
        MongoRepository,
        RedisRepository,
        ElasticsearchRepository,
    ],
    exports: [
        EventProcessor,
        PostgresRepository,
        MongoRepository,
        RedisRepository,
        ElasticsearchRepository,
    ],
})
export class ProcessorModule { }
