import { Module } from "@nestjs/common";
import { RoomsService } from "./rooms.service.js";
import { RoomsGateway } from "./rooms.gateway.js";
import { PrismaService } from "../prisma.service.js";

@Module({
  providers: [RoomsService, RoomsGateway, PrismaService],
  exports: [RoomsService],
})
export class RoomsModule {}
