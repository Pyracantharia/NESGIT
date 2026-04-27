import { Module } from "@nestjs/common";
import { RoomsService } from "./rooms.service.js";
import { RoomsGateway } from "./rooms.gateway.js";
import { PrismaService } from "../prisma.service.js";
import { UsersModule } from "../users/users.module.js";

@Module({
  imports: [UsersModule],
  providers: [RoomsService, RoomsGateway, PrismaService],
  exports: [RoomsService],
})
export class RoomsModule {}
