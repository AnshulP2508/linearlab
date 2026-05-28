import {
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreatePocDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsOptional()
  @IsEmail()
  assignToEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  summary?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  documentation?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  technologies?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  techStack?: string[];

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  categoryName?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  timeline?: string;

  @IsOptional()
  @IsString()
  budget?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  file?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  fileMimeType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(14_000_000)
  fileContentBase64?: string;

  @IsOptional()
  @IsString()
  fileSizeBytes?: string;
}
