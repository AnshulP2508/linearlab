"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateDeveloperPocDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const stages = [
    'ASSIGNED',
    'IN_PROGRESS',
    'DEVELOPMENT_COMPLETED',
    'UNDER_ADMIN_REVIEW',
    'PUBLISHED',
];
class UploadedFileDto {
    name;
    mimeType;
    contentBase64;
    sizeBytes;
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], UploadedFileDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], UploadedFileDto.prototype, "mimeType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(14_000_000),
    __metadata("design:type", String)
], UploadedFileDto.prototype, "contentBase64", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UploadedFileDto.prototype, "sizeBytes", void 0);
class DemoUrlsDto {
    liveDemoUrl;
    githubRepositoryUrl;
    videoLinkUrl;
}
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => normalizeOptionalUrl(value)),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)({
        require_tld: false,
        require_protocol: true,
        require_host: true,
    }),
    __metadata("design:type", String)
], DemoUrlsDto.prototype, "liveDemoUrl", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => normalizeOptionalUrl(value)),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)({
        require_tld: false,
        require_protocol: true,
        require_host: true,
    }),
    __metadata("design:type", String)
], DemoUrlsDto.prototype, "githubRepositoryUrl", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => normalizeOptionalUrl(value)),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)({
        require_tld: false,
        require_protocol: true,
        require_host: true,
    }),
    __metadata("design:type", String)
], DemoUrlsDto.prototype, "videoLinkUrl", void 0);
function normalizeOptionalUrl(value) {
    if (value === null || value === undefined)
        return undefined;
    const trimmed = String(value).trim();
    if (!trimmed)
        return undefined;
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) {
        return trimmed;
    }
    return `https://${trimmed}`;
}
class DocumentationDraftDto {
    purpose;
    problemItSolves;
    howToUseIt;
    techStack;
    teamBehindIt;
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2_000),
    __metadata("design:type", String)
], DocumentationDraftDto.prototype, "purpose", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2_000),
    __metadata("design:type", String)
], DocumentationDraftDto.prototype, "problemItSolves", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2_000),
    __metadata("design:type", String)
], DocumentationDraftDto.prototype, "howToUseIt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2_000),
    __metadata("design:type", String)
], DocumentationDraftDto.prototype, "techStack", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2_000),
    __metadata("design:type", String)
], DocumentationDraftDto.prototype, "teamBehindIt", void 0);
class UpdateDeveloperPocDto {
    status;
    addFiles;
    deleteFileId;
    demoUrls;
    explanationVideoFileName;
    documentationDraft;
    note;
    submitForReview;
}
exports.UpdateDeveloperPocDto = UpdateDeveloperPocDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(stages),
    __metadata("design:type", Object)
], UpdateDeveloperPocDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => UploadedFileDto),
    __metadata("design:type", Array)
], UpdateDeveloperPocDto.prototype, "addFiles", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateDeveloperPocDto.prototype, "deleteFileId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => DemoUrlsDto),
    __metadata("design:type", DemoUrlsDto)
], UpdateDeveloperPocDto.prototype, "demoUrls", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], UpdateDeveloperPocDto.prototype, "explanationVideoFileName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => DocumentationDraftDto),
    __metadata("design:type", DocumentationDraftDto)
], UpdateDeveloperPocDto.prototype, "documentationDraft", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2_000),
    __metadata("design:type", String)
], UpdateDeveloperPocDto.prototype, "note", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateDeveloperPocDto.prototype, "submitForReview", void 0);
//# sourceMappingURL=update-developer-poc.dto.js.map