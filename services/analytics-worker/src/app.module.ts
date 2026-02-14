import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { KafkaModule } from './kafka/kafka.module';
import { ProcessorModule } from './processor/processor.module';

@Module({
    imports: [DatabaseModule, ProcessorModule, KafkaModule],
})
export class AppModule { }
