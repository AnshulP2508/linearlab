import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateNested,
} from 'class-validator';

const stages = [
  'ASSIGNED',
  'IN_PROGRESS',
  'DEVELOPMENT_COMPLETED',
  'UNDER_ADMIN_REVIEW',
  'PUBLISHED',
] as const;

class UploadedFileDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  mimeType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(14_000_000)
  contentBase64?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sizeBytes?: number;
}

class DemoUrlsDto {
  @Transform(({ value }) => normalizeOptionalUrl(value))
  @IsOptional()
  @IsUrl({
    require_tld: false,
    require_protocol: true,
    require_host: true,
  })
  liveDemoUrl?: string;

  @Transform(({ value }) => normalizeOptionalUrl(value))
  @IsOptional()
  @IsUrl({
    require_tld: false,
    require_protocol: true,
    require_host: true,
  })
  githubRepositoryUrl?: string;

  @Transform(({ value }) => normalizeOptionalUrl(value))
  @IsOptional()
  @IsUrl({
    require_tld: false,
    require_protocol: true,
    require_host: true,
  })
  videoLinkUrl?: string;
}

function normalizeOptionalUrl(value: unknown) {
  if (value === null || value === undefined) return undefined;

  const trimmed = String(value).trim();
  if (!trimmed) return undefined;

  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

class DocumentationDraftDto {
  @IsOptional()
  @IsString()
  @MaxLength(2_000)
  purpose?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2_000)
  problemItSolves?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2_000)
  howToUseIt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2_000)
  techStack?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2_000)
  teamBehindIt?: string;
}

export class UpdateDeveloperPocDto {
  @IsOptional()
  @IsIn(stages)
  status?: (typeof stages)[number];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UploadedFileDto)
  addFiles?: UploadedFileDto[];

  @IsOptional()
  @IsString()
  deleteFileId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => DemoUrlsDto)
  demoUrls?: DemoUrlsDto;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  explanationVideoFileName?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => DocumentationDraftDto)
  documentationDraft?: DocumentationDraftDto;

  @IsOptional()
  @IsString()
  @MaxLength(2_000)
  note?: string;

  @IsOptional()
  @IsBoolean()
  submitForReview?: boolean;
}
