import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';

export const documentationSections = [
  'purpose',
  'problemItSolves',
  'howToUseIt',
] as const;

export type DocumentationSection = (typeof documentationSections)[number];

export class GenerateDocumentationDto {
  @IsString()
  @IsIn(documentationSections)
  section: DocumentationSection;

  @IsString()
  @MinLength(3)
  @MaxLength(2_000)
  prompt: string;
}
