import { Module } from '@nestjs/common';
import { EventConsumer } from './event.consumer';
import { ProcessorModule } from '../processor/processor.module';

@Module({
    imports: [ProcessorModule],
    providers: [EventConsumer],
})
export class KafkaModule { }
