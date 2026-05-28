export declare const documentationSections: readonly ["purpose", "problemItSolves", "howToUseIt"];
export type DocumentationSection = (typeof documentationSections)[number];
export declare class GenerateDocumentationDto {
    section: DocumentationSection;
    prompt: string;
}
