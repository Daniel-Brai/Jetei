import { Injectable, Logger } from '@nestjs/common';
import { UploadApiResponse, UploadApiErrorResponse, v2 } from 'cloudinary';
import { RequestUser } from '@/interfaces';
import { AllowedMimeTypes } from '@/types';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  /**
   * Upload a file
   * @param {Express.Multer.File} file The file and it content
   * @returns {any} The response of the uploaded file
   */
  private async uploadFile(
    file: Express.Multer.File,
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    return new Promise((resolve, reject) => {
      v2.uploader
        .upload_stream(
          {
            resource_type: 'auto',
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          },
        )
        .end(file.buffer);
    });
  }

  /**
   * Upload a file constrained to `type`
   * @param {AllowedMimeTypes} type The allowed type of the file
   * @param {Express.Multer.File} file The file and it content
   * @returns {Promise<string>} The url of the uploaded file
   */
  public async uploadFileByContentType(
    type: AllowedMimeTypes,
    file: Express.Multer.File,
  ): Promise<string> {
    this.logger.log(
      `Uploading a file with type: ${file.mimetype} constrained to ${type}`,
    );
    try {
      if (type === file.mimetype) {
        throw new Error(`Invalid file type: ${file.mimetype} is not ${type}`);
      }

      const file_response = await this.uploadFile(file);

      if (!file_response) {
        throw new Error('File upload failed');
      }
      return file_response.secure_url;
    } catch (e) {
      this.logger.error('File upload failed', {
        error: e,
      });
      throw new Error(e?.message);
    }
  }
}
