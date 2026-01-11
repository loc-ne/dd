'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  TrendingUp,
  TrendingDown,
  Eye,
  DollarSign,
  Home,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowDown,
  CreditCard,
  Building2,
  Percent,
} from 'lucide-react';

// ==========================================
// INTERFACES
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

interface RecentTransaction {
  id: number;
  roomName: string;
  renterName: string;
  amount: number;
  createdAt: string;
  paymentMethod: string;
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
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

const formatShortCurrency = (amount: number) => {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}tr`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}k`;
  }
  return amount.toString();
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// ==========================================
// COMPONENTS
// ==========================================

// Simple Bar Chart Component
const SimpleBarChart = ({ 
  rentedCount, 
  availableCount, 
  totalRooms 
}: { 
  rentedCount: number; 
  availableCount: number; 
  totalRooms: number;
}) => {
  const percentage = totalRooms > 0 ? (rentedCount / totalRooms) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">Tỉ lệ lấp đầy</span>
        <span className="font-medium text-gray-900">{percentage.toFixed(1)}%</span>
      </div>
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gray-700 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between text-sm text-gray-500">
        <span>Đã thuê: {rentedCount}</span>
        <span>Còn trống: {availableCount}</span>
      </div>
    </div>
  );
};

// Simple Funnel Component
const SimpleFunnel = ({ 
  funnel, 
  viewToBookingRate, 
  bookingToDepositRate 
}: { 
  funnel: ConversionFunnel['funnel'];
  viewToBookingRate: number;
  bookingToDepositRate: number;
}) => {
  return (
    <div className="space-y-3">
      {/* Views */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-3">
          <Eye className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">Lượt xem</span>
        </div>
        <span className="font-semibold text-gray-900">{funnel.totalViews.toLocaleString()}</span>
      </div>
      
      <div className="flex justify-center">
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <ArrowDown className="w-3 h-3" />
          <span>{viewToBookingRate}%</span>
        </div>
      </div>

      {/* Bookings */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-3">
          <Home className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">Đặt phòng</span>
        </div>
        <span className="font-semibold text-gray-900">{funnel.totalBookings.toLocaleString()}</span>
      </div>

      <div className="flex justify-center">
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <ArrowDown className="w-3 h-3" />
          <span>{bookingToDepositRate}%</span>
        </div>
      </div>

      {/* Deposits */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">Chốt cọc</span>
        </div>
        <span className="font-semibold text-gray-900">{funnel.successfulDeposits.toLocaleString()}</span>
      </div>
    </div>
  );
};

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function HostAnalyticsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [inventory, setInventory] = useState<InventoryStats | null>(null);
  const [funnel, setFunnel] = useState<ConversionFunnel | null>(null);
  const [cashflow, setCashflow] = useState<CashflowStats | null>(null);
  const [stalestRooms, setStalestRooms] = useState<VacantRoom[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [monthlyComparison, setMonthlyComparison] = useState<MonthlyComparison | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  const fetchData = async () => {
    setLoading(true);
    try {
      const [
        inventoryRes,
        funnelRes,
        cashflowRes,
        stalestRes,
        transactionsRes,
        comparisonRes,
      ] = await Promise.all([
        fetch(`${API_URL}/host-dashboard/inventory`, { credentials: 'include' }),
        fetch(`${API_URL}/host-dashboard/funnel`, { credentials: 'include' }),
        fetch(`${API_URL}/host-dashboard/cashflow`, { credentials: 'include' }),
        fetch(`${API_URL}/host-dashboard/stalest-rooms?limit=5`, { credentials: 'include' }),
        fetch(`${API_URL}/host-dashboard/recent-transactions?limit=5`, { credentials: 'include' }),
        fetch(`${API_URL}/host-dashboard/monthly-comparison`, { credentials: 'include' }),
      ]);

      const [
        inventoryData,
        funnelData,
        cashflowData,
        stalestData,
        transactionsData,
        comparisonData,
      ] = await Promise.all([
        inventoryRes.json(),
        funnelRes.json(),
        cashflowRes.json(),
        stalestRes.json(),
        transactionsRes.json(),
        comparisonRes.json(),
      ]);

      setInventory(inventoryData);
      setFunnel(funnelData);
      setCashflow(cashflowData);
      setStalestRooms(stalestData);
      setRecentTransactions(transactionsData.transactions || []);
      setMonthlyComparison(comparisonData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Dashboard Chủ trọ</h1>
              <p className="text-sm text-gray-500">
                Tháng {new Date().getMonth() + 1}/{new Date().getFullYear()}
              </p>
            </div>
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Tổng tiền cọc tháng này */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Tiền cọc tháng này</span>
              {monthlyComparison && monthlyComparison.changePercent !== 0 && (
                <span className={`flex items-center gap-1 text-xs ${
                  monthlyComparison.changePercent > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {monthlyComparison.changePercent > 0 
                    ? <TrendingUp className="w-3 h-3" /> 
                    : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(monthlyComparison.changePercent)}%
                </span>
              )}
            </div>
            {loading ? (
              <div className="h-7 bg-gray-100 rounded animate-pulse w-32" />
            ) : (
              <p className="text-xl font-semibold text-gray-900">
                {formatCurrency(cashflow?.monthlyDeposit || 0)}
              </p>
            )}
          </div>

          {/* Card 2: Tỉ lệ lấp đầy */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <span className="text-sm text-gray-500">Tỉ lệ lấp đầy</span>
            {loading ? (
              <div className="h-7 bg-gray-100 rounded animate-pulse w-20 mt-2" />
            ) : (
              <>
                <p className="text-xl font-semibold text-gray-900 mt-2">
                  {inventory?.occupancyChart.occupancyRate || 0}%
                </p>
                <p className="text-xs text-gray-400">
                  {inventory?.occupancyChart.rentedCount || 0}/{inventory?.totalRooms || 0} phòng
                </p>
              </>
            )}
          </div>

          {/* Card 3: Doanh thu thất thoát */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <span className="text-sm text-gray-500">Doanh thu thất thoát</span>
            {loading ? (
              <div className="h-7 bg-gray-100 rounded animate-pulse w-32 mt-2" />
            ) : (
              <>
                <p className="text-xl font-semibold text-gray-900 mt-2">
                  -{formatCurrency(inventory?.totalLostRevenue || 0)}
                </p>
                <p className="text-xs text-gray-400">
                  Từ {inventory?.occupancyChart.availableCount || 0} phòng trống
                </p>
              </>
            )}
          </div>

          {/* Card 4: Tổng lượt xem */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <span className="text-sm text-gray-500">Tổng lượt xem</span>
            {loading ? (
              <div className="h-7 bg-gray-100 rounded animate-pulse w-20 mt-2" />
            ) : (
              <>
                <p className="text-xl font-semibold text-gray-900 mt-2">
                  {(funnel?.funnel.totalViews || 0).toLocaleString('vi-VN')}
                </p>
                <p className="text-xs text-gray-400">
                  Tỉ lệ chốt: {funnel?.conversionRate || 0}%
                </p>
              </>
            )}
          </div>
        </div>

        {/* Middle Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Phễu chuyển đổi */}
          <div className="bg-white rounded-lg p-5 border border-gray-200">
            <h2 className="text-base font-medium text-gray-900 mb-4">Hiệu quả chốt khách</h2>
            
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : funnel ? (
              <SimpleFunnel 
                funnel={funnel.funnel}
                viewToBookingRate={funnel.viewToBookingRate}
                bookingToDepositRate={funnel.bookingToDepositRate}
              />
            ) : (
              <div className="text-center py-6 text-gray-500">Chưa có dữ liệu</div>
            )}
          </div>

          {/* Tình trạng phòng */}
          <div className="bg-white rounded-lg p-5 border border-gray-200">
            <h2 className="text-base font-medium text-gray-900 mb-4">Tình trạng Phòng</h2>
            
            {loading ? (
              <div className="h-24 bg-gray-100 rounded animate-pulse" />
            ) : inventory ? (
              <SimpleBarChart 
                rentedCount={inventory.occupancyChart.rentedCount}
                availableCount={inventory.occupancyChart.availableCount}
                totalRooms={inventory.totalRooms}
              />
            ) : (
              <div className="text-center py-6 text-gray-500">Chưa có dữ liệu</div>
            )}
          </div>
        </div>

        {/* Lists Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Phòng trống lâu nhất */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-4 border-b border-gray-100">
              <h2 className="text-base font-medium text-gray-900">Phòng trống lâu nhất</h2>
            </div>

            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : stalestRooms.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                Không có phòng nào đang trống
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {stalestRooms.map((room, index) => (
                  <div key={room.roomId} className="p-4 flex items-center gap-3">
                    <span className="text-sm text-gray-400 w-5">{index + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <a 
                        href={`/rooms/${room.roomId}`}
                        className="text-sm font-medium text-gray-900 hover:underline truncate block"
                      >
                        {room.roomName}
                      </a>
                      <p className="text-xs text-gray-400">
                        {formatCurrency(room.pricePerMonth)}/tháng
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{room.vacantDays} ngày</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Giao dịch gần đây */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-4 border-b border-gray-100">
              <h2 className="text-base font-medium text-gray-900">Giao dịch gần đây</h2>
            </div>

            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : recentTransactions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                Chưa có giao dịch nào
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {recentTransactions.map((tx) => (
                  <div key={tx.id} className="p-4 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{tx.roomName}</p>
                      <p className="text-xs text-gray-400">
                        {tx.renterName} • {formatDate(tx.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">+{formatCurrency(tx.amount)}</p>
                      <p className="text-xs text-gray-400">{tx.paymentMethod}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top Rooms Table */}
        {cashflow && cashflow.topRooms.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-4 border-b border-gray-100">
              <h2 className="text-base font-medium text-gray-900">Top Phòng</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-4 py-3 text-left font-medium text-gray-500">#</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Phòng</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Loại</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">Views</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">Đặt</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">Cọc</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">Doanh thu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {cashflow.topRooms.map((room, index) => (
                    <tr key={room.roomId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-500">{index + 1}</td>
                      <td className="px-4 py-3">
                        <a 
                          href={`/rooms/${room.roomId}`}
                          className="font-medium text-gray-900 hover:underline"
                        >
                          {room.roomName}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{room.roomType}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{room.totalViews.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{room.totalBookings}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{room.totalDeposits}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        {formatCurrency(room.totalRevenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
