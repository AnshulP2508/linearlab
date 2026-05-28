import { IsEmail, IsIn, IsString, Matches, MinLength } from 'class-validator';
import { Role } from '@prisma/client';
import {
  MIN_PASSWORD_LENGTH,
  PASSWORD_PATTERN,
} from '../../common/password-policy';

export class CreateUserDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(MIN_PASSWORD_LENGTH)
  @Matches(PASSWORD_PATTERN, {
    message:
      'password must include an uppercase letter, a number, and a special character',
  })
  password: string;

  @IsIn([Role.DEVELOPER, Role.USER])
  role: Role;
}
