"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizePlainText = sanitizePlainText;
exports.sanitizeMultilineText = sanitizeMultilineText;
exports.sanitizeFilename = sanitizeFilename;
const sanitize_html_1 = __importDefault(require("sanitize-html"));
function trimOrNull(value) {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
}
function sanitizePlainText(value) {
    const normalized = trimOrNull(value);
    if (!normalized) {
        return null;
    }
    return (0, sanitize_html_1.default)(normalized, {
        allowedTags: [],
        allowedAttributes: {},
    })
        .replace(/\s+/g, ' ')
        .trim();
}
function sanitizeMultilineText(value) {
    const normalized = trimOrNull(value);
    if (!normalized) {
        return null;
    }
    return (0, sanitize_html_1.default)(normalized, {
        allowedTags: [],
        allowedAttributes: {},
    })
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}
function sanitizeFilename(value) {
    const normalized = trimOrNull(value);
    if (!normalized) {
        return null;
    }
    return normalized.replace(/[^\w.\-() ]+/g, '_').replace(/\s+/g, ' ').trim();
}
//# sourceMappingURL=sanitize.js.map