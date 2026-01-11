const CLOUDINARY_CLOUD_NAME = 'dsn8dnaud';
const CLOUDINARY_BASE_URL = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload`;


export function getImageURL(imageName: string): string {
  const nameWithoutExt = imageName.replace(/\.(jpg|jpeg|png|webp|gif)$/i, '');

  return `${CLOUDINARY_BASE_URL}/${nameWithoutExt}`;
}


export function getOptimizedImageURL( 
  imageName: string,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
  }
): string {
  const {
    width = 800,
    height = 600,
    quality = 80,
  } = options || {};

  const nameWithoutExt = imageName.replace(/\.(jpg|jpeg|png|webp|gif)$/i, '');

  return `${CLOUDINARY_BASE_URL}/w_${width},h_${height},c_fill,q_${quality}/${nameWithoutExt}`;
}

export const cloudinaryConfig = {
  cloudName: CLOUDINARY_CLOUD_NAME,
  uploadPreset: 'ml_default',
};