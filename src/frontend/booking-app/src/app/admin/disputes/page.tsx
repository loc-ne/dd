'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import toast, { Toaster } from 'react-hot-toast';
import {
  FileWarning,
  RefreshCw,
  User,
  Home,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';

// Types
interface Dispute {
  id: number;
  bookingId: number;
  renterId: number;
  reason: string;
  evidenceImages: string[] | null;
  adminDecisionNote: string | null;
  refundAmount: number;
  status: 'PENDING' | 'RESOLVED_REFUND' | 'RESOLVED_DENIED';
  createdAt: string;
  updatedAt: string;
  booking: {
    id: number;
    depositAmount: number;
    totalPrice: number;
    moveInDate: string;
    room: {
      title: string;
      address: string;
      district: string;
      city: string;
      images: Array<{ imageUrl: string }>;
    };
  };
  renter: {
    id: number;
    fullName: string;
    email: string;
    phone: string;
  };
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolveType, setResolveType] = useState<'RESOLVED_REFUND' | 'RESOLVED_DENIED'>('RESOLVED_REFUND');
  const [refundAmount, setRefundAmount] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  // Auth đã được kiểm tra ở layout
  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/dispute/pending`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      console.log(result)
      if (result.success) {
        setDisputes(result.data);
      }
    } catch (err) {
      console.error('Error fetching disputes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenResolveModal = (dispute: Dispute) => {
    setSelectedDispute(dispute);
    setResolveType('RESOLVED_REFUND');
    setRefundAmount(dispute.booking.depositAmount.toString());
    setAdminNote('');
    setShowResolveModal(true);
  };

  const handleResolve = async () => {
    if (!selectedDispute) return;

    if (!adminNote.trim()) {
      toast.error('Vui lòng nhập ghi chú quyết định');
      return;
    }

    if (resolveType === 'RESOLVED_REFUND' && (!refundAmount || parseFloat(refundAmount) <= 0)) {
      toast.error('Vui lòng nhập số tiền hoàn trả hợp lệ');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/dispute/resolve/${selectedDispute.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: resolveType,
          reason: adminNote,
          refundAmount: resolveType === 'RESOLVED_REFUND' ? parseFloat(refundAmount) : 0,
        }),
      });

      const result = await response.json();
      console.log('Resolve dispute result:', result);
      
      if (result.success) {
        toast.success('Xử lý khiếu nại thành công!', {
          duration: 5000,
        });
        setShowResolveModal(false);
        fetchDisputes();
      } else {
        const errorMsg = result.msg || result.message || 'Không thể xử lý khiếu nại';
        console.error('Resolve error:', result);
        toast.error(errorMsg);
      }
    } catch (err) {
      console.error('Resolve network error:', err);
      toast.error('Lỗi kết nối máy chủ');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Toaster position="top-center" reverseOrder={false} />
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
                <FileWarning className="w-8 h-8 text-orange-600" />
                Quản lý khiếu nại
              </h1>
              <p className="text-sm text-gray-600 mt-1">Xem xét và xử lý các khiếu nại từ người thuê</p>
            </div>
            <button 
              onClick={fetchDisputes} 
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition font-medium"
              title="Làm mới"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Làm mới</span>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-yellow-600" />
                <div>
                  <p className="text-sm text-yellow-700 font-medium">Chờ xử lý</p>
                  <p className="text-2xl font-bold text-yellow-900">{disputes.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-green-700 font-medium">Đã chấp nhận</p>
                  <p className="text-2xl font-bold text-green-900">0</p>
                </div>
              </div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <XCircle className="w-8 h-8 text-red-600" />
                <div>
                  <p className="text-sm text-red-700 font-medium">Đã từ chối</p>
                  <p className="text-2xl font-bold text-red-900">0</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Disputes List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {disputes.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileWarning className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Không có khiếu nại nào đang chờ</h3>
            <p className="text-gray-600">Tất cả khiếu nại đã được xử lý</p>
          </div>
        ) : (
          <div className="space-y-4">
            {disputes.map((dispute) => (
              <DisputeCard
                key={dispute.id}
                dispute={dispute}
                onResolve={handleOpenResolveModal}
              />
            ))}
          </div>
        )}
      </div>

      {/* Resolve Modal */}
      {showResolveModal && selectedDispute && (
        <div className="fixed inset-0 bg-gray-900/10 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <h2 className="text-2xl font-bold text-gray-900">Xử lý khiếu nại #{selectedDispute.id}</h2>
                <button
                  onClick={() => setShowResolveModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <XCircle className="w-6 h-6 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Booking Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Thông tin đặt phòng</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Người thuê:</span>
                    <p className="font-semibold">{selectedDispute.renter.fullName}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <p className="font-semibold">{selectedDispute.renter.email}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Phòng:</span>
                    <p className="font-semibold">{selectedDispute.booking.room.title}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Tiền cọc:</span>
                    <p className="font-semibold text-blue-600">
                      {formatCurrency(selectedDispute.booking.depositAmount)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Dispute Reason */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Lý do khiếu nại từ người thuê:
                </label>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-gray-900">{selectedDispute.reason}</p>
                </div>
              </div>

              {/* Evidence Images */}
              {selectedDispute.evidenceImages && selectedDispute.evidenceImages.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Ảnh minh chứng ({selectedDispute.evidenceImages.length} ảnh):
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {selectedDispute.evidenceImages.map((publicId, index) => (
                      <a
                        key={index}
                        href={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dsn8dnaud'}/image/upload/${publicId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative block"
                      >
                        <img
                          src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dsn8dnaud'}/image/upload/w_300,h_200,c_fill/${publicId}`}
                          alt={`Evidence ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border-2 border-gray-200 group-hover:border-blue-500 transition"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition flex items-center justify-center">
                          <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-semibold">Xem lớn</span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Resolve Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Quyết định xử lý:
                </label>
                <div className="flex gap-4">
                  <label className="flex-1">
                    <input
                      type="radio"
                      checked={resolveType === 'RESOLVED_REFUND'}
                      onChange={() => setResolveType('RESOLVED_REFUND')}
                      className="hidden peer"
                    />
                    <div className="p-4 border-2 border-gray-300 peer-checked:border-green-500 peer-checked:bg-green-50 rounded-lg cursor-pointer transition">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-semibold text-green-900">Chấp nhận hoàn tiền</span>
                      </div>
                      <p className="text-xs text-gray-600">Khiếu nại hợp lệ, hoàn tiền cho khách</p>
                    </div>
                  </label>
                  <label className="flex-1">
                    <input
                      type="radio"
                      checked={resolveType === 'RESOLVED_DENIED'}
                      onChange={() => setResolveType('RESOLVED_DENIED')}
                      className="hidden peer"
                    />
                    <div className="p-4 border-2 border-gray-300 peer-checked:border-red-500 peer-checked:bg-red-50 rounded-lg cursor-pointer transition">
                      <div className="flex items-center gap-2 mb-2">
                        <XCircle className="w-5 h-5 text-red-600" />
                        <span className="font-semibold text-red-900">Từ chối khiếu nại</span>
                      </div>
                      <p className="text-xs text-gray-600">Khiếu nại không hợp lệ, giữ tiền cọc</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Refund Amount */}
              {resolveType === 'RESOLVED_REFUND' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Số tiền hoàn trả:
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      max={selectedDispute.booking.depositAmount}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent pr-16"
                      placeholder="Nhập số tiền hoàn trả"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                      VNĐ
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Tối đa: {formatCurrency(selectedDispute.booking.depositAmount)}
                  </p>
                </div>
              )}

              {/* Admin Note */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Ghi chú quyết định <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Ghi chú lý do quyết định để thông báo cho người thuê và chủ nhà..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={4}
                  required
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowResolveModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
                  disabled={submitting}
                >
                  Hủy
                </button>
                <button
                  onClick={handleResolve}
                  disabled={submitting || !adminNote.trim()}
                  className={`flex-1 px-6 py-3 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed ${
                    resolveType === 'RESOLVED_REFUND'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {submitting ? 'Đang xử lý...' : 'Xác nhận quyết định'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DisputeCard({ 
  dispute, 
  onResolve 
}: { 
  dispute: Dispute;
  onResolve: (dispute: Dispute) => void;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition">
      <div className="md:flex">
        {/* Image */}
        <div className="md:w-64 h-48 md:h-auto relative bg-gray-200 flex-shrink-0">
          {dispute.booking.room.images?.[0] ? (
            <img
              src={dispute.booking.room.images[0].imageUrl}
              alt={dispute.booking.room.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Home className="w-12 h-12 text-gray-400" />
            </div>
          )}
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-300">
              <Clock className="w-3.5 h-3.5" />
              CHỜ XỬ LÝ
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-5 md:p-6">
          <div className="flex justify-between items-start gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-gray-500">Khiếu nại #{dispute.id}</span>
                <span className="text-sm text-gray-400">•</span>
                <span className="text-sm text-gray-500">
                  {format(new Date(dispute.createdAt), "dd/MM/yyyy 'lúc' HH:mm", { locale: vi })}
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {dispute.booking.room.title}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                <User className="w-4 h-4" />
                <span>{dispute.renter.fullName}</span>
                <span>•</span>
                <span>{dispute.renter.email}</span>
              </div>
            </div>
          </div>

          {/* Dispute Reason */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-xs font-semibold text-yellow-900 mb-1">Lý do khiếu nại:</p>
            <p className="text-sm text-gray-900">{dispute.reason}</p>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-xs text-gray-600 mb-1">Tiền cọc đã thanh toán</p>
              <p className="font-bold text-blue-600">{formatCurrency(dispute.booking.depositAmount)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Ngày dọn vào</p>
              <p className="font-bold text-gray-900">
                {format(new Date(dispute.booking.moveInDate), 'dd/MM/yyyy', { locale: vi })}
              </p>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={() => onResolve(dispute)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
          >
            <AlertCircle className="w-4 h-4" />
            Xử lý khiếu nại
          </button>
        </div>
      </div>
    </div>
  );
}
