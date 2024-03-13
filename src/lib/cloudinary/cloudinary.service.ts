import { Injectable, Logger } from '@nestjs/common';
import { AppConfig } from '@/lib/config/config.provider';
import { RequestUser } from '@/interfaces';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);
  private readonly appConfig = AppConfig;

  /**
   * Upload a file
   * @param {RequestUser} req The reuest object
   * @param {Express.Multer.File} file The file and it content
   * @returns {string} The url of the uploaded file
   */
  public async uploadFile(
    req: RequestUser,
    file: Express.Multer.File,
  ): Promise<string> {
    this.logger.log(`Uploading a file from user: ${req.user.sub}`);
    return '';
  }

  /**
   * Normalize file name
   * @param {string} userId The id of the user
   * @param  {string} filename The name of the file
   * @returns {string} The new cleaned file name
   */
  private cleanFileName(userId: string, filename: string): string {
    const milliseconds = new Date(Date.now()).getUTCMilliseconds();
    if (/\s/.test(filename)) {
      return `${userId}-${milliseconds}-${filename
        .trim()
        .replace(/\s+/g, '-')
        .toLowerCase()}`;
    } else {
      return `${userId}-${milliseconds}-${filename.toLowerCase()}`;
    }
  }
}
