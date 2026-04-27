import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service.js";
import type { EnumTag } from "../../generated/prisma/enums.js";

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  private messageInclude = {
    user: true,
    reactions: {
      include: {
        user: {
          select: {
            id: true,
            username: true,
            color: true,
          },
        },
      },
    },
  } as const;

  async createMessage(userId: string, content: string, roomId: number) {
    const message = await this.prisma.message.create({
      data: {
        content,
        userId,
        roomId,
      },
      include: this.messageInclude,
    });
    return message;
  }

  async findAll() {
    return this.prisma.message.findMany({
      include: this.messageInclude,
      orderBy: { createdAt: "asc" },
    });
  }

  async findAllByRoom(roomId: number, requesterUserId: string) {
    const participant = await this.prisma.roomParticipant.findUnique({
      where: {
        userId_roomId: {
          userId: requesterUserId,
          roomId,
        },
      },
    });

    if (!participant) {
      return [];
    }

    const whereClause = participant.canSeeHistory
      ? { roomId }
      : {
          roomId,
          createdAt: {
            gte: participant.joinedAt,
          },
        };

    return this.prisma.message.findMany({
      where: whereClause,
      include: this.messageInclude,
      orderBy: { createdAt: "asc" },
    });
  }

  async addReaction(messageId: number, userId: string, type: EnumTag) {
    const existing = await this.prisma.tag.findFirst({
      where: {
        messageId,
        userId,
        type,
      },
    });

    if (!existing) {
      await this.prisma.tag.create({
        data: {
          messageId,
          userId,
          type,
        },
      });
    }

    return this.findOneWithRelations(messageId);
  }

  async removeReaction(messageId: number, userId: string, type: EnumTag) {
    const existing = await this.prisma.tag.findFirst({
      where: {
        messageId,
        userId,
        type,
      },
      select: { id: true },
    });

    if (existing) {
      await this.prisma.tag.delete({
        where: { id: existing.id },
      });
    }

    return this.findOneWithRelations(messageId);
  }

  async findOneWithRelations(messageId: number) {
    return this.prisma.message.findUnique({
      where: { id: messageId },
      include: this.messageInclude,
    });
  }
}
