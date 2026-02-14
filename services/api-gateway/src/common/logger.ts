import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';

@Injectable()
export class Logger implements LoggerService {
    private logger: winston.Logger;
    private context: string;

    constructor(context?: string) {
        this.context = context || 'Application';

        this.logger = winston.createLogger({
            level: process.env.LOG_LEVEL || 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.json(),
            ),
            defaultMeta: { service: 'api-gateway', context: this.context },
            transports: [
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.colorize(),
                        winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
                            return `${timestamp} [${context}] ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
                                }`;
                        }),
                    ),
                }),
            ],
        });
    }

    log(message: string, meta?: any) {
        this.logger.info(message, { ...meta, context: this.context });
    }

    error(message: string, trace?: string, meta?: any) {
        this.logger.error(message, { ...meta, trace, context: this.context });
    }

    warn(message: string, meta?: any) {
        this.logger.warn(message, { ...meta, context: this.context });
    }

    debug(message: string, meta?: any) {
        this.logger.debug(message, { ...meta, context: this.context });
    }

    verbose(message: string, meta?: any) {
        this.logger.verbose(message, { ...meta, context: this.context });
    }
}
