import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ObjectId } from 'mongodb';
import { AccountStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MIN_BCRYPT_ROUNDS } from '../common/password-policy';
import { SecurityMonitorService } from '../common/security-monitor.service';
import { LoginDto } from './dto/login.dto';
import { AuthSessionService } from './auth-session.service';
import { JwtUserPayload } from './jwt.strategy';
import { MongoDatabaseService } from '../mongo/mongo-database.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly sessions: AuthSessionService,
    private readonly securityMonitor: SecurityMonitorService,
    private readonly mongo: MongoDatabaseService,
  ) {}

  async login(dto: LoginDto, ipAddress?: string) {
    const email = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    
    if (!user) {
      this.securityMonitor.recordAuthFailure(email, ipAddress);
      throw new UnauthorizedException();
    }

    const ok = await this.verifyPassword(dto.password, user.password);
    if (!ok) {
      this.securityMonitor.recordAuthFailure(email, ipAddress);
      throw new UnauthorizedException();
    }
    if (user.status !== AccountStatus.ACTIVE) {
      this.securityMonitor.recordAuthFailure(email, ipAddress);
      throw new UnauthorizedException('Account disabled');
    }

    await this.rehashPasswordIfNeeded(user.id, dto.password, user.password);
    
    const payload: JwtUserPayload = {
      sub: user.id,
      userId: user.id,
      email: user.email,
      role: user.role,
      tokenType: 'access',
    };
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '15m',
    });
    const refreshPayload: JwtUserPayload = {
      ...payload,
      tokenType: 'refresh',
    };
    const refreshToken = await this.jwtService.signAsync(refreshPayload, {
      expiresIn: `${this.sessions.getRefreshTokenTtlSeconds()}s`,
    });
    await this.sessions.createRefreshSession(user.id, refreshToken);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 15 * 60,
      role: user.role,
    };
  }

  async refresh(refreshToken: string) {
    let payload: JwtUserPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtUserPayload>(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (payload.tokenType !== 'refresh' || !payload.sub || !payload.email) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.sessions.validateRefreshSession(payload.sub, refreshToken);

    const accessPayload: JwtUserPayload = {
      sub: payload.sub,
      userId: payload.userId ?? payload.sub,
      email: payload.email,
      role: payload.role,
      tokenType: 'access',
    };
    const nextAccessToken = await this.jwtService.signAsync(accessPayload, {
      expiresIn: '15m',
    });
    const nextRefreshPayload: JwtUserPayload = {
      ...accessPayload,
      tokenType: 'refresh',
    };
    const nextRefreshToken = await this.jwtService.signAsync(nextRefreshPayload, {
      expiresIn: `${this.sessions.getRefreshTokenTtlSeconds()}s`,
    });
    await this.sessions.rotateRefreshSession(payload.sub, refreshToken, nextRefreshToken);

    return {
      access_token: nextAccessToken,
      refresh_token: nextRefreshToken,
      expires_in: 15 * 60,
      role: payload.role,
    };
  }

  async logout(refreshToken: string) {
    await this.sessions.revokeRefreshSession(refreshToken);
    return { ok: true };
  }

  private async rehashPasswordIfNeeded(
    userId: string,
    plainPassword: string,
    hashedPassword: string,
  ) {
    if (!this.isBcryptHash(hashedPassword)) {
      const nextHash = await bcrypt.hash(plainPassword, MIN_BCRYPT_ROUNDS);
      const users = (await this.mongo.getDb()).collection('User');
      await users.updateOne(
        { _id: new ObjectId(userId) },
        { $set: { password: nextHash, updatedAt: new Date() } },
      );
      return;
    }

    const rounds = Number(hashedPassword.split('$')[2] ?? 0);
    if (rounds >= MIN_BCRYPT_ROUNDS) {
      return;
    }

    const nextHash = await bcrypt.hash(plainPassword, MIN_BCRYPT_ROUNDS);
    const users = (await this.mongo.getDb()).collection('User');
    await users.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { password: nextHash, updatedAt: new Date() } },
    );
  }

  private async verifyPassword(
    plainPassword: string,
    storedPassword: string,
  ) {
    if (this.isBcryptHash(storedPassword)) {
      return bcrypt.compare(plainPassword, storedPassword);
    }

    return plainPassword === storedPassword;
  }

  private isBcryptHash(value: string) {
    return /^\$2[aby]\$\d{2}\$/.test(value);
  }
}
