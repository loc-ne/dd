'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  Calendar,
  User,
  Phone,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Home,
  RefreshCw,
} from 'lucide-react';

interface Booking {
  id: number;
  roomId: number;
  moveInDate: string;
  depositAmount: number;
  totalPrice: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CONFIRMED' | 'CANCELLED_BY_RENTER' | 'CANCELLED_BY_HOST';
  rejectReason?: string;
  cancelReason?: string;
  createdAt: string;
  renter: {
    id: number;
    fullName: string;
    email: string;
    phoneNumber: string;
    avatarUrl?: string;
  };
  room: {
    id: number;
    title: string;
    address: string;
    district: string;
    city: string;
    pricePerMonth: number;
    images: Array<{ imageUrl: string }>;
  };
}

const STATUS_CONFIG = {
  PENDING: {
    label: 'Chờ duyệt',
    dot: 'bg-amber-500',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    icon: Clock,
  },
  APPROVED: {
    label: 'Đã duyệt',
    dot: 'bg-blue-500',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    icon: CheckCircle,
  },
  CONFIRMED: {
    label: 'Hoàn tất',
    dot: 'bg-emerald-500',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    icon: CheckCircle,
  },
  REJECTED: {
    label: 'Từ chối',
    dot: 'bg-gray-400',
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    icon: XCircle,
  },
  CANCELLED_BY_RENTER: {
    label: 'Khách hủy',
    dot: 'bg-gray-400',
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    icon: XCircle,
  },
  CANCELLED_BY_HOST: {
    label: 'Đã hủy',
    dot: 'bg-gray-400',
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    icon: AlertCircle,
  },
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

export default function HostBookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [rejectModal, setRejectModal] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/booking/host-bookings`, {
        credentials: 'include',
      });
      const result = await response.json();
      if (result.success) {
        setBookings(result.data);
      } else {
        toast.error(result.msg || 'Không thể tải danh sách');
      }
    } catch (err) {
      toast.error('Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchBookings();
  }, [user]);

  const handleApprove = async (bookingId: number) => {
    setProcessingId(bookingId);
    try {
      const response = await fetch(`${API_URL}/booking/host-process/${bookingId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED' }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Đã chấp nhận yêu cầu!');
        fetchBookings();
      } else {
        toast.error(result.msg || 'Không thể xử lý');
      }
    } catch (err) {
      toast.error('Lỗi kết nối máy chủ');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal || !rejectReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }

    setProcessingId(rejectModal);
    try {
      const response = await fetch(`${API_URL}/booking/host-process/${rejectModal}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJECTED', rejectReason }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Đã từ chối yêu cầu');
        setRejectModal(null);
        setRejectReason('');
        fetchBookings();
      } else {
        toast.error(result.msg || 'Không thể xử lý');
      }
    } catch (err) {
      toast.error('Lỗi kết nối máy chủ');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredBookings = filterStatus === 'ALL' 
    ? bookings 
    : bookings.filter((b) => b.status === filterStatus);

  const statusCounts = {
    ALL: bookings.length,
    PENDING: bookings.filter((b) => b.status === 'PENDING').length,
    APPROVED: bookings.filter((b) => b.status === 'APPROVED').length,
    CONFIRMED: bookings.filter((b) => b.status === 'CONFIRMED').length,
    REJECTED: bookings.filter((b) => b.status === 'REJECTED').length,
    CANCELLED_BY_RENTER: bookings.filter((b) => b.status === 'CANCELLED_BY_RENTER').length,
    CANCELLED_BY_HOST: bookings.filter((b) => b.status === 'CANCELLED_BY_HOST').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" />

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Yêu cầu thuê phòng</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Xử lý các yêu cầu đặt phòng từ khách hàng
              </p>
            </div>
            <button
              onClick={fetchBookings}
              disabled={loading}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Mini Stats */}
          <div className="flex items-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-gray-600">Chờ duyệt</span>
              <span className="font-semibold text-gray-900">{statusCounts.PENDING}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-gray-600">Đã duyệt</span>
              <span className="font-semibold text-gray-900">{statusCounts.APPROVED}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-gray-600">Hoàn tất</span>
              <span className="font-semibold text-gray-900">{statusCounts.CONFIRMED}</span>
            </div>
            <div className="text-gray-400">|</div>
            <span className="text-gray-500">Tổng: <span className="font-semibold text-gray-900">{statusCounts.ALL}</span></span>
          </div>
        </div>
      </div>

      <div className="px-6 lg:px-8 py-6 space-y-4">
        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { key: 'ALL', label: 'Tất cả' },
            { key: 'PENDING', label: 'Chờ duyệt' },
            { key: 'APPROVED', label: 'Đã duyệt' },
            { key: 'CONFIRMED', label: 'Hoàn tất' },
            { key: 'REJECTED', label: 'Từ chối' },
            { key: 'CANCELLED_BY_RENTER', label: 'Khách hủy' },
          ].map((status) => (
            <button
              key={status.key}
              onClick={() => setFilterStatus(status.key)}
              className={`
                px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition
                ${filterStatus === status.key
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100'}
              `}
            >
              {status.label}
              {statusCounts[status.key as keyof typeof statusCounts] > 0 && (
                <span className={`ml-1.5 ${filterStatus === status.key ? 'text-gray-400' : 'text-gray-400'}`}>
                  {statusCounts[status.key as keyof typeof statusCounts]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Booking List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl p-4 border border-gray-200">
                <div className="animate-pulse flex gap-4">
                  <div className="w-24 h-20 bg-gray-200 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                    <div className="h-3 bg-gray-200 rounded w-1/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-16">
            <Home className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-900 font-medium">
              {filterStatus === 'ALL' ? 'Chưa có yêu cầu nào' : 'Không có yêu cầu'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {filterStatus === 'ALL'
                ? 'Các yêu cầu đặt phòng sẽ hiển thị tại đây'
                : 'Thử thay đổi bộ lọc để xem các yêu cầu khác'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onApprove={() => handleApprove(booking.id)}
                onReject={() => {
                  setRejectModal(booking.id);
                  setRejectReason('');
                }}
                isProcessing={processingId === booking.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Từ chối yêu cầu</h3>
            <p className="text-sm text-gray-500 mb-4">Vui lòng cho biết lý do từ chối</p>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Nhập lý do..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 text-sm resize-none"
            />

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  setRejectModal(null);
                  setRejectReason('');
                }}
                disabled={processingId !== null}
                className="flex-1 px-4 py-2 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleReject}
                disabled={processingId !== null || !rejectReason.trim()}
                className="flex-1 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:bg-gray-300"
              >
                {processingId ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BookingCard({
  booking,
  onApprove,
  onReject,
  isProcessing,
}: {
  booking: Booking;
  onApprove: () => void;
  onReject: () => void;
  isProcessing: boolean;
}) {
  const config = STATUS_CONFIG[booking.status];
  const isPending = booking.status === 'PENDING';

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-gray-300 transition">
      <div className="flex">
        {/* Image - Compact */}
        <div className="w-28 md:w-36 flex-shrink-0 relative bg-gray-100">
          {booking.room.images?.[0]?.imageUrl ? (
            <Image
              src={booking.room.images[0].imageUrl}
              alt={booking.room.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Home className="w-8 h-8 text-gray-300" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-4 min-w-0">
          {/* Top row: Title + Status */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <Link
              href={`/rooms/${booking.room.id}`}
              className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition line-clamp-1"
            >
              {booking.room.title}
            </Link>
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${config.bg} ${config.text} flex-shrink-0`}>
              <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
              {config.label}
            </span>
          </div>

          {/* Address */}
          <p className="text-xs text-gray-500 mb-3 line-clamp-1">
            {booking.room.district}, {booking.room.city}
          </p>

          {/* Info Grid - Compact */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs mb-3">
            <span className="flex items-center gap-1 text-gray-600">
              <User className="w-3.5 h-3.5" />
              {booking.renter.fullName}
            </span>
            <a href={`tel:${booking.renter.phoneNumber}`} className="flex items-center gap-1 text-blue-600 hover:underline">
              <Phone className="w-3.5 h-3.5" />
              {booking.renter.phoneNumber}
            </a>
            <span className="flex items-center gap-1 text-gray-600">
              <Calendar className="w-3.5 h-3.5" />
              {format(new Date(booking.moveInDate), 'dd/MM/yyyy')}
            </span>
          </div>

          {/* Price row */}
          <div className="flex items-center gap-4 text-xs mb-3">
            <span className="text-gray-500">
              Giá: <span className="font-semibold text-gray-900">{formatCurrency(booking.totalPrice)}</span>
            </span>
            <span className="text-gray-500">
              Cọc: <span className="font-semibold text-blue-600">{formatCurrency(booking.depositAmount)}</span>
            </span>
          </div>

          {/* Reject/Cancel Reason */}
          {(booking.rejectReason || booking.cancelReason) && (
            <p className="text-xs text-gray-500 mb-3 bg-gray-50 px-2 py-1.5 rounded">
              <span className="font-medium">{booking.rejectReason ? 'Lý do từ chối:' : 'Lý do hủy:'}</span>{' '}
              {booking.rejectReason || booking.cancelReason}
            </p>
          )}

          {/* Actions for PENDING */}
          {isPending && (
            <div className="flex gap-2">
              <button
                onClick={onApprove}
                disabled={isProcessing}
                className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 text-white text-xs font-medium rounded-lg transition"
              >
                {isProcessing ? 'Đang xử lý...' : 'Chấp nhận'}
              </button>
              <button
                onClick={onReject}
                disabled={isProcessing}
                className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-50 text-xs font-medium rounded-lg transition"
              >
                Từ chối
              </button>
            </div>
          )}

          {/* Timestamp - only for non-pending */}
          {!isPending && (
            <p className="text-[11px] text-gray-400">
              {format(new Date(booking.createdAt), "dd/MM/yyyy 'lúc' HH:mm", { locale: vi })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
