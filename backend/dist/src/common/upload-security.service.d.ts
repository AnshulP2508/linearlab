import { SecurityMonitorService } from './security-monitor.service';
export declare class UploadSecurityService {
    private readonly monitor;
    constructor(monitor: SecurityMonitorService);
    validateFile(input: {
        fileName?: string | null;
        mimeType?: string | null;
        contentBase64?: string | null;
        sizeBytes?: number | null;
    }): {
        fileName: string;
        mimeType: string;
        sizeBytes: number;
        contentBase64: string | null;
    } | null;
    private estimateBase64Bytes;
    private reject;
}
