import { AppConfig } from '@/lib/config/config.provider';
import { v2 } from 'cloudinary';

export const CLOUDINARY = 'Cloudinary';

export const CloudinaryProvider = {
  provide: CLOUDINARY,
  useFactory: () => {
    return v2.config({
      cloud_name: AppConfig.services.cloudinary.CLOUD_BUCKET_NAME,
      api_key: AppConfig.services.cloudinary.CLOUD_API_KEY,
      api_secret: AppConfig.services.cloudinary.CLOUD_SECRET_KEY,
    });
  },
};
