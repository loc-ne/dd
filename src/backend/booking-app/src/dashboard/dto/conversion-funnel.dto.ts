/**
 * DTO cho Nhóm 2: Hiệu suất "Chốt cọc" (Conversion Funnel)
 * Biểu đồ Phễu 3 tầng: Lượt xem → Lượt đặt → Lượt chốt cọc
 */

// Dữ liệu cho Funnel Chart (Biểu đồ phễu)
export class FunnelDataDto {
  // Tầng 1: Tổng lượt xem phòng - SUM(Room.totalViews)
  totalViews: number;
  
  // Tầng 2: Tổng lượt đặt phòng - COUNT(Booking)
  totalBookings: number;
  
  // Tầng 3: Tổng lượt chốt cọc thành công - COUNT(Transaction) với status = SUCCESS
  successfulDeposits: number;
}

// DTO tổng hợp cho Conversion Funnel
export class ConversionFunnelDto {
  // Dữ liệu biểu đồ phễu
  funnel: FunnelDataDto;
  
  // Tỉ lệ chốt cọc (%) = (Lượt chốt cọc / Lượt xem) * 100
  conversionRate: number;
  
  // Tỉ lệ chuyển đổi từ xem → đặt phòng (%)
  viewToBookingRate: number;
  
  // Tỉ lệ chuyển đổi từ đặt phòng → chốt cọc (%)
  bookingToDepositRate: number;
}
