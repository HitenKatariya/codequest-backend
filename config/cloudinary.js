import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cloudinary storages for multer
// - avatarStorage: images only (including avif)
// - publicSpaceStorage: images + videos (resource_type: 'auto')
const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: async () => ({
    folder: 'codequest/avatars',
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif'],
    transformation: [
      { width: 500, height: 500, crop: 'limit' },
      { quality: 'auto' }
    ],
  }),
});

const publicSpaceStorage = new CloudinaryStorage({
  cloudinary,
  params: async () => ({
    folder: 'codequest/publicspace',
    resource_type: 'auto',
    allowed_formats: [
      'jpg', 'jpeg', 'png', 'gif', 'webp', 'avif',
      'mp4', 'mov', 'avi', 'webm'
    ],
  }),
});

export { cloudinary, avatarStorage, publicSpaceStorage };
