import { Module } from '@nestjs/common';
import { ActionsResolver } from './actions.resolver';

@Module({
    providers: [ActionsResolver],
    exports: [ActionsResolver],
})
export class ActionsModule { }
