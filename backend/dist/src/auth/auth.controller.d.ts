import type { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(dto: LoginDto, req: Request): Promise<{
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
