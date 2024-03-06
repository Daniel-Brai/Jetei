import {
  IsEmail,
  IsDefined,
  IsString,
  IsStrongPassword,
  Validate,
  MaxLength,
} from 'class-validator';
import { CustomMatchPasswords } from '@/common/decorators/app.decorators';

export class UserSignUpDto {
  @MaxLength(255)
  @IsString()
  @IsDefined()
  public name: string;

  @IsEmail()
  @IsDefined()
  public email: string;

  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minNumbers: 1,
    minSymbols: 1,
    minUppercase: 1,
  })
  @IsString()
  @IsDefined()
  public password: string;
}

export class UserLoginDto {
  @IsEmail()
  @IsDefined()
  public email: string;

  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minNumbers: 1,
    minSymbols: 1,
    minUppercase: 1,
  })
  @IsString()
  @IsDefined()
  public password: string;
}

export class UserForgetPasswordDto {
  @IsEmail()
  @IsDefined()
  public email: string;
}

export class UserVerifyAccountDto {
  @IsString()
  @IsDefined()
  public token: string;
}

export class UserResetPasswordDto {
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minNumbers: 1,
    minSymbols: 1,
    minUppercase: 1,
  })
  @IsString()
  @IsDefined()
  public new_password: string;

  @Validate(CustomMatchPasswords, ['new_password'])
  @IsString()
  @IsDefined()
  public new_password_confirm: string;
}
