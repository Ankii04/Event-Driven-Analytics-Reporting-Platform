import { Module } from '@nestjs/common';
import { KafkaModule } from './kafka/kafka.module';
import { EventsModule } from './events/events.module';

@Module({
    imports: [KafkaModule, EventsModule],
})
export class AppModule { }
