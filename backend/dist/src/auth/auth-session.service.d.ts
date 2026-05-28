import { ConfigService } from '@nestjs/config';
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
export declare class AuthSessionService {
    private readonly mongo;
    private readonly config;
    constructor(mongo: MongoDatabaseService, config: ConfigService);
    createRefreshSession(userId: string, refreshToken: string): Promise<RefreshSessionDocument>;
    validateRefreshSession(userId: string, refreshToken: string): Promise<import("mongodb").WithId<RefreshSessionDocument>>;
    rotateRefreshSession(userId: string, currentToken: string, nextToken: string): Promise<RefreshSessionDocument>;
    revokeRefreshSession(refreshToken: string): Promise<void>;
    revokeAllForUser(userId: string): Promise<void>;
    getRefreshTokenTtlSeconds(): number;
    private hashToken;
    private refreshCollection;
}
export {};
