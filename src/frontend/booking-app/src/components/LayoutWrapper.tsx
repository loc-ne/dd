'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { AiChatWidget } from '@/components/AiChat';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Ẩn Navbar và Footer cho các trang admin
  const isAdminRoute = pathname?.startsWith('/admin');
  // Host dashboard: hiện navbar, ẩn footer
  const isHostDashboard = pathname?.startsWith('/dashboard/host');
  // Trang chi tiết phòng: đã có AiChatWidget riêng với context phòng
  const isRoomDetailPage = pathname?.match(/^\/rooms\/\d+$/);

  if (isAdminRoute) {
    // Admin pages: chỉ render children (admin layout sẽ xử lý sidebar)
    return (
      <>
        {children}
        <AiChatWidget />
      </>
    );
  }

  if (isHostDashboard) {
    // Host dashboard: chỉ navbar, không footer
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <AiChatWidget />
      </div>
    );
  }

  // Normal pages: render với Navbar và Footer
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      {/* Không hiển thị global widget ở trang chi tiết phòng vì đã có widget riêng */}
      {!isRoomDetailPage && <AiChatWidget />}
    </div>
  );
}
