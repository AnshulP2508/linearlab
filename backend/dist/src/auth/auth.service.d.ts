import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { SecurityMonitorService } from '../common/security-monitor.service';
import { LoginDto } from './dto/login.dto';
import { AuthSessionService } from './auth-session.service';
import { MongoDatabaseService } from '../mongo/mongo-database.service';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    private readonly sessions;
    private readonly securityMonitor;
    private readonly mongo;
    constructor(prisma: PrismaService, jwtService: JwtService, sessions: AuthSessionService, securityMonitor: SecurityMonitorService, mongo: MongoDatabaseService);
    login(dto: LoginDto, ipAddress?: string): Promise<{
        access_token: string;
        refresh_token: string;
        expires_in: number;
        role: import("@prisma/client").$Enums.Role;
    }>;
    refresh(refreshToken: string): Promise<{
        access_token: string;
        refresh_token: string;
        expires_in: number;
        role: import("@prisma/client").$Enums.Role;
    }>;
    logout(refreshToken: string): Promise<{
        ok: boolean;
    }>;
    private rehashPasswordIfNeeded;
    private verifyPassword;
    private isBcryptHash;
}
