import { Injectable, Logger } from '@nestjs/common';
import { UploadApiResponse, UploadApiErrorResponse, v2 } from 'cloudinary';
import { AllowedMimeTypes } from '@/types';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  /**
   * Upload a file
   * @private
   * @param {string} userId  The id of the user
   * @param {Express.Multer.File} file The file and it content
   * @returns {any} The response of the uploaded file
   */
  private async uploadFile(
    userId: string,
    file: Express.Multer.File,
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    return new Promise((resolve, reject) => {
      v2.uploader
        .upload_stream(
          {
            resource_type: 'auto',
            folder: `jetei-documents-${userId}`,
            public_id: `${this.cleanFileName(file.originalname.split('.')[0])}`,
            access_mode: 'public',
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
   * Cleans a filename
   * @private
   * @param {string} filename The name of the file without the extension
   * @returns {string} The new filename
   */
  private cleanFileName(filename: string): string {
    const milliseconds = new Date(Date.now()).getUTCMilliseconds();
    if (/\s/.test(filename)) {
      return `${filename
        .trim()
        .replace(/\s+/g, '-')
        .toLowerCase()}-${milliseconds}`;
    } else {
      return `${filename.toLowerCase()}-${milliseconds}`;
    }
  }

  /**
   * Delete file
   * @param {string} userId The id of the user
   * @param {string} publicId The public id of the file
   * @returns {Promise<{mesasge: string}>} The message of the delete fiel request
   */
  public async deleteFileByPublicId(userId: string, publicId: string) {
    this.logger.log(`Deleting file ${publicId} for user ${userId}`);
    try {
      await v2.uploader.destroy(publicId, {
        invalidate: true,
      });
      return { message: 'File deleted successfully' };
    } catch (e) {
      this.logger.error('Failed to delete file', {
        error: e,
      });
      throw new Error(e?.message);
    }
  }

  /**
   * Upload a file constrained to `type`
   * @param {string} userId  The id of the user
   * @param {AllowedMimeTypes} type The allowed type of the file
   * @param {Express.Multer.File} file The file and it content
   * @returns {Promise<string>} The url of the uploaded file
   */
  public async uploadFileByContentType(
    userId: string,
    types: AllowedMimeTypes[],
    file: Express.Multer.File,
  ): Promise<string> {
    this.logger.log(
      `Uploading a file with type: ${file.mimetype} constrained to file types ${types}`,
    );
    try {
      if (!types.includes(file.mimetype as AllowedMimeTypes)) {
        throw new Error(
          `Invalid file type: ${file.mimetype} is not part of ${types}`,
        );
      }

      const file_response = await this.uploadFile(userId, file);

      if (file_response.message) {
        throw new Error(`File upload failed: ${file_response.message}`);
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
