import { Module } from '@nestjs/common';
import { MessagesGateway } from './messages.gateway.js';
import { MessagesService } from './messages.service.js';
import { PrismaService } from '../prisma.service.js';

@Module({
    providers: [MessagesGateway, MessagesService, PrismaService],
})
export class MessagesModule { }