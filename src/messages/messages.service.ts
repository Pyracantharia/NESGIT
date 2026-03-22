import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class MessagesService {
    constructor(private prisma: PrismaService) { }

    async createMessage(userId: string, content: string) {
        return this.prisma.message.create({
            data: {
                content,
                userId,
            },
            include: {
                user: true,
            },
        });
    }

    async findAll() {
        return this.prisma.message.findMany({
            include: { user: true },
            orderBy: { createdAt: 'asc' },
        });
    }
}