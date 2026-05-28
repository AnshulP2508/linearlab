import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async getHealth() {
    try {
      const userCount = await this.prisma.user.count();
      return {
        status: 'ok',
        database: 'connected',
        userCount,
        ...(userCount === 0
          ? {
              hint: 'No users found. Run `npm run prisma:seed` after MongoDB is a replica set (see README).',
            }
          : {}),
      };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      return {
        status: 'error',
        database: 'unreachable',
        message,
        hint: 'Check DATABASE_URL and that MongoDB is running (replica set required for Prisma writes).',
      };
    }
  }
}
