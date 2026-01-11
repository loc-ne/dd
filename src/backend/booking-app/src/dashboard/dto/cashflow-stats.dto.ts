/**
 * DTO cho Nhóm 3: Tài chính "Tiền tươi" (Actual Cashflow)
 * Thống kê số tiền đã chốt được từ cọc
 */

// Thông tin phòng hút khách
export class TopRoomDto {
  roomId: number;
  roomName: string;
  roomType: string; // ROOM, STUDIO, DORM, HOUSE
  totalViews: number;
  totalBookings: number;
  totalDeposits: number; // Số lượt cọc thành công
  totalRevenue: number; // Tổng tiền cọc thu được
}

// DTO tổng hợp cho Cashflow
export class CashflowStatsDto {
  // Tổng tiền cọc tháng này (VND)
  monthlyDeposit: number;
  
  // Tổng tiền cọc tất cả thời gian (VND)
  totalDeposit: number;
  
  // Số giao dịch thành công trong tháng
  monthlyTransactionCount: number;
  
  // Danh sách Top phòng hút khách
  topRooms: TopRoomDto[];
  
  // Tháng/năm đang thống kê
  month: number;
  year: number;
}
