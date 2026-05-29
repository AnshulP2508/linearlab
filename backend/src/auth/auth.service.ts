import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomInt, randomUUID } from 'crypto';
import { ObjectId } from 'mongodb';
import { AccountStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  assertStrongPassword,
  MIN_BCRYPT_ROUNDS,
} from '../common/password-policy';
import { SecurityMonitorService } from '../common/security-monitor.service';
import { CheckEmailDto } from './dto/check-email.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { AuthSessionService } from './auth-session.service';
import { EmailService } from './email.service';
import { JwtUserPayload } from './jwt.strategy';
import { MongoDatabaseService } from '../mongo/mongo-database.service';

const OTP_TTL_MS = 10 * 60 * 1000;
const ADMIN_EMAIL = 'admin@gmail.com';

type TokenUser = {
  id: string;
  email: string;
  role: Role;
};

type EmailOtpDocument = {
  _id: string;
  email: string;
  otp: string;
  expiresAt: Date;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type UserDocument = {
  _id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  status: AccountStatus;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly sessions: AuthSessionService,
    private readonly securityMonitor: SecurityMonitorService,
    private readonly mongo: MongoDatabaseService,
    private readonly emailService: EmailService,
  ) {}

  async checkEmail(dto: CheckEmailDto) {
    const email = this.normalizeEmail(dto.email);
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    return { exists: Boolean(user) };
  }

  async sendOtp(dto: SendOtpDto) {
    const email = this.normalizeEmail(dto.email);
    await this.assertCanUseOtpSignup(email);

    const otp = randomInt(100000, 1000000).toString();
    const hashedOtp = await bcrypt.hash(otp, MIN_BCRYPT_ROUNDS);
    const now = new Date();

    await (await this.emailOtpCollection()).insertOne({
      _id: randomUUID(),
      email,
      otp: hashedOtp,
      expiresAt: new Date(now.getTime() + OTP_TTL_MS),
      verified: false,
      createdAt: now,
      updatedAt: now,
    });

    await this.emailService.sendOtp(email, otp);
    return { ok: true };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const email = this.normalizeEmail(dto.email);
    const otpRecord = await this.getLatestOtp(email);

    if (!otpRecord) {
      throw new BadRequestException('OTP not found. Please request a new code.');
    }
    if (otpRecord.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException('OTP expired. Please request a new code.');
    }
    if (otpRecord.verified) {
      return { verified: true };
    }

    const ok = await bcrypt.compare(dto.otp, otpRecord.otp);
    if (!ok) {
      throw new BadRequestException('Invalid OTP');
    }

    await (await this.emailOtpCollection()).updateOne({
      _id: otpRecord._id,
    }, {
      $set: { verified: true, updatedAt: new Date() },
    });

    return { verified: true };
  }

  async register(dto: RegisterDto, ipAddress?: string) {
    const email = this.normalizeEmail(dto.email);
    if (email === ADMIN_EMAIL) {
      throw new BadRequestException('Admin account is seeded. Please sign in.');
    }
    assertStrongPassword(dto.password);

    const users = await this.userCollection();
    const existing = await users.findOne({ email }, { projection: { _id: 1 } });
    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const verifiedOtp = await this.getLatestOtp(email);
    if (
      !verifiedOtp?.verified ||
      verifiedOtp.expiresAt.getTime() <= Date.now()
    ) {
      throw new BadRequestException('Please verify your email before registering');
    }

    const password = await bcrypt.hash(dto.password, MIN_BCRYPT_ROUNDS);
    const now = new Date();
    const user: UserDocument = {
      _id: randomUUID(),
      email,
      password,
      name: this.nameFromEmail(email),
      role: this.roleForEmail(email),
      status: AccountStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
    };

    await users.insertOne(user);
    await (await this.emailOtpCollection()).deleteMany({ email });
    return this.issueTokens(
      { id: user._id, email: user.email, role: user.role },
      ipAddress,
    );
  }

  async login(dto: LoginDto, ipAddress?: string) {
    const email = this.normalizeEmail(dto.email);

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

    return this.issueTokens(user, ipAddress);
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

  private async issueTokens(user: TokenUser, _ipAddress?: string) {
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

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private async assertCanUseOtpSignup(email: string) {
    if (email === ADMIN_EMAIL) {
      throw new BadRequestException('Admin account is seeded. Please sign in.');
    }

    const existing = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('Email is already registered');
    }
  }

  private async getLatestOtp(email: string) {
    return (await this.emailOtpCollection()).findOne(
      { email },
      { sort: { createdAt: -1 } },
    );
  }

  private roleForEmail(email: string) {
    if (email === ADMIN_EMAIL) return Role.ADMIN;
    if (email.endsWith('@linearloop.io')) return Role.DEVELOPER;
    return Role.USER;
  }

  private nameFromEmail(email: string) {
    const localPart = email.split('@')[0] || 'User';
    return localPart
      .replace(/[._-]+/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  private async emailOtpCollection() {
    const db = await this.mongo.getDb();
    return db.collection<EmailOtpDocument>('EmailOtp');
  }

  private async userCollection() {
    const db = await this.mongo.getDb();
    return db.collection<UserDocument>('User');
  }
}
