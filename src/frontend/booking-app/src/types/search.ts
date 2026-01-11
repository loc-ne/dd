export interface SearchFilters {
  priceRange: [number, number];
  sizeRange: [number, number];
  amenities: string[];
  location: {
    city: string;
    district: string;
    ward: string;
  };
  roomType: string;
  gender: string;
  sortBy: 'price-asc' | 'price-desc' | 'size-asc' | 'size-desc' | 'newest';
}

export interface RoomImage {
  id: number;
  url: string;
  isThumbnail: boolean;
}

export interface Amenity {
  id: number;
  name: string;
}

export interface Room {
  id: number;
  title: string;
  description: string;
  price: number;
  size: number;
  location: string;
  address: string;
  status: string;
  roomType?: string;
  amenities: Amenity[];
  images: RoomImage[];
  rating: number;
  reviewCount?: number;
  available: boolean;
}

export interface SearchResponse {
  success: boolean;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  data: Room[];
}