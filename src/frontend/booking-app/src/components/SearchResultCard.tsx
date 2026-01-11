'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Room } from '@/types/search';
import { useState } from 'react';
import { ROOM_TYPES, RoomType } from '@/types/roomType';

interface SearchResultCardProps {
  room: Room;
}

// const PLACEHOLDER_IMAGE = 'https://placehold.co/600x400?text=No+Image';
function getRoomLabel(type: string) {
  return ROOM_TYPES[type as RoomType] || 'Khác';
}

export default function SearchResultCard({ room }: SearchResultCardProps) {
  const thumbnailObj = room.images?.find((img) => img.isThumbnail) || room.images?.[0];
  const imageUrl = thumbnailObj?.url ; //|| PLACEHOLDER_IMAGE;

  const [isImageLoading, setIsImageLoading] = useState(true);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  return (
    <Link
      href={`/rooms/${room.id}`}
      className="group block bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
    >
      {/* --- IMAGE SECTION --- */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {/* Skeleton Loader khi ảnh đang tải */}
        {isImageLoading && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse z-10" />
        )}

        <Image
          src={imageUrl}
          alt={room.title}
          fill
          className={`object-cover transition-transform duration-500 group-hover:scale-110 ${isImageLoading ? 'opacity-0' : 'opacity-100'
            }`}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          onLoad={() => setIsImageLoading(false)}
        />

        {/* Overlay Gradient nhẹ ở dưới ảnh để làm nổi bật badge nếu cần */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Badges Status */}
        <div className="absolute top-3 left-3 flex gap-2">
          {!room.available && (
            <span className="px-2.5 py-1 bg-red-500/90 backdrop-blur-sm text-white text-xs font-bold rounded-md shadow-sm">
              Đã thuê
            </span>
          )}
          {room.roomType && (
            <span className="px-2.5 py-1 bg-black/50 backdrop-blur-sm text-white text-xs font-medium rounded-md shadow-sm">
              {getRoomLabel(room.roomType)}
            </span>

          )}

        </div>
      </div>

      {/* --- CONTENT SECTION --- */}
      <div className="p-4">
        {/* Title */}
        <h3 className="text-lg font-bold text-gray-900 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
          {room.title}
        </h3>

        {/* Location */}
        <div className="flex items-start gap-1.5 text-sm text-gray-500 mb-3">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="line-clamp-1 font-medium">{room.location}</span>
        </div>

        {/* Specs: Size & Rating */}
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            <span className="font-semibold text-gray-700">{room.size} m²</span>
          </div>

          {room.rating > 0 && (
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="font-bold text-gray-900">{room.rating}</span>
              <span className="text-gray-400 text-xs">({room.reviewCount})</span>
            </div>
          )}
        </div>

        {/* Amenities Pills */}
        <div className="flex flex-wrap gap-2 mb-4 h-7 overflow-hidden">
          {room.amenities.slice(0, 3).map((amenity) => (
            <span
              key={amenity.id}
              className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[11px] font-medium rounded-full border border-blue-100"
            >
              {amenity.name}
            </span>
          ))}
          {room.amenities.length > 3 && (
            <span className="px-2 py-0.5 bg-gray-50 text-gray-500 text-[11px] font-medium rounded-full border border-gray-100">
              +{room.amenities.length - 3}
            </span>
          )}
        </div>

        {/* Footer: Price & CTA */}
        <div className="flex items-center justify-between mt-auto">
          <div>
            <p className="text-xs text-gray-500 font-medium mb-0.5">Giá thuê</p>
            <p className="text-xl font-extrabold text-blue-600">
              {formatPrice(room.price)}
              <span className="text-sm text-gray-500 font-normal">/tháng</span>
            </p>
          </div>

          <button className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition shadow-md group-hover:scale-110">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </div>
    </Link>
  );
}