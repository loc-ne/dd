'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
    CheckCircle, XCircle, AlertCircle, Eye,
    MapPin, Phone, Calendar,
    Wifi, Zap, Droplets, Car, Shield, Home, Users, Layers, Loader2, ChevronLeft, ChevronRight
} from 'lucide-react';
import DescriptionViewer from '@/components/DescriptionViewer';

// --- 1. TYPES & ENUMS (Khớp với API Response) ---

enum RoomTypeEnum { ROOM = 'ROOM', STUDIO = 'STUDIO', DORM = 'DORM', HOUSE = 'HOUSE' }
enum TargetGender { ALL = 'ALL', MALE = 'MALE', FEMALE = 'FEMALE' }
enum UtilityUnit { KWH = 'KWH', M3 = 'M3', PERSON = 'PERSON', ROOM = 'ROOM', FREE = 'FREE' }
enum ModerationStatus {
  DRAFT = 'DRAFT',         // Nháp
  PENDING = 'PENDING',     // Chờ duyệt
  APPROVED = 'APPROVED',   // Đã duyệt
  REJECTED = 'REJECTED',   // Từ chối
  NEEDS_EDIT = 'NEEDS_EDIT', // Cần chỉnh sửa
}

// Interface cho Host
interface Host {
    id: number;
    fullName: string;
    phoneNumber: string;
    avatarUrl: string | null;
}

// Interface cho Image
interface RoomImage {
    id: number;
    imageUrl: string;
    isThumbnail: boolean;
}

// Interface cho Amenity (trong chi tiết)
interface RoomAmenity {
    amenity: {
        id: number;
        name: string;
        icon?: string;
    }
}

const RoomTypeLabel: Record<RoomTypeEnum, string> = {
    ROOM: 'Phòng trọ',
    STUDIO: 'Chung cư mini / Studio',
    DORM: 'KTX / Ở ghép',
    HOUSE: 'Nhà nguyên căn',
};

// Interface chính cho Room (Dùng chung cho cả List và Detail để đơn giản hóa)
interface Room {
    id: number;
    title: string;
    description: string;
    roomType: RoomTypeEnum;
    // Địa chỉ
    city: string;
    district: string;
    ward: string;
    address: string;
    // Thông số
    area: number;
    guestCapacity: number;
    gender: TargetGender;
    // Giá (API trả về string)
    pricePerMonth: string;
    deposit: string;
    minLeaseTerm: number;
    // Phí dịch vụ
    electricityPrice: string;
    electricityUnit: UtilityUnit;
    waterPrice: string;
    waterUnit: UtilityUnit;
    wifiPrice: string;
    parkingFee: string;
    managementFee: string;
    // Quan hệ
    host: Host;
    images: RoomImage[];
    roomAmenities?: RoomAmenity[]; // Chỉ có trong detail
    createdAt: string;
    status: string;
    moderationStatus: ModerationStatus;
}

// --- 2. HELPERS ---

const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
};

const getUnitLabel = (unit: UtilityUnit) => {
    const map: Record<UtilityUnit, string> = {
        [UtilityUnit.KWH]: 'đ / kWh',
        [UtilityUnit.M3]: 'đ / khối',
        [UtilityUnit.PERSON]: 'đ / người',
        [UtilityUnit.ROOM]: 'đ / phòng',
        [UtilityUnit.FREE]: 'Miễn phí',
    };
    return map[unit] || unit;
};

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    }).format(date);
};

// --- 3. COMPONENTS ---

// --- 4. MAIN PAGE ---

export default function ModerationPage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    
    const [viewMode, setViewMode] = useState<'LIST' | 'DETAIL'>('LIST');
    const [listings, setListings] = useState<Room[]>([]);
    const [selectedListing, setSelectedListing] = useState<Room | null>(null);
    const [previewIndex, setPreviewIndex] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDetailLoading, setIsDetailLoading] = useState(false);
    const [moderationNote, setModerationNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Modal states
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        action: 'APPROVE' | 'REJECT' | 'NEEDS_EDIT' | null;
        title: string;
        message: string;
    }>({ isOpen: false, action: null, title: '', message: '' });
    
    const [notifyModal, setNotifyModal] = useState<{
        isOpen: boolean;
        type: 'success' | 'error' | 'warning';
        title: string;
        message: string;
    }>({ isOpen: false, type: 'success', title: '', message: '' });

    // Fetch danh sách Pending khi mount (auth đã được kiểm tra ở layout)
    useEffect(() => {
        fetchPendingRooms();
    }, []);

    const fetchPendingRooms = async () => {
        try {
            setIsLoading(true);
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/rooms/pending`);
            const data = await res.json();
            if (data.success) {
                setListings(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch pending rooms:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // 2. Xử lý khi bấm Review -> Gọi API chi tiết
    const handleReview = async (id: number) => {
        try {
            setIsDetailLoading(true);
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/rooms/admin-detail/${id}`);
            const data = await res.json();
            if (data.success) {
                setSelectedListing(data.data);
                setViewMode('DETAIL');
            }
        } catch (error) {
            setNotifyModal({
                isOpen: true,
                type: 'error',
                title: 'Lỗi tải dữ liệu',
                message: 'Không thể tải chi tiết phòng!'
            });
            console.error(error);
        } finally {
            setIsDetailLoading(false);
        }
    };

    // 3. Xử lý Action (Approve/Reject)
    const handleAction = (action: 'APPROVE' | 'REJECT' | 'NEEDS_EDIT') => {
        if (!selectedListing) return;

        // Validate: Bắt buộc phải có ghi chú khi REJECT hoặc NEEDS_EDIT
        if ((action === 'REJECT' || action === 'NEEDS_EDIT') && !moderationNote.trim()) {
            setNotifyModal({
                isOpen: true,
                type: 'warning',
                title: 'Thiếu thông tin',
                message: 'Vui lòng nhập lý do từ chối hoặc yêu cầu chỉnh sửa!'
            });
            return;
        }

        // Show confirm modal
        const actionConfig = {
            APPROVE: { title: 'Xác nhận duyệt tin', message: 'Tin đăng sẽ được công khai và người dùng có thể xem được.' },
            NEEDS_EDIT: { title: 'Yêu cầu chỉnh sửa', message: 'Chủ nhà sẽ nhận được thông báo và có thể chỉnh sửa tin đăng.' },
            REJECT: { title: 'Xác nhận từ chối', message: 'Tin đăng sẽ bị ẩn và chủ nhà sẽ nhận được thông báo từ chối.' }
        };
        
        setConfirmModal({
            isOpen: true,
            action,
            title: actionConfig[action].title,
            message: actionConfig[action].message
        });
    };

    // Execute moderation action
    const executeModeration = async () => {
        if (!selectedListing || !confirmModal.action) return;
        
        const action = confirmModal.action;
        setConfirmModal({ isOpen: false, action: null, title: '', message: '' });

        try {
            setIsSubmitting(true);

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/rooms/${selectedListing.id}/moderation`, {
                method: 'PATCH',
                credentials: 'include', // Tự động gửi cookie
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                        // Map local action to server's ModerationStatus enum values
                        decision: action === 'APPROVE' ? 'APPROVED' : (action === 'REJECT' ? 'REJECTED' : 'NEEDS_EDIT'),
                        reason: moderationNote.trim() || undefined,
                    }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Có lỗi xảy ra khi kiểm duyệt');
            }

            if (data.success) {
                const actionText = action === 'APPROVE' ? 'duyệt' : action === 'NEEDS_EDIT' ? 'yêu cầu chỉnh sửa' : 'từ chối';
                
                // Xóa khỏi danh sách chờ duyệt
                setListings(prev => prev.filter(item => item.id !== selectedListing.id));
                // Reset state và quay về danh sách
                setViewMode('LIST');
                setSelectedListing(null);
                setModerationNote('');
                
                // Show success notification
                setNotifyModal({
                    isOpen: true,
                    type: 'success',
                    title: 'Thành công',
                    message: `Đã ${actionText} tin đăng thành công!`
                });
            }
        } catch (error) {
            console.error('Error moderating room:', error);
            setNotifyModal({
                isOpen: true,
                type: 'error',
                title: 'Có lỗi xảy ra',
                message: error instanceof Error ? error.message : 'Không thể kết nối đến server!'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- LOADING STATE ---
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 text-slate-500 gap-2">
                <Loader2 className="animate-spin" /> Đang tải dữ liệu...
            </div>
        );
    }

    // --- CONFIRMATION MODAL ---
    const ConfirmModal = () => {
        if (!confirmModal.isOpen) return null;
        
        const actionColors = {
            APPROVE: { bg: 'bg-green-600', hover: 'hover:bg-green-700', ring: 'ring-green-100' },
            NEEDS_EDIT: { bg: 'bg-amber-600', hover: 'hover:bg-amber-700', ring: 'ring-amber-100' },
            REJECT: { bg: 'bg-red-600', hover: 'hover:bg-red-700', ring: 'ring-red-100' }
        };
        
        const colors = confirmModal.action ? actionColors[confirmModal.action] : actionColors.APPROVE;
        
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-200" onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}>
                <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                    <div className="p-6">
                        <div className={`w-12 h-12 rounded-full ${colors.bg} ${colors.ring} ring-4 flex items-center justify-center mb-4`}>
                            {confirmModal.action === 'APPROVE' && <CheckCircle size={24} className="text-white" />}
                            {confirmModal.action === 'NEEDS_EDIT' && <AlertCircle size={24} className="text-white" />}
                            {confirmModal.action === 'REJECT' && <XCircle size={24} className="text-white" />}
                        </div>
                        
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">{confirmModal.title}</h3>
                        <p className="text-sm text-slate-600 mb-6">{confirmModal.message}</p>
                        
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                                className="flex-1 px-4 py-2.5 rounded border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={executeModeration}
                                className={`flex-1 px-4 py-2.5 rounded ${colors.bg} ${colors.hover} text-white font-semibold transition-colors`}
                            >
                                Xác nhận
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // --- NOTIFICATION MODAL ---
    const NotifyModal = () => {
        if (!notifyModal.isOpen) return null;
        
        const typeConfig = {
            success: { icon: <CheckCircle size={24} />, bg: 'bg-green-50', iconBg: 'bg-green-100', iconColor: 'text-green-600', titleColor: 'text-green-900' },
            error: { icon: <XCircle size={24} />, bg: 'bg-red-50', iconBg: 'bg-red-100', iconColor: 'text-red-600', titleColor: 'text-red-900' },
            warning: { icon: <AlertCircle size={24} />, bg: 'bg-amber-50', iconBg: 'bg-amber-100', iconColor: 'text-amber-600', titleColor: 'text-amber-900' }
        };
        
        const config = typeConfig[notifyModal.type];
        
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30  animate-in fade-in duration-200" onClick={() => setNotifyModal({ ...notifyModal, isOpen: false })}>
                <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full mx-4 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                    <div className="p-6">
                        <div className={`w-12 h-12 rounded-full ${config.iconBg} flex items-center justify-center mb-4 ${config.iconColor}`}>
                            {config.icon}
                        </div>
                        
                        <h3 className={`text-lg font-semibold mb-2 ${config.titleColor}`}>{notifyModal.title}</h3>
                        <p className="text-sm text-slate-600 mb-6">{notifyModal.message}</p>
                        
                        <button
                            onClick={() => setNotifyModal({ ...notifyModal, isOpen: false })}
                            className="w-full px-4 py-2.5 rounded bg-slate-900 hover:bg-slate-800 text-white font-medium transition-colors"
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // --- VIEW 1: THE QUEUE (DANH SÁCH CHỜ) ---
    if (viewMode === 'LIST') {
        return (
            <>
                <ConfirmModal />
                <NotifyModal />
                <div className="min-h-screen bg-slate-50">
                {/* Header */}
                <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
                    <div className="px-6 lg:px-8 py-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-3">
                                    <Home className="w-8 h-8 text-amber-600" />
                                    Kiểm duyệt tin đăng
                                </h1>
                                <p className="text-sm text-slate-500 mt-1">{listings.length} tin đang chờ xử lý</p>
                            </div>
                            <button
                                onClick={fetchPendingRooms}
                                className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition font-medium"
                            >
                                <Loader2 className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                                <span className="hidden sm:inline">Làm mới</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="px-6 lg:px-8 py-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wide">Tin đăng</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wide hidden lg:table-cell">Thông số</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wide">Giá</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wide hidden md:table-cell">Chủ nhà</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wide hidden sm:table-cell">Ngày đăng</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wide text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {listings.map((room) => {
                                // Lấy ảnh thumbnail hoặc ảnh đầu tiên
                                const thumb = room.images.find(img => img.isThumbnail)?.imageUrl || room.images[0]?.imageUrl || '/placeholder.png';

                                return (
                                    <tr key={room.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex gap-3 items-center">
                                                <img src={thumb} alt="thumb" className="w-14 h-14 rounded-xl object-cover bg-slate-100 border border-slate-200" />
                                                <div>
                                                    <p className="font-semibold text-slate-900 line-clamp-1 max-w-[250px]">{room.title}</p>
                                                    <div className="flex items-center text-sm text-slate-500 mt-1">
                                                        <MapPin size={16} className="mr-1" />
                                                        {room.district}, {room.city}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 hidden lg:table-cell">
                                            <div className="flex flex-col gap-1 items-start">
                                                <span className="text-sm text-slate-600">
                                                    {room.area}m² • {room.guestCapacity} người
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-slate-900">{formatCurrency(room.pricePerMonth)}</p>
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell">
                                            <div className="flex items-center gap-2">
                                                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold overflow-hidden">
                                                    {room.host.avatarUrl ? <img src={room.host.avatarUrl} alt="avt" className="w-full h-full object-cover" /> : room.host.fullName.charAt(0)}
                                                </div>
                                                <div className="text-sm">
                                                    <p className="font-medium text-slate-900">{room.host.fullName}</p>
                                                    <p className="text-slate-500 text-xs">{room.host.phoneNumber}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500 hidden sm:table-cell">{formatDate(room.createdAt)}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleReview(room.id)}
                                                disabled={isDetailLoading}
                                                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isDetailLoading ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
                                                Xem xét
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {listings.length === 0 && !isLoading && (
                                <tr>
                                    <td colSpan={6} className="p-16 text-center">
                                        <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                                        <p className="text-slate-600 font-medium">Không có tin nào chờ duyệt</p>
                                        <p className="text-sm text-slate-400">Tất cả đã được xử lý</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            </div>
            </>
        );
    }

    // --- VIEW 2: THE WORKSTATION (CHI TIẾT DUYỆT) ---
    if (!selectedListing) return null;
    const r = selectedListing;

    return (
        <>
            <ConfirmModal />
            <NotifyModal />
            <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
            {/* Top Nav */}
            <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 bg-white z-20 shadow-sm">
                <button onClick={() => setViewMode('LIST')} className="text-slate-600 hover:text-slate-900 flex items-center gap-2 text-sm font-medium transition-colors">
                    ← Quay lại
                </button>
                <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${
                        r.moderationStatus === 'APPROVED' ? 'bg-green-50 text-green-700 border-green-200' : 
                        r.moderationStatus === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' :
                        'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                        {r.moderationStatus}
                    </span>
                    <span className="text-sm text-slate-500">#{r.id}</span>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* --- CỘT TRÁI --- */}
                <div className="lg:col-span-8 space-y-6 pb-20">

                    {/* --- GALLERY SECTION --- */}
                    <div className="bg-white rounded-lg border border-slate-200 p-5">
                        <h3 className="font-semibold text-slate-900 text-sm mb-4 flex items-center justify-between">
                            Hình ảnh ({r.images?.length || 0})
                            <span className="text-xs font-normal text-slate-500">
                                Click để phóng to
                            </span>
                        </h3>

                        {r.images && r.images.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {r.images.map((img, idx) => (
                                    <div
                                        key={img.id}
                                        onClick={() => setPreviewIndex(idx)}
                                        className="group relative aspect-[4/3] rounded-md overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer hover:border-slate-300 transition-colors"
                                    >
                                        <img
                                            src={img.imageUrl}
                                            alt={`image-${idx}`}
                                            className="w-full h-full object-cover"
                                        />

                                        {img.isThumbnail && (
                                            <div className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded">
                                                Thumbnail
                                            </div>
                                        )}

                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 text-slate-700 text-xs px-2.5 py-1 rounded font-medium flex items-center gap-1">
                                                <Eye size={12} /> Xem
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-32 rounded-md border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 text-sm">
                                <AlertCircle size={20} className="mb-1" />
                                <p>Chưa có hình ảnh</p>
                            </div>
                        )}
                    </div>

                    {/* 2. MODAL LIGHTBOX (ZOOM ẢNH) - Đặt đoạn này ở cuối component hoặc ngay dưới Grid */}
                    {previewIndex !== null && r.images && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm animate-in fade-in duration-200"
                            onClick={() => setPreviewIndex(null)} // Click ra ngoài để đóng
                        >
                            {/* Nút Đóng */}
                            <button
                                type="button"
                                aria-label="Đóng xem ảnh"
                                className="absolute top-5 right-5 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all"
                                onClick={() => setPreviewIndex(null)}
                            >
                                <XCircle size={32} />
                            </button>

                            {/* Nút Prev */}
                            <button
                                type="button"
                                aria-label="Ảnh trước"
                                className="absolute left-5 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all"
                                onClick={(e) => {
                                    e.stopPropagation(); // Chặn sự kiện click đóng modal
                                    setPreviewIndex((prev) => (prev === 0 ? r.images.length - 1 : prev! - 1));
                                }}
                            >
                                <ChevronLeft size={40} />
                            </button>

                            {/* Ảnh Chính */}
                            <div className="relative max-w-[90vw] max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
                                <img
                                    src={r.images[previewIndex].imageUrl}
                                    alt="Preview"
                                    className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl border border-white/10"
                                />
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur px-4 py-1 rounded-full text-white text-sm font-medium border border-white/10">
                                    Ảnh {previewIndex + 1} / {r.images.length}
                                    {r.images[previewIndex].isThumbnail && <span className="ml-2 text-indigo-400 font-bold">• Thumbnail</span>}
                                </div>
                            </div>

                            {/* Nút Next */}
                            <button
                                type="button"
                                aria-label="Ảnh tiếp theo"
                                className="absolute right-5 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setPreviewIndex((prev) => (prev === r.images.length - 1 ? 0 : prev! + 1));
                                }}
                            >
                                <ChevronRight size={40} />
                            </button>
                        </div>
                    )}

                    {/* Header Info */}
                    <div className="bg-white rounded-lg border border-slate-200 p-5">
                        <div className="flex gap-2 mb-3">
                            {/* Room Type */}
                            <span className="px-2 py-0.5 rounded-full border bg-slate-50 text-xs font-medium text-slate-600">
                                {RoomTypeLabel[r.roomType]}
                            </span>

                            {/* Gender */}
                            <span className="px-2 py-0.5 rounded-full border bg-slate-50 text-xs font-medium text-slate-600">
                                {r.gender === 'ALL' ? 'Nam & Nữ' : r.gender === 'MALE' ? 'Nam' : 'Nữ'}
                            </span>
                        </div>

                        <h1 className="text-3xl font-bold text-slate-900 leading-tight mb-2">{r.title}</h1>
                        <div className="flex items-center text-slate-500 gap-1">
                            <MapPin size={18} className="text-red-500" />
                            <span className="hover:underline cursor-pointer">{r.address}, {r.ward}, {r.district}, {r.city}</span>
                        </div>
                    </div>

                    {/* Specs Cards */}
                    <div className="bg-white rounded-lg border border-slate-200 p-5">
                        <h3 className="font-semibold text-slate-900 text-sm mb-4">Thông số cơ bản</h3>
                        <div className="grid grid-cols-4 gap-4">
                            <div className="p-3 rounded bg-slate-50 border border-slate-100">
                                <p className="text-slate-500 text-xs font-medium mb-1">Diện tích</p>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-lg font-semibold text-slate-900">{r.area}</span>
                                    <span className="text-xs text-slate-500">m²</span>
                                </div>
                            </div>
                            <div className="p-3 rounded bg-slate-50 border border-slate-100">
                                <p className="text-slate-500 text-xs font-medium mb-1">Sức chứa</p>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-lg font-semibold text-slate-900">{r.guestCapacity}</span>
                                    <span className="text-xs text-slate-500">người</span>
                                </div>
                            </div>
                            <div className="p-3 rounded bg-slate-50 border border-slate-100">
                                <p className="text-slate-500 text-xs font-medium mb-1">HĐ tối thiểu</p>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-lg font-semibold text-slate-900">{r.minLeaseTerm}</span>
                                    <span className="text-xs text-slate-500">tháng</span>
                                </div>
                            </div>
                            <div className="p-3 rounded bg-slate-50 border border-slate-100">
                                <p className="text-slate-500 text-xs font-medium mb-1">Phí cọc</p>
                                <span className="text-base font-semibold text-slate-900">{formatCurrency(r.deposit)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Pricing Table */}
                    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                        <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
                            <h3 className="font-semibold text-slate-900 text-sm">Chi phí</h3>
                        </div>
                        <table className="w-full text-sm">
                            <tbody className="divide-y divide-slate-100">
                                <tr className="bg-slate-50">
                                    <td className="px-5 py-3 font-medium text-slate-700">Giá thuê</td>
                                    <td className="px-5 py-3 font-semibold text-slate-900 text-right">{formatCurrency(r.pricePerMonth)} / tháng</td>
                                </tr>
                                <tr>
                                    <td className="px-5 py-2.5 text-slate-600 flex items-center gap-2"><Zap size={14} className="text-slate-400" /> Điện</td>
                                    <td className="px-5 py-2.5 text-slate-700 text-right">{formatCurrency(r.electricityPrice)} {getUnitLabel(r.electricityUnit)}</td>
                                </tr>
                                <tr>
                                    <td className="px-5 py-2.5 text-slate-600 flex items-center gap-2"><Droplets size={14} className="text-slate-400" /> Nước</td>
                                    <td className="px-5 py-2.5 text-slate-700 text-right">{formatCurrency(r.waterPrice)} {getUnitLabel(r.waterUnit)}</td>
                                </tr>
                                <tr>
                                    <td className="px-5 py-2.5 text-slate-600 flex items-center gap-2"><Wifi size={14} className="text-slate-400" /> Wifi</td>
                                    <td className="px-5 py-2.5 text-slate-700 text-right">{r.wifiPrice === "0" ? 'Miễn phí' : `${formatCurrency(r.wifiPrice)} / tháng`}</td>
                                </tr>
                                <tr>
                                    <td className="px-5 py-2.5 text-slate-600 flex items-center gap-2"><Car size={14} className="text-slate-400" /> Gửi xe</td>
                                    <td className="px-5 py-2.5 text-slate-700 text-right">{r.parkingFee === "0" ? 'Miễn phí' : `${formatCurrency(r.parkingFee)} / xe`}</td>
                                </tr>
                                <tr>
                                    <td className="px-5 py-2.5 text-slate-600 flex items-center gap-2"><Shield size={14} className="text-slate-400" /> Phí quản lý</td>
                                    <td className="px-5 py-2.5 text-slate-700 text-right">{r.managementFee === "0" ? 'Miễn phí' : `${formatCurrency(r.managementFee)}`}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Amenities */}
                    <div className="bg-white rounded-lg border border-slate-200 p-5">
                        <h3 className="font-semibold text-slate-900 text-sm mb-4">
                            Tiện nghi
                        </h3>

                        <div className="flex flex-wrap gap-2">
                            {r.roomAmenities && r.roomAmenities.length > 0 ? (
                                r.roomAmenities.map((item, i) => (
                                    <span
                                        key={i}
                                        className="px-3 py-1.5 rounded-full border bg-slate-50 text-sm text-slate-700 font-medium flex items-center gap-2"
                                    >
                                        {/* Icon to hơn */}
                                        {item.amenity.icon && (
                                            <span
                                                className="w-6 h-6 flex-shrink-0"
                                                dangerouslySetInnerHTML={{ __html: item.amenity.icon }}
                                            />
                                        )}
                                        {item.amenity.name}
                                    </span>
                                ))
                            ) : (
                                <span className="text-slate-400 italic text-sm">
                                    Không có tiện nghi đặc biệt
                                </span>
                            )}
                        </div>
                    </div>


                    {/* Description */}
                    <div className="bg-white rounded-lg border border-slate-200 p-5">
                        <h3 className="font-semibold text-slate-900 text-sm mb-4">Mô tả chi tiết</h3>
                        <div className="text-slate-600 text-sm leading-relaxed bg-slate-50 p-4 rounded border border-slate-100">
                            <DescriptionViewer description={r.description} />
                        </div>
                    </div>

                </div>

                {/* --- CỘT PHẢI --- */}
                <div className="lg:col-span-4">
                    <div className="sticky top-24 space-y-4">

                        {/* Host Profile */}
                        <div className="bg-white border border-slate-200 rounded-lg p-5">
                            <p className="text-xs font-semibold text-slate-500 uppercase mb-3 tracking-wide">Chủ nhà</p>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-lg overflow-hidden">
                                    {r.host.avatarUrl ? <img src={r.host.avatarUrl} alt="host" /> : r.host.fullName.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900 text-lg">{r.host.fullName}</p>
                                    <div className="flex items-center gap-1 text-slate-500 text-sm">
                                        <Phone size={14} />
                                        <span>{r.host.phoneNumber}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2 text-xs">
                                <button className="flex-1 py-1.5 rounded border border-slate-300 text-slate-600 font-medium hover:bg-slate-50 transition-colors">Xem profile</button>
                                <button className="flex-1 py-1.5 rounded border border-slate-300 text-slate-600 font-medium hover:bg-slate-50 transition-colors">Lịch sử</button>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="bg-white border border-slate-200 rounded-lg p-5">
                            <h3 className="font-semibold text-slate-900 text-sm mb-1">Quyết định</h3>
                            <p className="text-xs text-slate-500 mb-4">Chọn hành động phù hợp với tin đăng này</p>

                            <div className="mb-4">
                                <label className="text-xs font-medium text-slate-700 mb-2 block">
                                    Ghi chú <span className="text-slate-400">(bắt buộc khi từ chối)</span>
                                </label>
                                <textarea
                                    value={moderationNote}
                                    onChange={(e) => setModerationNote(e.target.value)}
                                    disabled={isSubmitting}
                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-slate-400 focus:border-transparent focus:outline-none min-h-[90px] disabled:bg-slate-50 disabled:cursor-not-allowed resize-none"
                                    placeholder="Nhập lý do hoặc yêu cầu chỉnh sửa..."
                                ></textarea>
                            </div>

                            <div className="flex flex-col gap-2.5">
                                <button
                                    onClick={() => handleAction('APPROVE')}
                                    disabled={isSubmitting}
                                    className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded font-semibold text-sm transition-colors flex justify-center items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                                    Duyệt tin
                                </button>

                                <button
                                    onClick={() => handleAction('NEEDS_EDIT')}
                                    disabled={isSubmitting}
                                    className="w-full py-2.5 bg-white border border-amber-600 text-amber-700 hover:bg-amber-50 rounded font-semibold text-sm transition-colors flex justify-center items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <AlertCircle size={16} />}
                                    Yêu cầu sửa
                                </button>

                                <button
                                    onClick={() => handleAction('REJECT')}
                                    disabled={isSubmitting}
                                    className="w-full py-2.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded font-medium text-sm transition-colors flex justify-center items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                                    Từ chối
                                </button>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
        </>
    );
}