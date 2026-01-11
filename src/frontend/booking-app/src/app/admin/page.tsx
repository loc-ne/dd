'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import toast, { Toaster } from 'react-hot-toast';
import {
  Users,
  Home,
  FileWarning,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Eye,
  Lock,
  Unlock,
  RefreshCw,
  Building,
  Shield,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// Types
interface User {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  avatarUrl: string | null;
  isHost: boolean;
  isAdmin: boolean;
  isActive: boolean;
  lockReason: string | null;
  createdAt: string;
}

interface PendingRoom {
  id: number;
  title: string;
  pricePerMonth: string;
  district: string;
  city: string;
  createdAt: string;
  host: {
    id: number;
    fullName: string;
    avatarUrl: string | null;
  };
  images: Array<{ imageUrl: string; isThumbnail: boolean }>;
}

interface Dispute {
  id: number;
  reason: string;
  status: string;
  createdAt: string;
  booking: {
    depositAmount: number;
    room: {
      title: string;
      images: Array<{ imageUrl: string }>;
    };
  };
  renter: {
    fullName: string;
    email: string;
  };
}

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  lockedUsers: number;
  hostUsers: number;
  pendingRooms: number;
  pendingDisputes: number;
}

const formatCurrency = (amount: string | number) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    lockedUsers: 0,
    hostUsers: 0,
    pendingRooms: 0,
    pendingDisputes: 0,
  });
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [pendingRooms, setPendingRooms] = useState<PendingRoom[]>([]);
  const [pendingDisputes, setPendingDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch all data in parallel
      const [usersRes, roomsRes, disputesRes] = await Promise.all([
        fetch(`${API_URL}/users`, { credentials: 'include' }),
        fetch(`${API_URL}/rooms/pending`, { credentials: 'include' }),
        fetch(`${API_URL}/dispute/pending`, { credentials: 'include' }),
      ]);

      const [usersData, roomsData, disputesData] = await Promise.all([
        usersRes.json(),
        roomsRes.json(),
        disputesRes.json(),
      ]);

      // Process users data
      if (usersData.success) {
        const users = usersData.data as User[];
        setRecentUsers(users.slice(0, 5));
        setStats(prev => ({
          ...prev,
          totalUsers: users.length,
          activeUsers: users.filter(u => u.isActive && !u.lockReason).length,
          lockedUsers: users.filter(u => u.lockReason).length,
          hostUsers: users.filter(u => u.isHost).length,
        }));
      }

      // Process rooms data
      if (roomsData.success) {
        setPendingRooms(roomsData.data.slice(0, 5));
        setStats(prev => ({ ...prev, pendingRooms: roomsData.data.length }));
      }

      // Process disputes data
      if (disputesData.success) {
        setPendingDisputes(disputesData.data.slice(0, 5));
        setStats(prev => ({ ...prev, pendingDisputes: disputesData.data.length }));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Không thể tải dữ liệu dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Quick action: Lock/Unlock user
  const handleToggleLock = async (userId: number, isLocked: boolean) => {
    setActionLoading(userId);
    try {
      const endpoint = isLocked ? `${API_URL}/users/${userId}/unlock` : `${API_URL}/users/${userId}/lock`;
      const body = isLocked ? {} : { reason: 'Vi phạm chính sách' };
      
      const response = await fetch(endpoint, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json();
      if (result.success) {
        toast.success(isLocked ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản');
        fetchDashboardData();
      } else {
        toast.error(result.message || 'Thao tác thất bại');
      }
    } catch (error) {
      toast.error('Lỗi kết nối server');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span>Đang tải dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster position="top-center" />
      
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-10">
        <div className="px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Dashboard</span>
              </div>
              <h1 className="text-xl lg:text-2xl font-semibold text-slate-900 mt-1">
                Xin chào, {user?.fullName?.split(' ').pop()}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500 hidden sm:block">
                {format(new Date(), "dd MMM, yyyy", { locale: vi })}
              </span>
              <button
                onClick={fetchDashboardData}
                className="p-2.5 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all text-blue-600"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 lg:px-8 py-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Người dùng"
            value={stats.totalUsers}
            icon={Users}
            subtitle={`${stats.activeUsers} hoạt động`}
          />
          <StatsCard
            title="Chủ nhà"
            value={stats.hostUsers}
            icon={Building}
            subtitle="Đã xác minh"
          />
          <StatsCard
            title="Chờ duyệt"
            value={stats.pendingRooms}
            icon={Home}
            subtitle="Cần xử lý"
            highlight={stats.pendingRooms > 0}
          />
          <StatsCard
            title="Khiếu nại"
            value={stats.pendingDisputes}
            icon={FileWarning}
            subtitle="Đang chờ"
            highlight={stats.pendingDisputes > 0}
          />
        </div>

        {/* Quick Actions & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Pending Rooms */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/60 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-blue-50 rounded-md">
                  <Home className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h2 className="font-medium text-slate-900 text-sm">Tin chờ duyệt</h2>
                  <p className="text-xs text-slate-500">{stats.pendingRooms} tin cần xử lý</p>
                </div>
              </div>
              <Link
                href="/admin/moderation"
                className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition px-2.5 py-1.5 rounded-md hover:bg-blue-50"
              >
                Xem tất cả <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {pendingRooms.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-2.5">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-sm text-slate-600 font-medium">Không có tin chờ duyệt</p>
                  <p className="text-xs text-slate-400 mt-0.5">Tất cả đã được xử lý</p>
                </div>
              ) : (
                pendingRooms.map((room) => (
                  <div key={room.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50/50 transition">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                      {room.images?.[0] ? (
                        <img
                          src={room.images.find(i => i.isThumbnail)?.imageUrl || room.images[0].imageUrl}
                          alt={room.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Home className="w-4 h-4 text-slate-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-slate-900 truncate">{room.title}</h3>
                      <p className="text-xs text-slate-500">{room.district}, {room.city}</p>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-semibold text-slate-900">{formatCurrency(room.pricePerMonth)}</p>
                      <p className="text-xs text-slate-400">
                        {format(new Date(room.createdAt), 'dd/MM/yyyy')}
                      </p>
                    </div>
                    <Link
                      href="/admin/moderation"
                      className="p-2 hover:bg-blue-50 rounded-lg transition text-slate-500 hover:text-blue-600"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pending Disputes */}
          <div className="bg-white rounded-xl border border-slate-200/60 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-orange-50 rounded-md">
                  <FileWarning className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <h2 className="font-medium text-slate-900 text-sm">Khiếu nại</h2>
                  <p className="text-xs text-slate-500">{stats.pendingDisputes} chờ xử lý</p>
                </div>
              </div>
              <Link
                href="/admin/disputes"
                className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition px-2.5 py-1.5 rounded-md hover:bg-blue-50"
              >
                Xem <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {pendingDisputes.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-2.5">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-sm text-slate-600 font-medium">Không có khiếu nại</p>
                </div>
              ) : (
                pendingDisputes.map((dispute) => (
                  <div key={dispute.id} className="px-5 py-3.5 hover:bg-slate-50/50 transition">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
                        <AlertCircle className="w-4 h-4 text-orange-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {dispute.renter.fullName}
                        </p>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                          {dispute.reason}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {format(new Date(dispute.createdAt), 'dd/MM HH:mm')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Users */}
        <div className="bg-white rounded-xl border border-slate-200/60 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-blue-50 rounded-md">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h2 className="font-medium text-slate-900 text-sm">Người dùng gần đây</h2>
                <p className="text-xs text-slate-500">{stats.totalUsers} tổng • {stats.lockedUsers} bị khóa</p>
              </div>
            </div>
            <Link
              href="/admin/users"
              className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition px-2.5 py-1.5 rounded-md hover:bg-blue-50"
            >
              Quản lý <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50/80 text-left">
                <tr>
                  <th className="px-5 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wider">Người dùng</th>
                  <th className="px-5 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wider hidden sm:table-cell">Email</th>
                  <th className="px-5 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wider">Loại</th>
                  <th className="px-5 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-5 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wider text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium text-xs flex-shrink-0 shadow-sm">
                          {u.fullName?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{u.fullName}</p>
                          <p className="text-xs text-slate-400 sm:hidden truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-500 hidden sm:table-cell">{u.email}</td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {u.isAdmin && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-600 text-white">
                            Admin
                          </span>
                        )}
                        {u.isHost && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                            Host
                          </span>
                        )}
                        {!u.isAdmin && !u.isHost && (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-500">
                            User
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {u.lockReason ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          Đã khóa
                        </span>
                      ) : u.isActive ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Chờ xác minh
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {!u.isAdmin && (
                        <button
                          onClick={() => handleToggleLock(u.id, !!u.lockReason)}
                          disabled={actionLoading === u.id}
                          className={`p-1.5 rounded-md transition ${
                            u.lockReason
                              ? 'hover:bg-blue-50 text-blue-600'
                              : 'hover:bg-red-50 text-red-500'
                          } disabled:opacity-50`}
                          title={u.lockReason ? 'Mở khóa' : 'Khóa'}
                        >
                          {actionLoading === u.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : u.lockReason ? (
                            <Unlock className="w-4 h-4" />
                          ) : (
                            <Lock className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// Stats Card Component
function StatsCard({
  title,
  value,
  icon: Icon,
  subtitle,
  highlight = false,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  subtitle: string;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-xl p-4 lg:p-5 border transition-all ${
      highlight 
        ? 'bg-orange-50/50 border-orange-200/60' 
        : 'bg-white border-slate-200/60 hover:border-blue-200 hover:shadow-sm'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</span>
        <div className={`p-1.5 rounded-md ${highlight ? 'bg-orange-100' : 'bg-blue-50'}`}>
          <Icon className={`w-4 h-4 ${highlight ? 'text-orange-600' : 'text-blue-600'}`} />
        </div>
      </div>
      <p className="text-2xl lg:text-3xl font-semibold text-slate-900 tabular-nums">{value}</p>
      <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
    </div>
  );
}
