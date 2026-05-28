import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID, createHash } from 'crypto';
import { MongoDatabaseService } from '../mongo/mongo-database.service';

type RefreshSessionDocument = {
  _id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class AuthSessionService {
  constructor(
    private readonly mongo: MongoDatabaseService,
    private readonly config: ConfigService,
  ) {}

  async createRefreshSession(userId: string, refreshToken: string) {
    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + this.getRefreshTokenTtlSeconds() * 1000,
    );
    const session: RefreshSessionDocument = {
      _id: randomUUID(),
      userId,
      tokenHash: this.hashToken(refreshToken),
      expiresAt,
      revokedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    await (await this.refreshCollection()).insertOne(session);
    return session;
  }

  async validateRefreshSession(userId: string, refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    const session = await (await this.refreshCollection()).findOne({
      userId,
      tokenHash,
      revokedAt: null,
    });
    if (!session || session.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }
    return session;
  }

  async rotateRefreshSession(userId: string, currentToken: string, nextToken: string) {
    const session = await this.validateRefreshSession(userId, currentToken);
    const now = new Date();
    await (await this.refreshCollection()).updateOne(
      { _id: session._id },
      { $set: { revokedAt: now, updatedAt: now } },
    );
    return this.createRefreshSession(userId, nextToken);
  }

  async revokeRefreshSession(refreshToken: string) {
    await (await this.refreshCollection()).updateOne(
      { tokenHash: this.hashToken(refreshToken), revokedAt: null },
      { $set: { revokedAt: new Date(), updatedAt: new Date() } },
    );
  }

  async revokeAllForUser(userId: string) {
    await (await this.refreshCollection()).updateMany(
      { userId, revokedAt: null },
      { $set: { revokedAt: new Date(), updatedAt: new Date() } },
    );
  }

  getRefreshTokenTtlSeconds() {
    return Number(this.config.get('JWT_REFRESH_TTL_SECONDS') ?? 60 * 60 * 24 * 14);
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private async refreshCollection() {
    const db = await this.mongo.getDb();
    return db.collection<RefreshSessionDocument>('RefreshSession');
  }
}
