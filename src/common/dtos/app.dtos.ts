import {
  IsArray,
  IsDefined,
  IsIn,
  IsOptional,
  IsString,
} from 'class-validator';
import { SearchPrefix } from '@/types';

export class SearchQueryDto {
  @IsIn(['hubs:', 'notes:', 'bookmarks:'])
  @IsDefined()
  public readonly prefix: SearchPrefix;

  @IsString()
  @IsDefined()
  public readonly text: string;
}

export class CreateBookmarkDto {
  @IsString()
  @IsDefined()
  public readonly name: string;

  @IsString()
  @IsDefined()
  public readonly content: string;

  @IsString()
  @IsOptional()
  public readonly url?: string;

  @IsString()
  @IsOptional()
  public readonly tags?: string;
}
