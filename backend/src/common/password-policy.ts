import { BadRequestException } from '@nestjs/common';

export const MIN_PASSWORD_LENGTH = 8;
export const PASSWORD_PATTERN =
  /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
export const MIN_BCRYPT_ROUNDS = 12;

export function assertStrongPassword(password: string, field = 'Password') {
  if (!PASSWORD_PATTERN.test(password)) {
    throw new BadRequestException(
      `${field} must be at least ${MIN_PASSWORD_LENGTH} characters and include an uppercase letter, a number, and a special character`,
    );
  }
}
