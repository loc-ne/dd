'use client';

import React from 'react';
import { 
  ShieldCheck, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  DollarSign,
  UserX,
  Home
} from 'lucide-react';

export default function PolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 font-sans text-gray-800">
      
      {/* --- HEADER --- */}
      <div className="max-w-4xl mx-auto px-6 mb-12 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Quy trình Thuê & Chính sách Hoàn tiền
        </h1>
        <p className="text-gray-600 text-lg">
          Minh bạch, rõ ràng và bảo vệ quyền lợi cho cả Khách thuê và Chủ nhà.
        </p>
        <p className="text-sm text-gray-400 mt-2">Cập nhật lần cuối: 06/11/2025</p>
      </div>

      <div className="max-w-4xl mx-auto px-6 space-y-12">

        {/* --- PHẦN 1: QUY TRÌNH THUÊ PHÒNG --- */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-gray-100 rounded-lg text-gray-700">
              <FileText size={24} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">1. Quy trình thuê phòng</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {/* Step 1 */}
            <div className="relative z-10 flex flex-col items-center text-center group">
              <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-900 flex items-center justify-center font-bold text-lg mb-3">1</div>
              <h3 className="font-bold text-gray-900 mb-1">Gửi yêu cầu</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Khách chọn phòng và gửi yêu cầu thuê
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative z-10 flex flex-col items-center text-center group">
              <div className="hidden md:block absolute top-5 -left-1/2 w-full h-0.5 bg-gray-200 -z-10"></div>
              <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-900 flex items-center justify-center font-bold text-lg mb-3">2</div>
              <h3 className="font-bold text-gray-900 mb-1">Chủ nhà duyệt</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Chủ nhà xem xét hồ sơ. Nếu đồng ý, đơn chuyển sang chờ đặt cọc.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative z-10 flex flex-col items-center text-center group">
              <div className="hidden md:block absolute top-5 -left-1/2 w-full h-0.5 bg-gray-200 -z-10"></div>
              <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-900 flex items-center justify-center font-bold text-lg mb-3">3</div>
              <h3 className="font-bold text-gray-900 mb-1">Đặt cọc giữ chỗ</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Khách thanh toán tiền cọc để giữ phòng.
              </p>
            </div>

            {/* Step 4 */}
            <div className="relative z-10 flex flex-col items-center text-center group">
              <div className="hidden md:block absolute top-5 -left-1/2 w-full h-0.5 bg-gray-200 -z-10"></div>
              <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-900 flex items-center justify-center font-bold text-lg mb-3">4</div>
              <h3 className="font-bold text-gray-900 mb-1">Nhận phòng</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Gặp chủ nhà, ký hợp đồng giấy và nhận phòng. Hoàn tất quy trình.
              </p>
            </div>
          </div>
        </section>

        {/* --- PHẦN 2: CHÍNH SÁCH HỦY & HOÀN TIỀN --- */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gray-100 rounded-lg text-gray-700">
              <DollarSign size={24} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">2. Chính sách Hủy phòng & Hoàn cọc</h2>
          </div>

          <div className="space-y-4">

            {/* Case A */}
            <div className="flex gap-4 p-4 rounded-lg bg-gray-50 border border-gray-100">
              <div className="mt-1 text-gray-500"><Clock /></div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Khách hủy yêu cầu trước khi đặt cọc</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Khách có thể hủy bất cứ lúc nào trước khi thanh toán. Không mất phí.
                </p>
              </div>
            </div>

            {/* Case B */}
            <div className="flex gap-4 p-4 rounded-lg bg-gray-50 border border-gray-100">
              <div className="mt-1 text-gray-500"><Home /></div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Chủ nhà hủy phòng sau khi khách đã cọc</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Khách được hoàn tiền 100%. Chủ nhà sẽ bị ghi nhận lịch sử xấu.
                </p>
              </div>
            </div>

            {/* Case C */}
            <div className="flex gap-4 p-4 rounded-lg bg-gray-50 border border-gray-100">
              <div className="mt-1 text-gray-500"><ShieldCheck /></div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Khách hủy đúng quy định</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Khách hủy trong thời hạn cho phép, được hoàn lại tiền cọc (có thể trừ phí nhỏ).
                </p>
              </div>
            </div>

            {/* Case D */}
            <div className="flex gap-4 p-4 rounded-lg bg-gray-50 border border-gray-100">
              <div className="mt-1 text-gray-500"><UserX /></div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Khách hủy quá hạn hoặc bỏ cọc</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Không hoàn tiền. Số tiền được chuyển cho Chủ nhà bù thiệt hại.
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* --- PHẦN 3: CAM KẾT --- */}
        <section className="bg-white text-gray-900 rounded-2xl p-8 text-center border border-gray-200 shadow">
          <ShieldCheck size={40} className="mx-auto mb-4 text-gray-600" />
          <h2 className="text-2xl font-bold mb-3">Cam kết Bảo vệ khoản Cọc</h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-6">
            Tiền cọc được giữ an toàn tại hệ thống trung gian. Chỉ chuyển cho Chủ nhà khi khách đã nhận phòng.
          </p>
          <button className="bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 px-6 rounded-full transition-all">
            Liên hệ Hỗ trợ
          </button>
        </section>

      </div>
    </div>
  );
}
