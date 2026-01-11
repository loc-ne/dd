'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { 
  Home, 
  MapPin, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  MessageSquare,
  Clock,
  Ban,
  CheckCheck,
  AlertCircle
} from 'lucide-react';

// Types
interface Booking {
  id: number;
  status: 'PENDING' | 'APPROVED' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED_BY_RENTER' | 'CANCELLED_BY_HOST';
  moveInDate: string;
  totalPrice: number;
  depositAmount: number;
  rejectReason?: string;
  cancelReason?: string;
  createdAt: string;
  room: {
    id: number;
    title: string;
    address: string;
    district: string;
    city: string;
    images?: { imageUrl: string }[];
  };
  renter: {
    fullName?: string;
    phoneNumber?: string;
    email: string;
    username?: string;
  };
}

// Status config
const STATUS_CONFIG = {
  PENDING: { 
    label: 'Chờ duyệt', 
    color: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    icon: Clock
  },
  APPROVED: { 
    label: 'Đã chấp nhận', 
    color: 'bg-green-100 text-green-700 border-green-300',
    icon: CheckCheck
  },
  CONFIRMED: { 
    label: 'Đã xác nhận', 
    color: 'bg-blue-100 text-blue-700 border-blue-300',
    icon: CheckCircle
  },
  REJECTED: { 
    label: 'Đã từ chối', 
    color: 'bg-red-100 text-red-700 border-red-300',
    icon: Ban
  },
  CANCELLED_BY_RENTER: { 
    label: 'Khách hủy', 
    color: 'bg-gray-100 text-gray-700 border-gray-300',
    icon: XCircle
  },
  CANCELLED_BY_HOST: { 
    label: 'Chủ nhà hủy', 
    color: 'bg-orange-100 text-orange-700 border-orange-300',
    icon: XCircle
  }
};

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
};

export function BookingCard({ 
  booking, 
  onApprove, 
  onReject, 
  isProcessing 
}: { 
  booking: Booking; 
  onApprove: (id: number) => void;
  onReject: (id: number, reason: string) => void;
  isProcessing: boolean;
}) {
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING;
  const StatusIcon = statusConfig.icon;

  const handleApprove = () => {
    setShowApproveModal(false);
    onApprove(booking.id);
  };

  const handleReject = (reason: string) => {
    setShowRejectModal(false);
    onReject(booking.id, reason);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition">
      <div className="md:flex">
        {/* Image */}
        <div className="md:w-64 h-48 md:h-auto relative bg-gray-200 flex-shrink-0">
          {booking.room.images?.[0]?.imageUrl ? (
            <img
              src={booking.room.images[0].imageUrl}
              alt={booking.room.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Home className="w-12 h-12 text-gray-400" />
            </div>
          )}
          <div className="absolute top-3 right-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${statusConfig.color} backdrop-blur-sm bg-opacity-90`}>
              <StatusIcon className="w-3.5 h-3.5" />
              {statusConfig.label}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-5 md:p-6">
          <div className="flex justify-between items-start gap-4 mb-4">
            <div className="flex-1">
              <Link 
                href={`/rooms/${booking.room.id}`}
                className="text-lg font-bold text-gray-900 hover:text-blue-600 transition line-clamp-1 mb-2"
              >
                {booking.room.title}
              </Link>
              <div className="flex flex-col gap-1.5 text-sm text-gray-600 mb-3">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span className="line-clamp-1">
                    {booking.room.address}, {booking.room.district}, {booking.room.city}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Renter Info */}
          <div className="bg-blue-50 rounded-lg p-4 mb-4 border border-blue-100">
            <h4 className="text-xs font-semibold text-blue-900 mb-3 uppercase tracking-wide">
              Thông tin khách thuê
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {(booking.renter.fullName || booking.renter.username) && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-600">Họ tên</p>
                    <p className="font-semibold text-gray-900">
                      {booking.renter.fullName || booking.renter.username || 'Chưa cập nhật'}
                    </p>
                  </div>
                </div>
              )}
              {booking.renter.phoneNumber && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-600">Số điện thoại</p>
                    <a href={`tel:${booking.renter.phoneNumber}`} className="font-semibold text-blue-600 hover:underline">
                      {booking.renter.phoneNumber}
                    </a>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 md:col-span-2">
                <Mail className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-600">Email</p>
                  <p className="font-semibold text-gray-900">{booking.renter.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-600">Ngày dọn vào</p>
                  <p className="font-semibold text-gray-900">
                    {format(new Date(booking.moveInDate), 'dd/MM/yyyy', { locale: vi })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Price Info */}
          <div className="grid grid-cols-2 gap-3 mb-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-xs text-gray-600 mb-1">Giá thuê/tháng</p>
              <p className="font-bold text-gray-900">{formatCurrency(booking.totalPrice)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Tiền cọc</p>
              <p className="font-bold text-blue-600">{formatCurrency(booking.depositAmount)}</p>
            </div>
          </div>

          {/* Reject/Cancel Reason */}
          {(booking.rejectReason || booking.cancelReason) && (
            <div className="bg-red-50 border border-red-100 rounded-lg p-3 mb-4">
              <p className="text-xs font-semibold text-red-900 mb-1">
                {booking.rejectReason ? 'Lý do từ chối:' : 'Lý do hủy:'}
              </p>
              <p className="text-sm text-red-700">
                {booking.rejectReason || booking.cancelReason}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          {booking.status === 'PENDING' && (
            <div className="flex gap-3">
              <button
                onClick={() => setShowApproveModal(true)}
                disabled={isProcessing}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-semibold rounded-lg transition"
              >
                <CheckCircle className="w-4 h-4" />
                {isProcessing ? 'Đang xử lý...' : 'Chấp nhận'}
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={isProcessing}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50 font-semibold rounded-lg transition"
              >
                <XCircle className="w-4 h-4" />
                Từ chối
              </button>
            </div>
          )}

          {/* Timestamp */}
          <p className="text-xs text-gray-500 mt-4 pt-4 border-t border-gray-100">
            Yêu cầu lúc: {format(new Date(booking.createdAt), "dd/MM/yyyy 'lúc' HH:mm", { locale: vi })}
          </p>
        </div>
      </div>

      {/* Modals */}
      {showApproveModal && (
        <ApproveModal
          booking={booking}
          onClose={() => setShowApproveModal(false)}
          onSubmit={handleApprove}
          isProcessing={isProcessing}
        />
      )}
      {showRejectModal && (
        <RejectModal
          onClose={() => setShowRejectModal(false)}
          onSubmit={handleReject}
          isProcessing={isProcessing}
        />
      )}
    </div>
  );
}

export function ApproveModal({ 
  booking,
  onClose, 
  onSubmit, 
  isProcessing 
}: { 
  booking: Booking;
  onClose: () => void; 
  onSubmit: () => void;
  isProcessing: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Xác nhận chấp nhận</h3>
              <p className="text-sm text-gray-600">Bạn chắc chắn muốn chấp nhận yêu cầu này?</p>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 mb-4 border border-blue-100">
            <p className="text-sm text-gray-700 mb-2">
              <span className="font-semibold">Phòng:</span> {booking.room.title}
            </p>
            <p className="text-sm text-gray-700 mb-2">
              <span className="font-semibold">Khách thuê:</span> {booking.renter.fullName || booking.renter.email}
            </p>
            <p className="text-sm text-gray-700 mb-2">
              <span className="font-semibold">Ngày dọn vào:</span> {format(new Date(booking.moveInDate), 'dd/MM/yyyy', { locale: vi })}
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Tiền cọc:</span> {formatCurrency(booking.depositAmount)}
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <div className="flex gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-800">
                Sau khi chấp nhận, khách thuê sẽ nhận được email thông báo và sẽ thanh toán cọc trong vòng 24 giờ.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition"
            >
              Hủy
            </button>
            <button
              onClick={onSubmit}
              disabled={isProcessing}
              className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-semibold rounded-xl transition"
            >
              {isProcessing ? 'Đang xử lý...' : 'Xác nhận chấp nhận'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RejectModal({ 
  onClose, 
  onSubmit, 
  isProcessing 
}: { 
  onClose: () => void; 
  onSubmit: (reason: string) => void;
  isProcessing: boolean;
}) {
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Từ chối yêu cầu</h3>
              <p className="text-sm text-gray-600">Vui lòng cho biết lý do</p>
            </div>
          </div>

          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Nhập lý do từ chối (bắt buộc)"
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition text-gray-900 resize-none"
          />

          <div className="flex gap-3 mt-4">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition"
            >
              Hủy
            </button>
            <button
              onClick={() => onSubmit(reason)}
              disabled={isProcessing || !reason.trim()}
              className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white font-semibold rounded-xl transition"
            >
              {isProcessing ? 'Đang xử lý...' : 'Xác nhận từ chối'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
