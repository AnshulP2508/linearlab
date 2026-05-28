export declare class SecurityMonitorService {
    private readonly logger;
    private readonly counters;
    private readonly windowMs;
    recordAuthFailure(email: string, ip?: string): void;
    recordPermissionDenied(userId: string | undefined, role: string | undefined): void;
    recordUploadRejected(reason: string, metadata?: Record<string, unknown>): void;
    recordAiUsage(userId: string, section: string): void;
    private bump;
}
