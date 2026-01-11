/**
 * DTO cho Nhóm 1: Quản lý "Hàng tồn" (Inventory Management)
 * Giúp chủ trọ biết: Phòng nào có tiền - Phòng nào đang trống
 */

// Dữ liệu cho Donut Chart (Biểu đồ tròn)
export class OccupancyChartDto {
  // Số phòng đã thuê (RENTED)
  rentedCount: number;
  
  // Số phòng còn trống (AVAILABLE)
  availableCount: number;
  
  // Tỉ lệ lấp đầy (%)
  occupancyRate: number;
}

// Thông tin chi tiết phòng trống để tính Lost Revenue
export class VacantRoomDto {
  roomId: number;
  roomName: string;
  pricePerMonth: number;
  vacantDays: number; // Số ngày trống từ đầu tháng
  lostRevenue: number; // Tiền mất đi = pricePerMonth * (vacantDays / 30)
  updatedAt: Date; // Thời điểm cập nhật cuối
}

// DTO tổng hợp cho Inventory Management
export class InventoryStatsDto {
  // Dữ liệu biểu đồ Donut
  occupancyChart: OccupancyChartDto;
  
  // Tổng tiền "xót" - Lost Revenue
  totalLostRevenue: number;
  
  // Danh sách phòng trống với chi tiết tiền mất
  vacantRooms: VacantRoomDto[];
  
  // Tổng số phòng
  totalRooms: number;
}
