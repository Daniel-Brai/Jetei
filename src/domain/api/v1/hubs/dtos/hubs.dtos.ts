import { UserRole } from '@prisma/client';
import {
  IsEmail,
  IsDefined,
  IsEnum,
  IsString,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class InviteeToHubDto {
  @IsUUID()
  @IsDefined()
  public hubId: string;

  @IsString()
  @IsDefined()
  public name: string;

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
