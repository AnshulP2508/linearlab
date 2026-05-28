import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import { Strategy } from 'passport-jwt';
export type JwtUserPayload = {
    sub: string;
    userId: string;
    email: string;
    role: Role;
    tokenType?: 'access' | 'refresh';
};
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    constructor(configService: ConfigService);
    validate(payload: JwtUserPayload): {
        userId: string;
        email: string;
        role: import("@prisma/client").$Enums.Role;
    };
}
export {};
