'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams } from 'next/navigation';
import { toast, Toaster } from 'react-hot-toast';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit3,
  Trash2,
  MapPin,
  Clock,
  Home,
  RefreshCw,
  X,
  AlertTriangle,
} from 'lucide-react';

interface Room {
  id: number;
  title: string;
  address: string;
  district: string;
  city: string;
  pricePerMonth: number;
  area: number;
  moderationStatus: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEEDS_EDIT';
  images: Array<{ imageUrl: string }>;
  totalViews: number;
  createdAt: string;
  updatedAt: string;
}

const STATUS_CONFIG = {
  DRAFT: { label: 'Nháp', color: 'bg-slate-500', textColor: 'text-slate-700', bgLight: 'bg-slate-50' },
  PENDING: { label: 'Chờ duyệt', color: 'bg-amber-500', textColor: 'text-amber-700', bgLight: 'bg-amber-50' },
  APPROVED: { label: 'Đang hiển thị', color: 'bg-blue-500', textColor: 'text-blue-700', bgLight: 'bg-blue-50' },
  REJECTED: { label: 'Bị từ chối', color: 'bg-red-500', textColor: 'text-red-700', bgLight: 'bg-red-50' },
  NEEDS_EDIT: { label: 'Cần sửa', color: 'bg-orange-500', textColor: 'text-orange-700', bgLight: 'bg-orange-50' },
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN').format(amount);
};

export default function HostRoomsPage() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ id: number; title: string } | null>(null);

  const statusMsg = searchParams.get('status');
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/rooms/my-rooms`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setRooms(data.data);
      }
    } catch (error) {
      toast.error('Không thể tải danh sách phòng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchRooms();
  }, [user]);

  const handleDelete = async () => {
    if (!deleteModal) return;

    setDeletingId(deleteModal.id);
    try {
      const res = await fetch(`${API_URL}/rooms/${deleteModal.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success('Đã xóa phòng thành công!');
        setRooms(rooms.filter((r) => r.id !== deleteModal.id));
        setDeleteModal(null);
      } else {
        toast.error(data.message || 'Không thể xóa phòng');
      }
    } catch (error) {
      toast.error('Lỗi khi xóa phòng');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredRooms = rooms
    .filter((r) => filterStatus === 'ALL' || r.moderationStatus === filterStatus)
    .filter((r) => 
      searchQuery === '' || 
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.address.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const statusCounts = {
    ALL: rooms.length,
    DRAFT: rooms.filter((r) => r.moderationStatus === 'DRAFT').length,
    PENDING: rooms.filter((r) => r.moderationStatus === 'PENDING').length,
    APPROVED: rooms.filter((r) => r.moderationStatus === 'APPROVED').length,
    NEEDS_EDIT: rooms.filter((r) => r.moderationStatus === 'NEEDS_EDIT').length,
    REJECTED: rooms.filter((r) => r.moderationStatus === 'REJECTED').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Toaster position="top-center" />

      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Quản lý phòng</h1>
              <p className="text-slate-500 mt-1">
                Bạn đang có <span className="font-semibold text-blue-600">{rooms.length}</span> phòng
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchRooms}
                disabled={loading}
                className="p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <Link
                href="/room/post"
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition shadow-lg shadow-blue-600/20"
              >
                <Plus className="w-5 h-5" />
                <span>Đăng tin mới</span>
              </Link>
            </div>
          </div>

          {/* Verification Warning */}
          {statusMsg === 'verification_needed' && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-blue-900">Xác thực email để hiển thị tin</p>
                <p className="text-sm text-blue-700">
                  Chúng tôi đã gửi link tới <b>{user?.email}</b>
                </p>
              </div>
              <button className="text-sm font-semibold text-blue-600 hover:underline">
                Gửi lại
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="px-6 lg:px-8 py-6 space-y-6">
        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, địa chỉ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {[
              { key: 'ALL', label: 'Tất cả' },
              { key: 'APPROVED', label: 'Đang hiển thị' },
              { key: 'PENDING', label: 'Chờ duyệt' },
              { key: 'NEEDS_EDIT', label: 'Cần sửa' },
              { key: 'DRAFT', label: 'Nháp' },
              { key: 'REJECTED', label: 'Từ chối' },
            ].map((status) => (
              <button
                key={status.key}
                onClick={() => setFilterStatus(status.key)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border
                  ${filterStatus === status.key
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}
                `}
              >
                {status.label}
                <span className={`
                  text-xs px-1.5 py-0.5 rounded-full
                  ${filterStatus === status.key ? 'bg-white/20' : 'bg-slate-100'}
                `}>
                  {statusCounts[status.key as keyof typeof statusCounts]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Room List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm">
                <div className="h-48 bg-slate-200 animate-pulse" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-slate-200 rounded animate-pulse w-3/4" />
                  <div className="h-4 bg-slate-200 rounded animate-pulse w-1/2" />
                  <div className="h-4 bg-slate-200 rounded animate-pulse w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Home className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              {searchQuery || filterStatus !== 'ALL' ? 'Không tìm thấy phòng' : 'Chưa có phòng nào'}
            </h3>
            <p className="text-slate-500 mb-6">
              {searchQuery || filterStatus !== 'ALL'
                ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'
                : 'Bắt đầu đăng tin để cho thuê phòng'}
            </p>
            {!searchQuery && filterStatus === 'ALL' && (
              <Link
                href="/room/post"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition"
              >
                <Plus className="w-5 h-5" />
                Đăng tin đầu tiên
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredRooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                onDelete={() => setDeleteModal({ id: room.id, title: room.title })}
                isDeleting={deletingId === room.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 text-center mb-2">
              Xóa tin đăng?
            </h3>
            <p className="text-sm text-slate-500 text-center mb-6">
              Bạn có chắc muốn xóa <span className="font-semibold text-slate-700">&quot;{deleteModal.title}&quot;</span>?
              Thao tác này không thể hoàn tác.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal(null)}
                disabled={deletingId !== null}
                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                disabled={deletingId !== null}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deletingId ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  'Xác nhận xóa'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RoomCard({
  room,
  onDelete,
  isDeleting,
}: {
  room: Room;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const status = STATUS_CONFIG[room.moderationStatus];

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 hover:shadow-lg hover:border-slate-300 transition-all duration-300 group">
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <Image
          src={room.images?.[0]?.imageUrl || '/placeholder-room.jpg'}
          alt={room.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <span className={`inline-flex items-center px-3 py-1.5 text-xs font-bold text-white ${status.color} rounded-lg shadow-lg`}>
            {status.label}
          </span>
        </div>
        {/* Views */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 bg-black/60 backdrop-blur-sm rounded-lg text-white text-xs font-medium">
          <Eye className="w-3.5 h-3.5" />
          {room.totalViews || 0}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition">
          {room.title}
        </h3>

        <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{room.district}, {room.city}</span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-slate-100">
          <div>
            <p className="text-xs text-slate-500 mb-0.5">Giá thuê</p>
            <p className="font-bold text-blue-600">
              {formatCurrency(room.pricePerMonth)}
              <span className="text-xs font-normal text-slate-500">đ/th</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-0.5">Diện tích</p>
            <p className="font-bold text-slate-900">
              {room.area}
              <span className="text-xs font-normal text-slate-500">m²</span>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Clock className="w-3.5 h-3.5" />
            {new Date(room.updatedAt).toLocaleDateString('vi-VN')}
          </div>

          <div className="flex items-center gap-1.5">
            <Link
              href={`/room/edit/${room.id}`}
              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
              title="Chỉnh sửa"
            >
              <Edit3 className="w-4 h-4" />
            </Link>
            {room.moderationStatus === 'APPROVED' && (
              <Link
                href={`/rooms/${room.id}`}
                className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                title="Xem chi tiết"
              >
                <Eye className="w-4 h-4" />
              </Link>
            )}
            <button
              onClick={onDelete}
              disabled={isDeleting}
              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
              title="Xóa"
            >
              {isDeleting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
