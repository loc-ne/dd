'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Home,
  CalendarCheck,
  BarChart3,
  Plus,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';

const navItems = [
  {
    label: 'Tổng quan',
    href: '/dashboard/host',
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: 'Quản lý phòng',
    href: '/dashboard/host/rooms',
    icon: Home,
  },
  {
    label: 'Yêu cầu thuê',
    href: '/dashboard/host/bookings',
    icon: CalendarCheck,
  },
  {
    label: 'Thống kê',
    href: '/dashboard/host/analytics',
    icon: BarChart3,
  },
];

export default function HostDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Kiểm tra quyền - chỉ redirect về login nếu chưa đăng nhập
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
          <span>Đang tải...</span>
        </div>
      </div>
    );
  }

  // Nếu user chưa là host, hiển thị gợi ý đăng tin
  if (user && !user.isHost) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          {/* Icon */}
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Home className="w-10 h-10 text-blue-600" />
          </div>
          
          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Bạn chưa phải là Chủ nhà
          </h1>
          
          {/* Description */}
          <p className="text-gray-600 mb-6 leading-relaxed">
            Để truy cập trang quản lý cho thuê, bạn cần đăng ít nhất một tin cho thuê phòng. 
            Hãy bắt đầu kiếm thu nhập từ căn phòng của bạn ngay hôm nay!
          </p>
          
          {/* Benefits */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
            <p className="text-sm font-medium text-gray-900 mb-3">Lợi ích khi trở thành Chủ nhà:</p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Tiếp cận hàng nghìn người thuê tiềm năng</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Quản lý đặt phòng dễ dàng</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Thống kê chi tiết về doanh thu</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Hỗ trợ thanh toán an toàn</span>
              </li>
            </ul>
          </div>
          
          {/* CTA Button */}
          <Link
            href="/room/post"
            className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition shadow-lg shadow-blue-600/25"
          >
            <Plus className="w-5 h-5" />
            Đăng tin cho thuê ngay
          </Link>
          
          {/* Secondary link */}
          <Link
            href="/"
            className="inline-block mt-4 text-sm text-gray-500 hover:text-gray-700 transition"
          >
            Quay về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  if (!user?.isHost) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header - hidden because we have navbar */}
      <div className="lg:hidden fixed top-16 left-0 right-0 h-14 bg-white border-b border-gray-200 z-30 flex items-center px-4">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>
        <span className="font-semibold text-gray-900 ml-3">Quản lý cho thuê</span>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-200 z-40 transform transition-transform duration-300
          lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Mobile Close Button */}
        <div className="lg:hidden flex justify-between items-center p-4 border-b border-gray-100">
          <span className="font-semibold text-gray-900">Menu</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Quick Action */}
        <div className="p-4 border-b border-gray-100">
          <Link
            href="/room/post"
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
          >
            <Plus className="w-4 h-4" />
            <span>Đăng tin mới</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.href, item.exact);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
                  ${active
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
                <span>{item.label}</span>
                {active && <ChevronRight className="w-4 h-4 ml-auto text-blue-400" />}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
