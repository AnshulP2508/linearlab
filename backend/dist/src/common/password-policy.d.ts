export declare const MIN_PASSWORD_LENGTH = 8;
export declare const PASSWORD_PATTERN: RegExp;
export declare const MIN_BCRYPT_ROUNDS = 12;
export declare function assertStrongPassword(password: string, field?: string): void;
