import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthResponse } from './dto/auth-response.dto.js';


import { UsersService } from '../users/users.service.js';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) { }

  async signIn(email: string, password: string): Promise<AuthResponse> {
    const user = await this.usersService.findOneByEmail(email);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException();
    }

    const payload = { sub: user.id, email: user.email };

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async register(
    email: string,
    password: string,
    username: string,
    color: string,
  ): Promise<AuthResponse> {
    await this.ensureEmailNotExists(email);

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.usersService.create({
      email,
      password: hashedPassword,
      username,
      color,
    });

    return this.generateToken(user.id, user.email);
  }

  private async ensureEmailNotExists(email: string): Promise<void> {
    const existingUser = await this.usersService.findOneByEmail(email);
    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }
  }

  private async generateToken(userId: string, email: string): Promise<AuthResponse> {
    const payload = { sub: userId, email };
    const access_token = await this.jwtService.signAsync(payload);
    return { access_token };
  }
}
