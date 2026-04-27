import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  MessageBody,
  ConnectedSocket,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { RoomsService } from "./rooms.service.js";

@WebSocketGateway({
  cors: { origin: "*" },
})
export class RoomsGateway {
  @WebSocketServer()
  server!: Server;
  private typingByRoom = new Map<number, Set<string>>();

  constructor(private readonly roomsService: RoomsService) {}

  @SubscribeMessage("createRoom")
  async handleCreateRoom(
    @MessageBody() data: { name: string; authorId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = await this.roomsService.createRoom(data.name, data.authorId);
    client.join(`room_${room.id}`); // L'auteur rejoint le canal socket
    return room;
  }

  @SubscribeMessage("joinRoom")
  async handleJoinRoom(
    @MessageBody() data: { roomId: number; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    await this.roomsService.ensureParticipant(data.roomId, data.userId, true);
    client.join(`room_${data.roomId}`);
    client.emit("typingSnapshot", {
      roomId: data.roomId,
      users: Array.from(this.typingByRoom.get(data.roomId) ?? []),
    });
    return { status: "joined", roomId: data.roomId };
  }

  @SubscribeMessage("listRooms")
  async handleListRooms() {
    const rooms = await this.roomsService.findAllRooms();
    return rooms;
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
