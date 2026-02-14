import { IsString, IsNotEmpty, IsObject, IsOptional, IsDateString } from 'class-validator';

export class CreateEventDto {
    @IsString()
    @IsNotEmpty()
    eventType: string;

    @IsString()
    @IsNotEmpty()
    userId: string;

    @IsObject()
    @IsNotEmpty()
    data: Record<string, any>;

    @IsObject()
    @IsOptional()
    metadata?: Record<string, any>;

    @IsDateString()
    @IsOptional()
    timestamp?: string;
}
