import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  MessageBody,
  ConnectedSocket,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { MessagesService } from "./messages.service.js";
import { EnumTag } from "../../generated/prisma/enums.js";

@WebSocketGateway({
  cors: { origin: "*" },
})
export class MessagesGateway {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly messagesService: MessagesService) {}

  @SubscribeMessage("sendMessage")
  async handleMessage(
    @MessageBody() data: { content: string; userId: string; roomId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const message = await this.messagesService.createMessage(
      data.userId,
      data.content,
      data.roomId,
    );

    this.server.to(`room_${data.roomId}`).emit("newMessage", message);
    return message;
  }

  @SubscribeMessage("findAllMessages")
  async findAll() {
    const messages = await this.messagesService.findAll();
    return messages;
  }

  @SubscribeMessage("findMessagesByRoom")
  async findMessagesByRoom(@MessageBody() data: { roomId: number; userId: string }) {
    return this.messagesService.findAllByRoom(data.roomId, data.userId);
  }

  @SubscribeMessage("addReaction")
  async handleAddReaction(
    @MessageBody()
    data: { messageId: number; userId: string; roomId: number; type: EnumTag },
  ) {
    const updatedMessage = await this.messagesService.addReaction(
      data.messageId,
      data.userId,
      data.type,
    );

    this.server.to(`room_${data.roomId}`).emit("messageUpdated", updatedMessage);
    return updatedMessage;
  }

  @SubscribeMessage("removeReaction")
  async handleRemoveReaction(
    @MessageBody()
    data: { messageId: number; userId: string; roomId: number; type: EnumTag },
  ) {
    const updatedMessage = await this.messagesService.removeReaction(
      data.messageId,
      data.userId,
      data.type,
    );

    this.server.to(`room_${data.roomId}`).emit("messageUpdated", updatedMessage);
    return updatedMessage;
  }
}
