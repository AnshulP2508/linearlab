import { Injectable, Logger } from '@nestjs/common';

type CounterEntry = {
  count: number;
  firstSeenAt: number;
};

@Injectable()
export class SecurityMonitorService {
  private readonly logger = new Logger(SecurityMonitorService.name);
  private readonly counters = new Map<string, CounterEntry>();
  private readonly windowMs = 15 * 60 * 1000;

  recordAuthFailure(email: string, ip?: string) {
    this.bump(`auth:${email.toLowerCase()}`);
    if (ip) {
      this.bump(`auth-ip:${ip}`);
    }
    this.logger.warn(
      JSON.stringify({
        event: 'auth.failure',
        email,
        ip: ip ?? null,
      }),
    );
  }

  recordPermissionDenied(userId: string | undefined, role: string | undefined) {
    this.logger.warn(
      JSON.stringify({
        event: 'auth.permission_denied',
        userId: userId ?? null,
        role: role ?? null,
      }),
    );
  }

  recordUploadRejected(reason: string, metadata?: Record<string, unknown>) {
    this.bump(`upload:${reason}`);
    this.logger.warn(
      JSON.stringify({
        event: 'upload.rejected',
        reason,
        metadata: metadata ?? null,
      }),
    );
  }

  recordAiUsage(userId: string, section: string) {
    this.bump(`ai:${userId}`);
    this.logger.log(
      JSON.stringify({
        event: 'ai.documentation_generation',
        userId,
        section,
      }),
    );
  }

  private bump(key: string) {
    const now = Date.now();
    const current = this.counters.get(key);
    if (!current || now - current.firstSeenAt > this.windowMs) {
      this.counters.set(key, { count: 1, firstSeenAt: now });
      return;
    }

    const next = { ...current, count: current.count + 1 };
    this.counters.set(key, next);
    if (next.count >= 5) {
      this.logger.warn(
        JSON.stringify({
          event: 'security.threshold_reached',
          key,
          count: next.count,
          windowMs: this.windowMs,
        }),
      );
    }
  }
}
