import {
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { RoomsService } from "./rooms.service.js";
import { UsersService } from "../users/users.service.js";

@WebSocketGateway({
  cors: { origin: "*" },
})
export class RoomsGateway {
  @WebSocketServer()
  server!: Server;
  private typingByRoom = new Map<number, Set<string>>();

  constructor(
    private readonly roomsService: RoomsService,
    private readonly usersService: UsersService,
  ) {}

  @SubscribeMessage("createRoom")
  async handleCreateRoom(
    @MessageBody() data: { name: string; authorId: string; isPrivate?: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    const room = await this.roomsService.createRoom(
      data.name,
      data.authorId,
      Boolean(data.isPrivate),
    );
    client.join(`room_${room.id}`); // L'auteur rejoint le canal socket
    return room;
  }

  @SubscribeMessage("joinRoom")
  async handleJoinRoom(
    @MessageBody() data: { roomId: number; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = await this.roomsService.findById(data.roomId);
    if (!room) {
      throw new BadRequestException("Room not found");
    }

    const isParticipant = room.participants.some(
      (participant) => participant.userId === data.userId,
    );

    if (room.isPrivate && !isParticipant) {
      throw new ForbiddenException("Private room access denied");
    }

    if (!room.isPrivate && !isParticipant) {
      await this.roomsService.ensureParticipant(data.roomId, data.userId);
    }

    client.join(`room_${data.roomId}`);
    client.emit("typingSnapshot", {
      roomId: data.roomId,
      users: Array.from(this.typingByRoom.get(data.roomId) ?? []),
    });
    return { status: "joined", roomId: data.roomId };
  }

  @SubscribeMessage("listRooms")
  async handleListRooms(@MessageBody() data: { userId: string }) {
    const rooms = await this.roomsService.findVisibleRooms(data.userId);
    return rooms;
  }

  @SubscribeMessage("inviteToRoom")
  async handleInviteToRoom(
    @MessageBody() data: { roomId: number; username: string; canSeeHistory: boolean },
  ) {
    const username = data.username.trim();
    if (!username) {
      throw new BadRequestException("Username is required");
    }

    const targetUser = await this.usersService.findOneByUsername(username);
    if (!targetUser) {
      throw new BadRequestException("User not found");
    }

    return this.roomsService.inviteParticipant(
      data.roomId,
      targetUser.id,
      data.canSeeHistory,
    );
  }

  // Gestion du "En train d'écrire" (Requirement TP)
  @SubscribeMessage("typing")
  handleTyping(
    @MessageBody()
    data: { roomId: number; username: string; isTyping: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    const currentSet = this.typingByRoom.get(data.roomId) ?? new Set<string>();
    if (data.isTyping) {
      currentSet.add(data.username);
    } else {
      currentSet.delete(data.username);
    }

    if (currentSet.size === 0) {
      this.typingByRoom.delete(data.roomId);
    } else {
      this.typingByRoom.set(data.roomId, currentSet);
    }

    // On diffuse à tout le monde dans le salon SAUF à celui qui écrit
    client.to(`room_${data.roomId}`).emit("userTyping", {
      username: data.username,
      isTyping: data.isTyping,
    });
    return { status: "typing-sent" };
  }
}
