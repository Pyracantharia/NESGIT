import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service.js";

@Injectable()
export class RoomsService {
  constructor(private prisma: PrismaService) {}

  async createRoom(name: string, authorId: string) {
    return this.prisma.room.create({
      data: {
        name,
        authorId,
        participants: {
          create: {
            userId: authorId,
            canSeeHistory: true,
          },
        },
      },
      include: {
        participants: true,
      },
    });
  }

  async addParticipant(roomId: number, userId: string, canSeeHistory: boolean) {
    return this.prisma.roomParticipant.create({
      data: {
        roomId,
        userId,
        canSeeHistory,
      },
    });
  }

  async findUserRooms(userId: string) {
    return this.prisma.room.findMany({
      where: {
        participants: {
          some: { userId },
        },
      },
      include: {
        author: true,
      },
    });
  }
}
