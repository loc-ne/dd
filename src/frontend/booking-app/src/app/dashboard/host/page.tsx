'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
  TrendingUp,
  TrendingDown,
  Eye,
  ArrowUpRight,
  Home,
  CalendarCheck,
  RefreshCw,
  ChevronRight,
  DollarSign,
  BarChart3,
  HelpCircle,
  Target,
  CheckCircle,
  Plus,
  Clock,
} from 'lucide-react';

// ==========================================
// INTERFACES - Khop voi backend DTOs
// ==========================================

interface InventoryStats {
  occupancyChart: {
    rentedCount: number;
    availableCount: number;
    occupancyRate: number;
  };
  totalLostRevenue: number;
  vacantRooms: VacantRoom[];
  totalRooms: number;
}

interface VacantRoom {
  roomId: number;
  roomName: string;
  pricePerMonth: number;
  vacantDays: number;
  lostRevenue: number;
  updatedAt: string;
}

interface ConversionFunnel {
  funnel: {
    totalViews: number;
    totalBookings: number;
    successfulDeposits: number;
  };
  conversionRate: number;
  viewToBookingRate: number;
  bookingToDepositRate: number;
}

interface CashflowStats {
  monthlyDeposit: number;
  totalDeposit: number;
  monthlyTransactionCount: number;
  topRooms: TopRoom[];
  month: number;
  year: number;
}

interface TopRoom {
  roomId: number;
  roomName: string;
  roomType: string;
  totalViews: number;
  totalBookings: number;
  totalDeposits: number;
  totalRevenue: number;
}

interface MonthlyComparison {
  currentMonthDeposit: number;
  previousMonthDeposit: number;
  changePercent: number;
}

// ==========================================
// UTILS
// ==========================================

const formatCurrency = (amount: number) => {
  if (amount >= 1000000000) {
    return `${(amount / 1000000000).toFixed(1)} tỷ`;
  }
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)} triệu`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}K`;
  }
  return amount.toString();
};

const formatFullCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

// Tooltip component
const Tooltip = ({ text }: { text: string }) => (
  <div className="group relative inline-flex ml-1.5">
    <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-normal w-48 text-center z-50 shadow-lg">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
    </div>
  </div>
);

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function HostDashboardOverview() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  // Data states - khop voi backend
  const [inventory, setInventory] = useState<InventoryStats | null>(null);
  const [funnel, setFunnel] = useState<ConversionFunnel | null>(null);
  const [cashflow, setCashflow] = useState<CashflowStats | null>(null);
  const [monthlyComparison, setMonthlyComparison] = useState<MonthlyComparison | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [inventoryRes, funnelRes, cashflowRes, comparisonRes] = await Promise.all([
        fetch(`${API_URL}/host-dashboard/inventory`, { credentials: 'include' }),
        fetch(`${API_URL}/host-dashboard/funnel`, { credentials: 'include' }),
        fetch(`${API_URL}/host-dashboard/cashflow`, { credentials: 'include' }),
        fetch(`${API_URL}/host-dashboard/monthly-comparison`, { credentials: 'include' }),
      ]);

      const [inventoryData, funnelData, cashflowData, comparisonData] = await Promise.all([
        inventoryRes.json(),
        funnelRes.json(),
        cashflowRes.json(),
        comparisonRes.json(),
      ]);

      setInventory(inventoryData);
      setFunnel(funnelData);
      setCashflow(cashflowData);
      setMonthlyComparison(comparisonData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  // Computed values
  const topRoomsArray = Array.isArray(cashflow?.topRooms) ? cashflow.topRooms : [];
  const totalBookings = funnel?.funnel.totalBookings || 0;
  const totalViews = funnel?.funnel.totalViews || 0;
  const successfulDeposits = funnel?.funnel.successfulDeposits || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Tổng quan</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Xin chào, {user?.fullName || 'Host'}! Đây là tình hình kinh doanh của bạn.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/room/post"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
              >
                <Plus className="w-4 h-4" />
                Đăng tin mới
              </Link>
              <button
                onClick={fetchDashboardData}
                disabled={loading}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                title="Làm mới dữ liệu"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 lg:px-8 py-6 space-y-6">
        {/* Stats Cards - 4 cot */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tong tien coc */}
          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-1">
                  <p className="text-sm text-gray-500">Tiền cọc tháng này</p>
                  <Tooltip text="Tổng tiền cọc đã nhận được trong tháng này" />
                </div>
                {loading ? (
                  <div className="h-8 bg-gray-200 rounded animate-pulse w-28 mt-2" />
                ) : (
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatCurrency(cashflow?.monthlyDeposit || 0)}d
                  </p>
                )}
                {monthlyComparison && monthlyComparison.changePercent !== 0 && (
                  <p className={`text-xs mt-1 flex items-center gap-1 ${
                    monthlyComparison.changePercent > 0 ? 'text-green-600' : 'text-red-500'
                  }`}>
                    {monthlyComparison.changePercent > 0 
                      ? <TrendingUp className="w-3 h-3" /> 
                      : <TrendingDown className="w-3 h-3" />}
                    {monthlyComparison.changePercent > 0 ? '+' : ''}{monthlyComparison.changePercent}% so với tháng trước
                  </p>
                )}
              </div>
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Luot xem */}
          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-1">
                  <p className="text-sm text-gray-500">Tổng lượt xem</p>
                  <Tooltip text="Tổng số lần khách hàng xem chi tiết các tin đăng của bạn" />
                </div>
                {loading ? (
                  <div className="h-8 bg-gray-200 rounded animate-pulse w-20 mt-2" />
                ) : (
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {totalViews.toLocaleString('vi-VN')}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  Tất cả tin đăng
                </p>
              </div>
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-gray-600" />
              </div>
            </div>
          </div>

          {/* Ty le chuyen doi */}
          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-1">
                  <p className="text-sm text-gray-500">Tỷ lệ chuyển đổi</p>
                  <Tooltip text="Phần trăm khách xem tin và đặt cọc thành công" />
                </div>
                {loading ? (
                  <div className="h-8 bg-gray-200 rounded animate-pulse w-16 mt-2" />
                ) : (
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {funnel?.conversionRate || 0}%
                  </p>
                )}
                <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((funnel?.conversionRate || 0) * 10, 100)}%` }}
                  />
                </div>
              </div>
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-gray-600" />
              </div>
            </div>
          </div>

          {/* Ti le lap day */}
          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-1">
                  <p className="text-sm text-gray-500">Tỷ lệ lấp đầy</p>
                  <Tooltip text="Phần trăm phòng đã được thuê" />
                </div>
                {loading ? (
                  <div className="h-8 bg-gray-200 rounded animate-pulse w-12 mt-2" />
                ) : (
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {inventory?.occupancyChart.occupancyRate || 0}%
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {inventory?.occupancyChart.rentedCount || 0}/{inventory?.totalRooms || 0} phòng
                </p>
              </div>
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Home className="w-5 h-5 text-gray-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pheu chuyen doi */}
          <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-gray-200">
            <div className="mb-5">
              <h2 className="text-base font-semibold text-gray-900">Hiệu suất chuyển đổi</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Từ lượt xem → Đặt phòng → Chốt cọc
              </p>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Luot xem */}
                <div className="flex items-center gap-4">
                  <div className="w-24 text-sm text-gray-500">Lượt xem</div>
                  <div className="flex-1">
                    <div className="h-10 bg-gray-100 rounded-lg relative overflow-hidden">
                      <div 
                        className="h-full bg-gray-300 rounded-lg flex items-center justify-end pr-3"
                        style={{ width: '100%' }}
                      >
                        <span className="text-sm font-semibold text-gray-700">
                          {totalViews.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 pl-24">
                  <span className="text-xs text-gray-400">↓ {funnel?.viewToBookingRate || 0}% chuyển đổi</span>
                </div>

                {/* Dat phong */}
                <div className="flex items-center gap-4">
                  <div className="w-24 text-sm text-gray-500">Đặt phòng</div>
                  <div className="flex-1">
                    <div className="h-10 bg-gray-100 rounded-lg relative overflow-hidden">
                      <div 
                        className="h-full bg-blue-200 rounded-lg flex items-center justify-end pr-3"
                        style={{ width: `${totalViews > 0 ? Math.max((totalBookings / totalViews) * 100, 10) : 10}%`, minWidth: '80px' }}
                      >
                        <span className="text-sm font-semibold text-blue-700">
                          {totalBookings.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 pl-24">
                  <span className="text-xs text-gray-400">↓ {funnel?.bookingToDepositRate || 0}% chuyển đổi</span>
                </div>

                {/* Chot coc */}
                <div className="flex items-center gap-4">
                  <div className="w-24 text-sm text-gray-500">Chốt cọc</div>
                  <div className="flex-1">
                    <div className="h-10 bg-gray-100 rounded-lg relative overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-lg flex items-center justify-end pr-3"
                        style={{ width: `${totalViews > 0 ? Math.max((successfulDeposits / totalViews) * 100, 8) : 8}%`, minWidth: '70px' }}
                      >
                        <span className="text-sm font-semibold text-white">
                          {successfulDeposits.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-6">
                  <div>
                    <p className="text-xs text-gray-500">Tổng chuyển đổi</p>
                    <p className="text-lg font-bold text-gray-900">{funnel?.conversionRate || 0}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Giao dịch tháng này</p>
                    <p className="text-lg font-bold text-gray-900">{cashflow?.monthlyTransactionCount || 0}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tinh trang phong */}
          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <h2 className="text-base font-semibold text-gray-900 mb-1">Tình trạng phòng</h2>
            <p className="text-sm text-gray-500 mb-5">Đã thuê vs Còn trống</p>

            {loading ? (
              <div className="flex flex-col items-center py-6">
                <div className="w-32 h-32 bg-gray-100 rounded-full animate-pulse" />
              </div>
            ) : (
              <div className="flex flex-col items-center py-4">
                {/* Donut Chart */}
                <div className="relative w-36 h-36">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50" cy="50" r="40"
                      fill="none"
                      stroke="#f3f4f6"
                      strokeWidth="12"
                    />
                    <circle
                      cx="50" cy="50" r="40"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray={`${(inventory?.occupancyChart.occupancyRate || 0) * 2.51} 251`}
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-gray-900">
                      {inventory?.totalRooms || 0}
                    </span>
                    <span className="text-xs text-gray-500">phòng</span>
                  </div>
                </div>

                {/* Legend */}
                <div className="mt-5 space-y-2 w-full">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-gray-600">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      Đã thuê
                    </span>
                    <span className="font-semibold text-gray-900">
                      {inventory?.occupancyChart.rentedCount || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-gray-600">
                      <div className="w-3 h-3 rounded-full bg-gray-200" />
                      Còn trống
                    </span>
                    <span className="font-semibold text-gray-900">
                      {inventory?.occupancyChart.availableCount || 0}
                    </span>
                  </div>
                </div>

                {/* Lost Revenue Warning */}
                {(inventory?.totalLostRevenue || 0) > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100 w-full">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>Doanh thu thất thoát:</span>
                    </div>
                    <p className="text-lg font-bold text-red-500 mt-1">
                      -{formatFullCurrency(inventory?.totalLostRevenue || 0)}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Top Listings & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Rooms */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Phòng hiệu quả nhất</h2>
                <p className="text-sm text-gray-500 mt-0.5">Xếp hạng theo lượt xem và doanh thu</p>
              </div>
              <Link
                href="/dashboard/host/analytics"
                className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                Xem chi tiết
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {loading ? (
              <div className="p-5 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : topRoomsArray.length === 0 ? (
              <div className="p-8 text-center">
                <Home className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Chưa có tin đăng nào</p>
                <Link
                  href="/room/post"
                  className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Đăng tin đầu tiên
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {topRoomsArray.slice(0, 5).map((room, index) => {
                  const convRate = room.totalViews > 0 
                    ? ((room.totalDeposits / room.totalViews) * 100).toFixed(1) 
                    : '0';
                  return (
                    <Link
                      key={room.roomId}
                      href={`/rooms/${room.roomId}`}
                      className="flex items-center gap-4 p-4 hover:bg-gray-50 transition group"
                    >
                      {/* Rank */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-yellow-100 text-yellow-700' :
                        index === 1 ? 'bg-gray-200 text-gray-600' :
                        index === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {index + 1}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600 transition">
                          {room.roomName}
                        </p>
                        <p className="text-xs text-gray-400">{room.roomType}</p>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-center">
                          <p className="font-semibold text-gray-900">{room.totalViews.toLocaleString()}</p>
                          <p className="text-xs text-gray-400">lượt xem</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-gray-900">{room.totalDeposits}</p>
                          <p className="text-xs text-gray-400">cọc</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-blue-600">{convRate}%</p>
                          <p className="text-xs text-gray-400">chuyển đổi</p>
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Thao tác nhanh</h2>
              <div className="space-y-2">
                <Link
                  href="/room/post"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition group"
                >
                  <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Plus className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Đăng tin mới</p>
                    <p className="text-xs text-gray-500">Thêm phòng cho thuê</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>

                <Link
                  href="/dashboard/host/rooms"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition group"
                >
                  <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Home className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Quản lý phòng</p>
                    <p className="text-xs text-gray-500">Xem & chỉnh sửa tin</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>

                <Link
                  href="/dashboard/host/bookings"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition group"
                >
                  <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
                    <CalendarCheck className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Yêu cầu thuê</p>
                    <p className="text-xs text-gray-500">Xử lý booking</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>

                <Link
                  href="/dashboard/host/analytics"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition group"
                >
                  <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Thống kê chi tiết</p>
                    <p className="text-xs text-gray-500">Phân tích chuyên sâu</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>
              </div>
            </div>

            {/* Tong doanh thu */}
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <h2 className="text-sm text-gray-500 mb-1">Tổng doanh thu tích lũy</h2>
              {loading ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse w-32" />
              ) : (
                <p className="text-2xl font-bold text-gray-900">
                  {formatFullCurrency(cashflow?.totalDeposit || 0)}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                Từ {successfulDeposits} giao dịch thành công
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
