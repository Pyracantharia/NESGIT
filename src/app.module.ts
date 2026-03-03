import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import 'dotenv/config';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MessagesGateway } from './messages/messages.gateway';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    ScheduleModule.forRoot(),
  ],
  providers: [JwtService, MessagesGateway],
})
export class AppModule {}
