'use client';

import { useState, useEffect } from 'react';
import { getImageURL } from '@/lib/cloudinary';

export function useCloudinaryImages(imageNames: string[]) {
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!imageNames || imageNames.length === 0) {
      setIsLoading(false);
      return;
    }

    const urls: Record<string, string> = {};
    
    imageNames.forEach((imageName) => {
      const nameWithoutExt = imageName.replace(/\.(jpg|jpeg|png|webp|gif)$/i, '');
      urls[imageName] = getImageURL(nameWithoutExt);
    });
    
    setImageUrls(urls);
    setIsLoading(false);
  }, [imageNames.join(',')]);

  return { imageUrls, isLoading };
}


export function useCloudinaryImage(imageName: string) {
  const { imageUrls, isLoading } = useCloudinaryImages([imageName]);
  return {
    imageUrl: imageUrls[imageName] || '/placeholder.jpg',
    isLoading,
  };
}