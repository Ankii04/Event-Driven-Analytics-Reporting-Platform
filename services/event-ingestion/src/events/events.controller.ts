import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';

@Controller('events')
export class EventsController {
    constructor(private readonly eventsService: EventsService) { }

    @Post()
    @HttpCode(HttpStatus.ACCEPTED)
    async create(@Body() createEventDto: CreateEventDto) {
        const result = await this.eventsService.publishEvent(createEventDto);
        return {
            status: 'accepted',
            ...result,
        };
    }
}
