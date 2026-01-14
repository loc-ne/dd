'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { format, formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import toast, { Toaster } from 'react-hot-toast';
import {
  Calendar,
  MapPin,
  CreditCard,
  XCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  Home,
  ArrowRight,
  RefreshCw,
  FileWarning,
  Upload,
  X,
  Search,
  Filter,
  ChevronRight,
  Sparkles,
  Ban,
  CircleDot,
  ExternalLink,
  Star,
  MessageSquare,
  User,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// Types
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
  room: {
    id: number;
    title: string;
    address: string;
    district: string;
    city: string;
    pricePerMonth: number;
    images: Array<{ imageUrl: string }>;
    host?: {
      id: number;
      fullName: string;
      avatarUrl?: string;
    };
  };
  dispute?: {
    id: number;
    status: 'PENDING' | 'RESOLVED_REFUND' | 'RESOLVED_DENIED';
    reason: string;
    refundAmount: number;
    adminDecisionNote?: string;
  };
  hasReviewedRoom?: boolean;
  hasReviewedHost?: boolean;
}

type TabType = 'all' | 'active' | 'completed' | 'cancelled';

const STATUS_CONFIG = {
  PENDING: {
    label: 'Chờ xác nhận',
    color: 'bg-amber-500',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
    icon: Clock,
    description: 'Đang chờ chủ nhà xem xét yêu cầu của bạn',
    step: 1,
  },
  APPROVED: {
    label: 'Chờ thanh toán',
    color: 'bg-emerald-500',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    icon: CreditCard,
    description: 'Chủ nhà đã chấp nhận! Vui lòng thanh toán cọc',
    step: 2,
  },
  CONFIRMED: {
    label: 'Đã xác nhận',
    color: 'bg-blue-500',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
    icon: CheckCircle,
    description: 'Hoàn tất! Bạn có thể dọn vào theo lịch',
    step: 3,
  },
  REJECTED: {
    label: 'Từ chối',
    color: 'bg-red-500',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
    icon: XCircle,
    description: 'Chủ nhà đã từ chối yêu cầu',
    step: -1,
  },
  CANCELLED_BY_RENTER: {
    label: 'Đã hủy',
    color: 'bg-gray-500',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-600',
    borderColor: 'border-gray-200',
    icon: Ban,
    description: 'Bạn đã hủy yêu cầu này',
    step: -1,
  },
  CANCELLED_BY_HOST: {
    label: 'Chủ nhà hủy',
    color: 'bg-orange-500',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-200',
    icon: AlertCircle,
    description: 'Chủ nhà đã hủy đơn',
    step: -1,
  },
};

const TABS: { key: TabType; label: string; statuses: string[] }[] = [
  { key: 'all', label: 'Tất cả', statuses: [] },
  { key: 'active', label: 'Đang xử lý', statuses: ['PENDING', 'APPROVED'] },
  { key: 'completed', label: 'Hoàn thành', statuses: ['CONFIRMED'] },
  { key: 'cancelled', label: 'Đã hủy', statuses: ['REJECTED', 'CANCELLED_BY_RENTER', 'CANCELLED_BY_HOST'] },
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

export default function MyBookingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [paymentMessage, setPaymentMessage] = useState<{ type: 'success' | 'error' | 'failed', text: string } | null>(null);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [submittingDispute, setSubmittingDispute] = useState(false);
  const [evidenceImages, setEvidenceImages] = useState<File[]>([]);
  const [evidencePreviews, setEvidencePreviews] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  
  // Review modal states
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [roomRating, setRoomRating] = useState(5);
  const [roomComment, setRoomComment] = useState('');
  const [hostRating, setHostRating] = useState(5);
  const [hostComment, setHostComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  
  // New states for filtering
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  // Filtered bookings
  const filteredBookings = useMemo(() => {
    let result = bookings;
    
    // Filter by tab
    const tab = TABS.find(t => t.key === activeTab);
    if (tab && tab.statuses.length > 0) {
      result = result.filter(b => tab.statuses.includes(b.status));
    }
    
    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(b => 
        b.room.title.toLowerCase().includes(query) ||
        b.room.address.toLowerCase().includes(query) ||
        b.room.district.toLowerCase().includes(query) ||
        b.room.city.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [bookings, activeTab, searchQuery]);

  // Tab counts
  const tabCounts = useMemo(() => {
    return TABS.reduce((acc, tab) => {
      if (tab.statuses.length === 0) {
        acc[tab.key] = bookings.length;
      } else {
        acc[tab.key] = bookings.filter(b => tab.statuses.includes(b.status)).length;
      }
      return acc;
    }, {} as Record<TabType, number>);
  }, [bookings]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchBookings();
      checkPaymentResult();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const checkPaymentResult = () => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');

    if (paymentStatus === 'success') {
      setPaymentMessage({ type: 'success', text: 'Thanh toán cọc thành công! Đơn đặt phòng đã được xác nhận.' });
      window.history.replaceState({}, '', '/dashboard/bookings');
    } else if (paymentStatus === 'failed') {
      setPaymentMessage({ type: 'failed', text: 'Thanh toán thất bại. Vui lòng thử lại.' });
      window.history.replaceState({}, '', '/dashboard/bookings');
    } else if (paymentStatus === 'error') {
      setPaymentMessage({ type: 'error', text: 'Có lỗi xảy ra khi xử lý thanh toán.' });
      window.history.replaceState({}, '', '/dashboard/bookings');
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await fetch(`${API_URL}/booking/my-bookings`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      console.log(result.data);
      if (result.success) {
        setBookings(result.data);
      } else {
        setError(result.msg || 'Không thể tải danh sách đặt phòng');
      }
    } catch (err) {
      setError('Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId: number) => {
    const reason = prompt('Lý do hủy (tùy chọn):');
    if (reason === null) return;

    setCancellingId(bookingId);
    try {
      const response = await fetch(`${API_URL}/booking/cancel/${bookingId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ reason }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Đã hủy yêu cầu thành công');
        fetchBookings();
      } else {
        toast.error(result.msg || 'Không thể hủy');
      }
    } catch (err) {
      toast.error('Lỗi kết nối');
    } finally {
      setCancellingId(null);
    }
  };

  const handlePayment = async (booking: Booking) => {
    try {
      const response = await fetch(`${API_URL}/payment/create-vnpay-url`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: booking.id,
          amount: booking.depositAmount,
        }),
      });

      const result = await response.json();

      if (result.success && result.paymentUrl) {
        // Redirect sang VNPay
        window.location.href = result.paymentUrl;
      } else {
        toast.error(result.message || 'Không thể tạo URL thanh toán');
      }
    } catch (err) {
      toast.error('Lỗi kết nối máy chủ');
    }
  };

  const handleOpenDisputeModal = (booking: Booking) => {
    if (booking.dispute) {
      toast.error('Booking này đã có khiếu nại, không thể gửi thêm!');
      return;
    }
    setSelectedBooking(booking);
    setDisputeReason('');
    setEvidenceImages([]);
    setEvidencePreviews([]);
    setShowDisputeModal(true);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    const totalFiles = evidenceImages.length + newFiles.length;

    if (totalFiles > 5) {
      toast.error('Chỉ được tải lên tối đa 5 ảnh');
      return;
    }

    // Validate file types and sizes
    for (const file of newFiles) {
      if (!file.type.startsWith('image/')) {
        toast.error(`File ${file.name} không phải là ảnh`);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File ${file.name} vượt quá 5MB`);
        return;
      }
    }

    setEvidenceImages(prev => [...prev, ...newFiles]);

    // Create previews
    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEvidencePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index: number) => {
    setEvidenceImages(prev => prev.filter((_, i) => i !== index));
    setEvidencePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleOpenReviewModal = (booking: Booking) => {
    setReviewBooking(booking);
    setRoomRating(5);
    setRoomComment('');
    setHostRating(5);
    setHostComment('');
    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (!reviewBooking) return;

    setSubmittingReview(true);
    
    try {
      let roomSuccess = false;
      let hostSuccess = false;
      let roomError = '';
      let hostError = '';

      // 1. Submit Room Review
      try {
        const roomResponse = await fetch(`${API_URL}/review`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bookingId: reviewBooking.id,
            rating: roomRating,
            comment: roomComment || undefined,
          }),
        });

        const roomResult = await roomResponse.json();
        if (roomResult.success) {
          roomSuccess = true;
        } else {
          roomError = roomResult.msg || roomResult.message || 'Lỗi đánh giá phòng';
        }
      } catch (err) {
        roomError = 'Lỗi kết nối khi đánh giá phòng';
      }

      // 2. Submit Host Review (if host exists)
      const hostId = reviewBooking.room.host?.id;
      if (hostId) {
        try {
          const hostResponse = await fetch(`${API_URL}/hosts/${hostId}/reviews`, {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              rating: hostRating,
              comment: hostComment || undefined,
            }),
          });

          const hostResult = await hostResponse.json();
          if (hostResult.success) {
            hostSuccess = true;
          } else {
            hostError = hostResult.msg || hostResult.message || 'Lỗi đánh giá chủ nhà';
          }
        } catch (err) {
          hostError = 'Lỗi kết nối khi đánh giá chủ nhà';
        }
      }

      // 3. Show result messages
      if (roomSuccess && hostSuccess) {
        toast.success('Đánh giá phòng và chủ nhà thành công!');
        setShowReviewModal(false);
        fetchBookings();
      } else if (roomSuccess && !hostId) {
        toast.success('Đánh giá phòng thành công!');
        setShowReviewModal(false);
        fetchBookings();
      } else if (roomSuccess) {
        toast.success('Đánh giá phòng thành công!');
        if (hostError) toast.error(`Chủ nhà: ${hostError}`);
        setShowReviewModal(false);
        fetchBookings();
      } else if (hostSuccess) {
        toast.success('Đánh giá chủ nhà thành công!');
        if (roomError) toast.error(`Phòng: ${roomError}`);
        setShowReviewModal(false);
        fetchBookings();
      } else {
        toast.success('Đánh giá phòng thành công!');
        toast.success('Đánh giá chủ nhà thành công!');
      }
    } catch (err) {
      console.error('Submit review error:', err);
      toast.error('Lỗi kết nối máy chủ');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleSubmitDispute = async () => {
    if (!selectedBooking || !disputeReason.trim()) {
      toast.error('Vui lòng nhập lý do khiếu nại');
      return;
    }

    if (selectedBooking.dispute) {
      toast.error('Booking này đã có khiếu nại trước đó!');
      return;
    }

    setSubmittingDispute(true);
    
    try {
      // Create FormData for multipart/form-data
      const formData = new FormData();
      formData.append('bookingId', selectedBooking.id.toString());
      formData.append('reason', disputeReason);

      // Add images if any
      if (evidenceImages.length > 0) {
        setUploadingImages(true);
        evidenceImages.forEach(file => {
          formData.append('images', file);
        });
      }

      // Create dispute with FormData
      const response = await fetch(`${API_URL}/dispute/create`, {
        method: 'POST',
        credentials: 'include',
        body: formData, // Send FormData directly, no Content-Type header needed
      });

      const result = await response.json();
      console.log('Dispute create response:', result);

      if (result.success) {
        toast.success('Gửi khiếu nại thành công! Admin sẽ xem xét trong 24-48h.', {
          duration: 5000,
          icon: '✅',
        });
        setShowDisputeModal(false);
        fetchBookings(); 
      } else {
        const errorMsg = result.msg || result.message || 'Không thể gửi khiếu nại';
        console.error('Dispute error:', result);
        toast.error(errorMsg);
      }
    } catch (err) {
      console.error('Submit dispute error:', err);
      toast.error('Lỗi kết nối máy chủ');
    } finally {
      setSubmittingDispute(false);
      setUploadingImages(false);
    }
  };

  // Sửa lỗi cú pháp Loading [cite: 132]
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-blue-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-600 font-medium">Đang tải đơn đặt phòng...</p>
        </div>
      </div>
    );
  }

  // Sửa lỗi cú pháp check User [cite: 146]
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/30">
            <Home className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Đăng nhập để tiếp tục</h2>
          <p className="text-gray-600 mb-8">Xem và quản lý tất cả đơn đặt phòng của bạn tại một nơi</p>
          <Link 
            href="/login" 
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5"
          >
            Đăng nhập ngay
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" reverseOrder={false} />
      
      {/* Hero Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
              <Link href="/" className="hover:text-blue-600 transition">Trang chủ</Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-gray-900 font-medium">Đơn đặt phòng</span>
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Đơn đặt phòng của tôi</h1>
                <p className="text-gray-600 mt-1">Theo dõi và quản lý tất cả yêu cầu thuê phòng</p>
              </div>
              <button 
                onClick={fetchBookings} 
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                <RefreshCw className="w-4 h-4" />
                Làm mới
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto pb-px -mb-px">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.key
                    ? 'text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="flex items-center gap-2">
                  {tab.label}
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    activeTab === tab.key 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tabCounts[tab.key]}
                  </span>
                </span>
                {activeTab === tab.key && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Payment Message */}
        {paymentMessage && (
          <div className={`mb-6 p-4 rounded-xl flex items-center justify-between ${
            paymentMessage.type === 'success' 
              ? 'bg-emerald-50 border border-emerald-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center gap-3">
              {paymentMessage.type === 'success' ? (
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
              )}
              <p className={`font-medium ${paymentMessage.type === 'success' ? 'text-emerald-800' : 'text-red-800'}`}>
                {paymentMessage.text}
              </p>
            </div>
            <button onClick={() => setPaymentMessage(null)} className="p-1 hover:bg-black/5 rounded-lg transition">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo tên phòng, địa chỉ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
        </div>

        {/* Content */}
        {filteredBookings.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              {searchQuery ? (
                <Search className="w-10 h-10 text-gray-400" />
              ) : (
                <Calendar className="w-10 h-10 text-gray-400" />
              )}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {searchQuery ? 'Không tìm thấy kết quả' : 'Chưa có đơn đặt phòng'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery 
                ? 'Thử tìm kiếm với từ khóa khác' 
                : 'Bắt đầu tìm kiếm phòng trọ phù hợp với bạn'}
            </p>
            {!searchQuery && (
              <Link 
                href="/search" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition shadow-lg shadow-blue-500/30"
              >
                <Sparkles className="w-4 h-4" />
                Khám phá phòng
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onCancel={handleCancel}
                onPayment={handlePayment}
                onDispute={handleOpenDisputeModal}
                onReview={handleOpenReviewModal}
                isCancelling={cancellingId === booking.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Dispute Modal */}
      {showDisputeModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDisputeModal(false)}
          />
          
          {/* Modal */}
          <div className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white p-6 border-b border-gray-200 rounded-t-2xl">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                      <FileWarning className="w-5 h-5 text-orange-600" />
                    </div>
                    Gửi khiếu nại
                  </h2>
                  <p className="text-sm text-gray-600 mt-1 ml-12">Admin sẽ xem xét trong 24-48h</p>
                </div>
                <button
                  onClick={() => setShowDisputeModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Booking Info */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="flex gap-4">
                  {selectedBooking.room.images?.[0] && (
                    <img 
                      src={selectedBooking.room.images[0].imageUrl}
                      alt={selectedBooking.room.title}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{selectedBooking.room.title}</h3>
                    <p className="text-sm text-gray-600 truncate">{selectedBooking.room.address}</p>
                    <p className="text-sm font-semibold text-blue-600 mt-1">
                      Tiền cọc: {formatCurrency(selectedBooking.depositAmount)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Lý do khiếu nại <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="Mô tả chi tiết vấn đề bạn gặp phải..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none transition"
                  rows={5}
                  required
                />
              </div>

              {/* Image Upload */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Ảnh minh chứng (tối đa 5 ảnh)
                </label>
                
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-orange-400 transition text-center">
                  <input
                    type="file"
                    id="evidence-upload"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <label htmlFor="evidence-upload" className="cursor-pointer">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-700">Nhấp để tải ảnh lên</p>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG tối đa 5MB</p>
                  </label>
                </div>

                {evidencePreviews.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-4">
                    {evidencePreviews.map((preview, index) => (
                      <div key={index} className="relative group aspect-square">
                        <img
                          src={preview}
                          alt={`Evidence ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Warning */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <div className="text-sm text-amber-800">
                    <p className="font-semibold mb-1">Lưu ý quan trọng</p>
                    <ul className="space-y-1 text-amber-700">
                      <li>• Mỗi đơn chỉ được khiếu nại 1 lần</li>
                      <li>• Quyết định của Admin là cuối cùng</li>
                      <li className="text-red-600 font-medium">• Cung cấp bằng chứng giả sẽ bị khóa tài khoản</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDisputeModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition"
                  disabled={submittingDispute}
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleSubmitDispute}
                  disabled={submittingDispute || uploadingImages || !disputeReason.trim()}
                  className="flex-1 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingImages ? 'Đang tải ảnh...' : submittingDispute ? 'Đang gửi...' : 'Gửi khiếu nại'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && reviewBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowReviewModal(false)}
          />
          
          {/* Modal */}
          <div className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white p-6 border-b border-gray-200 rounded-t-2xl z-10">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                      <Star className="w-5 h-5 text-amber-500" />
                    </div>
                    Đánh giá trải nghiệm của bạn
                  </h2>
                  <p className="text-sm text-gray-600 mt-1 ml-12">
                    Chia sẻ cảm nhận về phòng và chủ nhà
                  </p>
                </div>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Booking Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex gap-4">
                  {reviewBooking.room.images?.[0] && (
                    <img 
                      src={reviewBooking.room.images[0].imageUrl}
                      alt={reviewBooking.room.title}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{reviewBooking.room.title}</h3>
                    <p className="text-sm text-gray-600 truncate">{reviewBooking.room.address}, {reviewBooking.room.district}</p>
                    {reviewBooking.room.host && (
                      <p className="text-sm text-blue-600 mt-1">Chủ nhà: {reviewBooking.room.host.fullName}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Room Review Section */}
              <div className="bg-amber-50 rounded-xl p-5 border border-amber-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Home className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Đánh giá phòng</h3>
                    <p className="text-xs text-gray-500">Chất lượng phòng, tiện nghi, vị trí</p>
                  </div>
                </div>
                
                {/* Room Rating */}
                <div className="mb-4">
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRoomRating(star)}
                        className="group p-1 transition-transform hover:scale-110"
                      >
                        <Star 
                          className={`w-8 h-8 transition-colors ${
                            star <= roomRating
                              ? 'fill-amber-400 text-amber-400'
                              : 'fill-gray-200 text-gray-200 group-hover:fill-amber-200 group-hover:text-amber-200'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <p className="text-center text-sm text-amber-700 mt-1 font-medium">
                    {roomRating === 5 && 'Tuyệt vời!'}
                    {roomRating === 4 && 'Rất tốt'}
                    {roomRating === 3 && 'Bình thường'}
                    {roomRating === 2 && 'Không hài lòng'}
                    {roomRating === 1 && 'Rất tệ'}
                  </p>
                </div>
                
                {/* Room Comment */}
                <textarea
                  value={roomComment}
                  onChange={(e) => setRoomComment(e.target.value)}
                  placeholder="Chia sẻ trải nghiệm về phòng... (không bắt buộc)"
                  className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none transition bg-white"
                  rows={3}
                />
              </div>

              {/* Host Review Section */}
              {reviewBooking.room.host && (
                <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                      {reviewBooking.room.host.avatarUrl ? (
                        <img 
                          src={reviewBooking.room.host.avatarUrl}
                          alt={reviewBooking.room.host.fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Đánh giá chủ nhà</h3>
                      <p className="text-xs text-gray-500">{reviewBooking.room.host.fullName} - Thái độ, hỗ trợ</p>
                    </div>
                  </div>
                  
                  {/* Host Rating */}
                  <div className="mb-4">
                    <div className="flex justify-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setHostRating(star)}
                          className="group p-1 transition-transform hover:scale-110"
                        >
                          <Star 
                            className={`w-8 h-8 transition-colors ${
                              star <= hostRating
                                ? 'fill-blue-400 text-blue-400'
                                : 'fill-gray-200 text-gray-200 group-hover:fill-blue-200 group-hover:text-blue-200'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <p className="text-center text-sm text-blue-700 mt-1 font-medium">
                      {hostRating === 5 && 'Tuyệt vời!'}
                      {hostRating === 4 && 'Rất tốt'}
                      {hostRating === 3 && 'Bình thường'}
                      {hostRating === 2 && 'Không hài lòng'}
                      {hostRating === 1 && 'Rất tệ'}
                    </p>
                  </div>
                  
                  {/* Host Comment */}
                  <textarea
                    value={hostComment}
                    onChange={(e) => setHostComment(e.target.value)}
                    placeholder="Chia sẻ trải nghiệm với chủ nhà... (không bắt buộc)"
                    className="w-full px-4 py-3 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition bg-white"
                    rows={3}
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition"
                  disabled={submittingReview}
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleSubmitReview}
                  disabled={submittingReview}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30"
                >
                  {submittingReview ? (
                    'Đang gửi...'
                  ) : (
                    <>
                      <Star className="w-4 h-4" />
                      Gửi đánh giá
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function BookingCard({
  booking,
  onCancel,
  onPayment,
  onDispute,
  onReview,
  isCancelling
}: {
  booking: Booking;
  onCancel: (id: number) => void;
  onPayment: (booking: Booking) => void;
  onDispute: (booking: Booking) => void;
  onReview: (booking: Booking) => void;
  isCancelling: boolean;
}) {
  const statusConfig = STATUS_CONFIG[booking.status];
  const StatusIcon = statusConfig.icon;
  const isActive = ['PENDING', 'APPROVED', 'CONFIRMED'].includes(booking.status);
  const showProgress = ['PENDING', 'APPROVED', 'CONFIRMED'].includes(booking.status);

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden transition-all hover:shadow-lg ${
      isActive ? 'border-gray-200' : 'border-gray-100 opacity-75 hover:opacity-100'
    }`}>
      <div className="flex flex-col lg:flex-row">
        {/* Image */}
        <div className="lg:w-72 h-48 lg:h-auto relative flex-shrink-0">
          {booking.room.images?.[0] ? (
            <img
              src={booking.room.images[0].imageUrl}
              alt={booking.room.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <Home className="w-12 h-12 text-gray-400" />
            </div>
          )}
          
          {/* Status Badge */}
          <div className="absolute top-3 left-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${statusConfig.bgColor} ${statusConfig.textColor} border ${statusConfig.borderColor}`}>
              <StatusIcon className="w-3.5 h-3.5" />
              {statusConfig.label}
            </span>
          </div>

          {/* Booking ID */}
          <div className="absolute bottom-3 left-3">
            <span className="px-2 py-1 bg-black/60 backdrop-blur-sm text-white text-xs font-medium rounded-lg">
              #{booking.id}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-5 lg:p-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <Link
                href={`/rooms/${booking.room.id}`}
                className="text-lg font-bold text-gray-900 hover:text-blue-600 transition line-clamp-1 flex items-center gap-2"
              >
                {booking.room.title}
                <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100" />
              </Link>
              <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
                <MapPin className="w-4 h-4" />
                <span className="line-clamp-1">
                  {booking.room.district}, {booking.room.city}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Giá thuê/tháng</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(booking.totalPrice)}</p>
            </div>
          </div>

          {/* Progress Steps */}
          {showProgress && (
            <div className="mb-4 p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between">
                {[
                  { step: 1, label: 'Gửi yêu cầu', icon: CircleDot },
                  { step: 2, label: 'Thanh toán', icon: CreditCard },
                  { step: 3, label: 'Hoàn tất', icon: CheckCircle },
                ].map((item, index) => (
                  <React.Fragment key={item.step}>
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        statusConfig.step >= item.step
                          ? `${statusConfig.color} text-white shadow-lg`
                          : 'bg-gray-200 text-gray-400'
                      }`}>
                        <item.icon className="w-5 h-5" />
                      </div>
                      <span className={`text-xs mt-2 font-medium ${
                        statusConfig.step >= item.step ? 'text-gray-900' : 'text-gray-400'
                      }`}>
                        {item.label}
                      </span>
                    </div>
                    {index < 2 && (
                      <div className={`flex-1 h-1 mx-2 rounded-full ${
                        statusConfig.step > item.step ? statusConfig.color : 'bg-gray-200'
                      }`} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Ngày dọn vào</p>
                <p className="text-sm font-semibold text-gray-900">
                  {format(new Date(booking.moveInDate), 'dd/MM/yyyy', { locale: vi })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Tiền cọc</p>
                <p className="text-sm font-semibold text-emerald-600">
                  {formatCurrency(booking.depositAmount)}
                </p>
              </div>
            </div>
          </div>

          {/* Status Message */}
          <p className="text-sm text-gray-600 mb-4 pb-4 border-b border-gray-100">
            {statusConfig.description}
          </p>

          {/* Reject/Cancel Reason */}
          {(booking.rejectReason || booking.cancelReason) && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-4">
              <p className="text-xs font-semibold text-red-800 mb-1">
                {booking.rejectReason ? 'Lý do từ chối:' : 'Lý do hủy:'}
              </p>
              <p className="text-sm text-red-700">
                {booking.rejectReason || booking.cancelReason}
              </p>
            </div>
          )}

          {/* Dispute Status */}
          {booking.dispute && (
            <div className={`rounded-xl p-3 mb-4 ${
              booking.dispute.status === 'PENDING' 
                ? 'bg-amber-50 border border-amber-200' 
                : booking.dispute.status === 'RESOLVED_REFUND' 
                  ? 'bg-emerald-50 border border-emerald-200' 
                  : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <FileWarning className={`w-4 h-4 ${
                  booking.dispute.status === 'PENDING' ? 'text-amber-600' :
                  booking.dispute.status === 'RESOLVED_REFUND' ? 'text-emerald-600' : 'text-red-600'
                }`} />
                <p className="text-sm font-semibold">
                  {booking.dispute.status === 'PENDING' ? 'Khiếu nại đang xử lý' :
                   booking.dispute.status === 'RESOLVED_REFUND' ? 'Khiếu nại được chấp nhận' : 'Khiếu nại bị từ chối'}
                </p>
              </div>
              {booking.dispute.adminDecisionNote && (
                <p className="text-xs text-gray-700">
                  <strong>Phản hồi:</strong> {booking.dispute.adminDecisionNote}
                </p>
              )}
              {booking.dispute.refundAmount > 0 && (
                <p className="text-sm font-semibold text-emerald-700 mt-1">
                  Hoàn tiền: {formatCurrency(booking.dispute.refundAmount)}
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {booking.status === 'APPROVED' && (
              <button
                onClick={() => onPayment(booking)}
                className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition shadow-lg shadow-emerald-500/30"
              >
                <CreditCard className="w-4 h-4" />
                Thanh toán cọc
              </button>
            )}

            {booking.status === 'CONFIRMED' && !booking.dispute && (
              <button
                onClick={() => onDispute(booking)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-100 hover:bg-orange-200 text-orange-700 font-semibold rounded-xl transition"
              >
                <FileWarning className="w-4 h-4" />
                Khiếu nại
              </button>
            )}

            {/* Review button - only for CONFIRMED bookings */}
            {booking.status === 'CONFIRMED' && (
              <button
                onClick={() => onReview(booking)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-100 to-orange-100 hover:from-amber-200 hover:to-orange-200 text-amber-700 font-semibold rounded-xl transition"
              >
                <Star className="w-4 h-4" />
                Viết đánh giá
              </button>
            )}

            {booking.status === 'PENDING' && (
              <button
                onClick={() => onCancel(booking.id)}
                disabled={isCancelling}
                className="flex items-center justify-center gap-2 px-4 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 font-semibold rounded-xl transition disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                {isCancelling ? 'Đang hủy...' : 'Hủy yêu cầu'}
              </button>
            )}

            <Link
              href={`/rooms/${booking.room.id}`}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition"
            >
              Xem chi tiết
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Timestamp */}
          <p className="text-xs text-gray-400 mt-4">
            Đặt {formatDistanceToNow(new Date(booking.createdAt), { addSuffix: true, locale: vi })}
          </p>
        </div>
      </div>
    </div>
  );
}
