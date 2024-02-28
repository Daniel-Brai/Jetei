import { UserRole } from '@prisma/client';
import {
  IsEmail,
  IsDefined,
  IsEnum,
  IsString,
  IsOptional,
} from 'class-validator';

export class InviteeToHubDto {
  @IsEmail()
  @IsDefined()
  public email: string;

  @IsEnum(UserRole)
  @IsDefined()
  public role: UserRole;
}

export class CreateHubDto {
  @IsString()
  @IsDefined()
  public name: string;

  @IsString()
  @IsOptional()
  public description: string;
}
