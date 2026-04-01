import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';

@Injectable()
export class MessagesService {
    constructor(private prisma: PrismaService) { }

    async createMessage(userId: string, content: string, roomId: number) {
        const message = await this.prisma.message.create({
            data: {
                content,
                userId,
                roomId,
            },
        });
        return message;
    }

    async findAll() {
        return this.prisma.message.findMany({
            include: { user: true },
            orderBy: { createdAt: 'asc' },
        });
    }

    async findAllByRoom(roomId: number) {
        return this.prisma.message.findMany({
            where: { roomId },
            include: { user: true },
            orderBy: { createdAt: 'asc' },
        });
    }
}