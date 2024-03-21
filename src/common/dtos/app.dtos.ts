import { IsDefined, IsIn, IsString } from 'class-validator';
import { SearchPrefix } from '@/types';

export class SearchQueryDto {
  @IsIn(['hubs:', 'notes:', 'bookmarks:'])
  @IsDefined()
  public readonly prefix: SearchPrefix;

  @IsString()
  @IsDefined()
  public readonly text: string;
}
