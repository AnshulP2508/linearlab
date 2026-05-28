import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';

export type JwtUserPayload = {
  sub: string;
  userId: string;
  email: string;
  role: Role;
  tokenType?: 'access' | 'refresh';
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  validate(payload: JwtUserPayload) {
    if (
      !payload?.sub ||
      !payload?.email ||
      !payload?.role ||
      payload.tokenType === 'refresh'
    ) {
      throw new UnauthorizedException();
    }
    return {
      userId: payload.userId ?? payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
