import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { SecurityMonitorService } from '../common/security-monitor.service';
import { CheckEmailDto } from './dto/check-email.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { AuthSessionService } from './auth-session.service';
import { EmailService } from './email.service';
import { MongoDatabaseService } from '../mongo/mongo-database.service';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    private readonly sessions;
    private readonly securityMonitor;
    private readonly mongo;
    private readonly emailService;
    constructor(prisma: PrismaService, jwtService: JwtService, sessions: AuthSessionService, securityMonitor: SecurityMonitorService, mongo: MongoDatabaseService, emailService: EmailService);
    checkEmail(dto: CheckEmailDto): Promise<{
        exists: boolean;
    }>;
    sendOtp(dto: SendOtpDto): Promise<{
        ok: boolean;
    }>;
    verifyOtp(dto: VerifyOtpDto): Promise<{
        verified: boolean;
    }>;
    register(dto: RegisterDto, ipAddress?: string): Promise<{
        access_token: string;
        refresh_token: string;
        expires_in: number;
        role: import("@prisma/client").$Enums.Role;
    }>;
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
    private issueTokens;
    private rehashPasswordIfNeeded;
    private verifyPassword;
    private isBcryptHash;
    private normalizeEmail;
    private assertCanUseOtpSignup;
    private getLatestOtp;
    private roleForEmail;
    private nameFromEmail;
    private emailOtpCollection;
    private userCollection;
}
