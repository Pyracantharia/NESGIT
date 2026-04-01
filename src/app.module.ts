import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule, JwtService } from "@nestjs/jwt";
import { ScheduleModule } from "@nestjs/schedule";
import "dotenv/config";

import { AuthModule } from "./auth/auth.module.js";
import { UsersModule } from "./users/users.module.js";
import { MessagesModule } from "./messages/messages.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get("JWT_SECRET"),
        signOptions: { expiresIn: "1h" },
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    ScheduleModule.forRoot(),
    MessagesModule,
  ],
  providers: [JwtService],
})
export class AppModule {}
