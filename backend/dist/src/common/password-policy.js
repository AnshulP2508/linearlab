"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MIN_BCRYPT_ROUNDS = exports.PASSWORD_PATTERN = exports.MIN_PASSWORD_LENGTH = void 0;
exports.assertStrongPassword = assertStrongPassword;
const common_1 = require("@nestjs/common");
exports.MIN_PASSWORD_LENGTH = 8;
exports.PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
exports.MIN_BCRYPT_ROUNDS = 12;
function assertStrongPassword(password, field = 'Password') {
    if (!exports.PASSWORD_PATTERN.test(password)) {
        throw new common_1.BadRequestException(`${field} must be at least ${exports.MIN_PASSWORD_LENGTH} characters and include an uppercase letter, a number, and a special character`);
    }
}
//# sourceMappingURL=password-policy.js.map