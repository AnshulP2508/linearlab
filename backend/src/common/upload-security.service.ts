import { BadRequestException, Injectable } from '@nestjs/common';
import { SecurityMonitorService } from './security-monitor.service';
import { sanitizeFilename } from './sanitize';

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const allowedExtensions = new Set([
  'pdf',
  'png',
  'jpg',
  'jpeg',
  'svg',
  'webp',
  'txt',
  'md',
  'doc',
  'docx',
  'ppt',
  'pptx',
  'xls',
  'xlsx',
  'zip',
  'mp4',
  'mov',
  'webm',
]);

const blockedExtensions = new Set([
  'exe',
  'dll',
  'bat',
  'cmd',
  'sh',
  'ps1',
  'js',
  'jar',
  'msi',
  'com',
  'scr',
]);

@Injectable()
export class UploadSecurityService {
  constructor(private readonly monitor: SecurityMonitorService) {}

  validateFile(input: {
    fileName?: string | null;
    mimeType?: string | null;
    contentBase64?: string | null;
    sizeBytes?: number | null;
  }) {
    const fileName = sanitizeFilename(input.fileName);
    if (!fileName) {
      return null;
    }

    const extension = fileName.split('.').pop()?.toLowerCase() ?? '';
    if (!extension || blockedExtensions.has(extension)) {
      this.reject('blocked_extension', { fileName, extension });
    }
    if (!allowedExtensions.has(extension)) {
      this.reject('unsupported_extension', { fileName, extension });
    }

    const sizeBytes = Number.isFinite(input.sizeBytes)
      ? Number(input.sizeBytes)
      : this.estimateBase64Bytes(input.contentBase64);
    if (sizeBytes > MAX_UPLOAD_BYTES) {
      this.reject('file_too_large', { fileName, sizeBytes });
    }

    const mimeType = input.mimeType?.trim() || 'application/octet-stream';
    if (
      mimeType.includes('javascript') ||
      mimeType.includes('x-msdownload') ||
      mimeType.includes('x-sh')
    ) {
      this.reject('blocked_mime_type', { fileName, mimeType });
    }

    return {
      fileName,
      mimeType,
      sizeBytes,
      contentBase64: input.contentBase64?.trim() || null,
    };
  }

  private estimateBase64Bytes(contentBase64?: string | null) {
    if (!contentBase64) {
      return 0;
    }

    const normalized = contentBase64.trim();
    const padding = normalized.endsWith('==')
      ? 2
      : normalized.endsWith('=')
      ? 1
      : 0;
    return Math.floor((normalized.length * 3) / 4) - padding;
  }

  private reject(reason: string, metadata?: Record<string, unknown>): never {
    this.monitor.recordUploadRejected(reason, metadata);
    throw new BadRequestException(`Upload rejected: ${reason.replace(/_/g, ' ')}`);
  }
}
