import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { EventsService } from './events.service';

@Resolver()
export class EventsResolver {
    constructor(private readonly eventsService: EventsService) { }

    @Mutation(() => Boolean)
    @Throttle({ default: { limit: 50000, ttl: 60000 } })
    async trackEvent(
        @Args('eventType') eventType: string,
        @Args('userId') userId: string,
        @Args('data', { type: () => String }) data: string,
    ): Promise<boolean> {
        const parsedData = JSON.parse(data);
        await this.eventsService.publishEvent(eventType, userId, parsedData);
        return true;
    }
}
