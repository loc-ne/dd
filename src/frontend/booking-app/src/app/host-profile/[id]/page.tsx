'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  Star, MapPin, Phone, Shield, Calendar, 
  Home, Award, MessageCircle, ChevronLeft 
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const ROOM_TYPE_LABELS: Record<string, string> = {
  ROOM: 'Phòng trọ',
  STUDIO: 'Căn hộ Studio',
  DORM: 'KTX / Ở ghép',
  HOUSE: 'Nhà nguyên căn',
};

const formatCurrency = (amount: number | string) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(Number(amount));
};

type Review = {
  id: number;
  rating: number;
  comment: string;
  createdAt: string;
  reviewer: {
    id: number;
    fullName: string;
    avatarUrl?: string | null;
  };
};

type Room = {
  id: number;
  title: string;
  price: number;
  size: number;
  location: string;
  roomType: string;
  available: boolean;
  images: { url: string }[];
};

type HostData = {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  avatarUrl?: string | null;
  isHost: boolean;
  avgRating: number;
  reviewCount: number;
  createdAt: string;
};

export default function HostProfilePage() {
  const params = useParams();
  const hostId = params.id as string;

  const [hostData, setHostData] = useState<HostData | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'rooms' | 'reviews'>('rooms');

  useEffect(() => {
    const fetchHostProfile = async () => {
      try {
        setLoading(true);

        // Fetch host reviews để lấy thông tin host
        const reviewsRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/hosts/${hostId}/reviews`,
          { cache: 'no-store' }
        );
        const reviewsData = await reviewsRes.json();
        
        if (reviewsData.data && reviewsData.data.length > 0) {
          // Lấy thông tin host từ review đầu tiên (nếu có)
          // Hoặc fetch riêng từ API users nếu cần
          setReviews(reviewsData.data);
        }

        // Fetch rooms của host
        const roomsRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/rooms?hostId=${hostId}&limit=20`,
          { cache: 'no-store' }
        );
        const roomsData = await roomsRes.json();
        
        if (roomsData.success && roomsData.data) {
          const roomsList = Array.isArray(roomsData.data) 
            ? roomsData.data 
            : (roomsData.data.data || []);
          setRooms(roomsList);

          // Lấy thông tin host từ phòng đầu tiên
          if (roomsList.length > 0) {
            const firstRoom = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/rooms/${roomsList[0].id}`,
              { cache: 'no-store' }
            );
            const firstRoomData = await firstRoom.json();
            if (firstRoomData.success && firstRoomData.data.host) {
              setHostData(firstRoomData.data.host);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching host profile:', error);
      } finally {
        setLoading(false);
      }
    };

    if (hostId) {
      fetchHostProfile();
    }
  }, [hostId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin chủ nhà...</p>
        </div>
      </div>
    );
  }

  if (!hostData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Không tìm thấy thông tin chủ nhà
          </h2>
          <Link href="/search" className="text-blue-600 hover:underline">
            Quay lại tìm kiếm
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
  {/* Header Navigation */}
  <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
    <div className="max-w-6xl mx-auto px-4 h-16 flex items-center">
      <Link 
        href="/search"
        className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors text-sm font-medium"
      >
        <ChevronLeft className="w-4 h-4" />
        Quay lại tìm kiếm
      </Link>
    </div>
  </div>

  <div className="max-w-6xl mx-auto px-4 py-8">
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* CỘT TRÁI: THÔNG TIN CHỦ NHÀ */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sticky top-24">
          <div className="flex flex-col items-center text-center">
            {/* Avatar */}
            <div className="relative mb-4">
              <div className="w-32 h-32 rounded-full ring-4 ring-gray-50 overflow-hidden bg-gray-100">
                {hostData.avatarUrl ? (
                  <Image
                    src={hostData.avatarUrl}
                    alt={hostData.fullName}
                    width={128}
                    height={128}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-blue-600 text-white text-4xl font-bold">
                    {hostData.fullName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="absolute bottom-1 right-1 bg-blue-600 p-1.5 rounded-full border-2 border-white shadow-sm" title="Đã xác thực">
                <Shield className="w-3 h-3 text-white" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 leading-tight">
              {hostData.fullName}
            </h1>
            <p className="text-gray-500 text-sm mt-1 flex items-center gap-1">
              Chủ nhà tại hệ thống
            </p>

            {/* Rating Summary */}
            <div className="flex items-center gap-1.5 mt-4 px-3 py-1 bg-gray-50 rounded-full border border-gray-100">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="font-bold text-gray-900 text-sm">
                {hostData.reviewCount > 0 ? Number(hostData.avgRating).toFixed(1) : "N/A"}
              </span>
              <span className="text-gray-400 text-xs">•</span>
              <span className="text-gray-600 text-xs font-medium">
                {hostData.reviewCount} đánh giá
              </span>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 w-full mt-8 pt-6 border-t border-gray-100">
              <div className="text-left">
                <div className="flex items-center gap-2 text-gray-400 mb-1">
                  <Home className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Số phòng</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">{rooms.length} phòng</p>
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2 text-gray-400 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Tham gia</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  {format(new Date(hostData.createdAt), 'MM/yyyy', { locale: vi })}
                </p>
              </div>
            </div>

            {/* Contact Actions */}
            <div className="w-full space-y-2 mt-8">
              <a
                href={`tel:${hostData.phoneNumber}`}
                className="flex items-center justify-center gap-2 w-full py-3 bg-gray-900 hover:bg-gray-800 text-white text-sm font-bold rounded-xl transition-all"
              >
                <Phone className="w-4 h-4" />
                Gọi điện trực tiếp
              </a>
              <a
                href={`https://zalo.me/${hostData.phoneNumber}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-white hover:bg-gray-50 text-gray-900 text-sm font-bold rounded-xl border border-gray-200 transition-all"
              >
                <MessageCircle className="w-4 h-4 text-blue-500" />
                Nhắn tin Zalo
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* CỘT PHẢI: TABS & CONTENT */}
      <div className="lg:col-span-2">
        {/* Tab Buttons */}
        <div className="flex gap-8 border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('rooms')}
            className={`pb-4 text-sm font-bold transition-all relative ${
              activeTab === 'rooms' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Danh sách phòng ({rooms.length})
            {activeTab === 'rooms' && (
              <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-4 text-sm font-bold transition-all relative ${
              activeTab === 'reviews' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Đánh giá của khách ({reviews.length})
            {activeTab === 'reviews' && (
              <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>
        </div>

        {/* Tab Content Rendering */}
        <div className="min-h-[400px]">
          {activeTab === 'rooms' ? (
            rooms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {rooms.map((room) => (
                  <RoomCard key={room.id} room={room} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                <Home className="w-10 h-10 text-gray-200 mb-3" />
                <p className="text-gray-400 text-sm">Hiện tại chưa có phòng nào được đăng.</p>
              </div>
            )
          ) : (
            reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                <Award className="w-10 h-10 text-gray-200 mb-3" />
                <p className="text-gray-400 text-sm">Chưa nhận được đánh giá nào.</p>
              </div>
            )
          )}
        </div>
      </div>

    </div>
  </div>
</div>
  );
}

// Room Card Component
function RoomCard({ room }: { room: Room }) {
  const imageUrl = room.images?.[0]?.url || '/placeholder.jpg';

  return (
    <Link
      href={`/rooms/${room.id}`}
      className="group block bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-blue-200 transition-all duration-300"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={imageUrl}
          alt={room.title}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute top-2 left-2">
          <span className="px-2 py-1 bg-white/90 backdrop-blur-sm text-xs font-semibold text-gray-700 rounded-lg">
            {ROOM_TYPE_LABELS[room.roomType] || room.roomType}
          </span>
        </div>
        {room.available && (
          <div className="absolute top-2 right-2">
            <span className="px-2 py-1 bg-green-500 text-white text-xs font-semibold rounded-lg">
              Còn trống
            </span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors mb-2">
          {room.title}
        </h3>
        <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
          <MapPin className="w-4 h-4" />
          <span className="line-clamp-1">{room.location}</span>
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div>
            <span className="text-blue-600 font-bold text-lg">
              {formatCurrency(room.price)}
            </span>
            <span className="text-gray-400 text-sm">/tháng</span>
          </div>
          <span className="text-sm text-gray-500">
            {room.size} m²
          </span>
        </div>
      </div>
    </Link>
  );
}

// Review Card Component
function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        {/* Reviewer Avatar */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
            {review.reviewer.avatarUrl ? (
              <Image
                src={review.reviewer.avatarUrl}
                alt={review.reviewer.fullName}
                width={48}
                height={48}
                className="rounded-full object-cover"
              />
            ) : (
              review.reviewer.fullName.charAt(0).toUpperCase()
            )}
          </div>
        </div>

        {/* Review Content */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="font-semibold text-gray-900">
                {review.reviewer.fullName}
              </h4>
              <p className="text-sm text-gray-500">
                {format(new Date(review.createdAt), "dd 'tháng' MM, yyyy", { locale: vi })}
              </p>
            </div>
            {/* Rating */}
            <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="font-semibold text-gray-900 text-sm">
                {Number(review.rating).toFixed(1)}
              </span>
            </div>
          </div>
          <p className="text-gray-700 leading-relaxed">{review.comment}</p>
        </div>
      </div>
    </div>
  );
}
