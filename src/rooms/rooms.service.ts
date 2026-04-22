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

  async ensureParticipant(
    roomId: number,
    userId: string,
    canSeeHistory: boolean = true,
  ) {
    return this.prisma.roomParticipant.upsert({
      where: {
        userId_roomId: {
          userId,
          roomId,
        },
      },
      update: {
        canSeeHistory,
      },
      create: {
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
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async findAllRooms() {
    return this.prisma.room.findMany({
      include: {
        author: true,
        participants: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }
}
