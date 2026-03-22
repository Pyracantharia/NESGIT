import { Module } from '@nestjs/common';
import { MessagesGateway } from './messages.gateway';
import { MessagesService } from './messages.service';
import { PrismaService } from '../prisma.service';

@Module({
    providers: [MessagesGateway, MessagesService, PrismaService],
})
export class MessagesModule { }