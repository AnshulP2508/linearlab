import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  logoText?: string;

  @IsOptional()
  @IsString()
  theme?: string;

  @IsOptional()
  @IsString()
  storageProvider?: string;

  @IsOptional()
  @IsString()
  emailSender?: string;

  @IsOptional()
  @IsBoolean()
  demoApprovalRequired?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  fileUploadLimitMb?: number;
}
