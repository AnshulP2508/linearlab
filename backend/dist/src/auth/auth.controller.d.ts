import type { Request } from 'express';
import { AuthService } from './auth.service';
import { CheckEmailDto } from './dto/check-email.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(dto: LoginDto, req: Request): Promise<{
        access_token: string;
        refresh_token: string;
        expires_in: number;
        role: import("@prisma/client").$Enums.Role;
    }>;
    checkEmail(dto: CheckEmailDto): Promise<{
        exists: boolean;
    }>;
    sendOtp(dto: SendOtpDto): Promise<{
        ok: boolean;
    }>;
    verifyOtp(dto: VerifyOtpDto): Promise<{
        verified: boolean;
    }>;
    register(dto: RegisterDto, req: Request): Promise<{
        access_token: string;
        refresh_token: string;
        expires_in: number;
        role: import("@prisma/client").$Enums.Role;
    }>;
    refresh(dto: RefreshTokenDto): Promise<{
        access_token: string;
        refresh_token: string;
        expires_in: number;
        role: import("@prisma/client").$Enums.Role;
    }>;
    logout(dto: RefreshTokenDto): Promise<{
        ok: boolean;
    }>;
}
