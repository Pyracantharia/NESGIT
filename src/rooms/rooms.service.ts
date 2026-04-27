import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service.js";

@Injectable()
export class RoomsService {
  constructor(private prisma: PrismaService) {}

  async createRoom(name: string, authorId: string, isPrivate: boolean = false) {
    return this.prisma.room.create({
      data: {
        name,
        authorId,
        isPrivate,
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
    canSeeHistory?: boolean,
  ) {
    const updateData =
      typeof canSeeHistory === "boolean"
        ? {
            canSeeHistory,
          }
        : {};

    return this.prisma.roomParticipant.upsert({
      where: {
        userId_roomId: {
          userId,
          roomId,
        },
      },
      update: updateData,
      create: {
        roomId,
        userId,
        canSeeHistory: canSeeHistory ?? true,
      },
    });
  }

  async inviteParticipant(roomId: number, userId: string, canSeeHistory: boolean) {
    return this.ensureParticipant(roomId, userId, canSeeHistory);
  }

  async findParticipant(roomId: number, userId: string) {
    return this.prisma.roomParticipant.findUnique({
      where: {
        userId_roomId: {
          roomId,
          userId,
        },
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

  async findVisibleRooms(userId: string) {
    return this.prisma.room.findMany({
      where: {
        OR: [
          { isPrivate: false },
          {
            participants: {
              some: { userId },
            },
          },
        ],
      },
      include: {
        author: true,
        participants: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async findById(roomId: number) {
    return this.prisma.room.findUnique({
      where: { id: roomId },
      include: { participants: true },
    });
  }
}
