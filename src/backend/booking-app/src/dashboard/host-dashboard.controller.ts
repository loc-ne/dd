import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { HostDashboardService } from './host-dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import {
  InventoryStatsDto,
  ConversionFunnelDto,
  CashflowStatsDto,
  VacantRoomDto,
  RecentTransactionsResponseDto,
} from './dto';

@Controller('host-dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('host', 'admin')
export class HostDashboardController {
  constructor(private readonly hostDashboardService: HostDashboardService) {}

  // ==========================================
  // NHÓM 1: QUẢN LÝ "HÀNG TỒN" (Inventory Management)
  // ==========================================

  /**
   * GET /host-dashboard/inventory
   * Lấy thống kê "Hàng tồn":
   * - Biểu đồ Donut: Phòng đã thuê (RENTED) vs Còn trống (AVAILABLE)
   * - Tỉ lệ lấp đầy (Occupancy Rate)
   * - Tiền "xót" (Lost Revenue) từ phòng trống
   */
  @Get('inventory')
  async getInventoryStats(@Request() req): Promise<InventoryStatsDto> {
    const hostId = req.user.id;
    return this.hostDashboardService.getInventoryStats(hostId);
  }

  // ==========================================
  // NHÓM 2: HIỆU SUẤT "CHỐT CỌC" (Conversion Funnel)
  // ==========================================

  /**
   * GET /host-dashboard/funnel
   * Lấy dữ liệu Conversion Funnel:
   * - Biểu đồ Phễu 3 tầng: Lượt xem → Lượt đặt → Lượt chốt cọc
   * - Tỉ lệ chuyển đổi từng bước
   */
  @Get('funnel')
  async getConversionFunnel(@Request() req): Promise<ConversionFunnelDto> {
    const hostId = req.user.id;
    return this.hostDashboardService.getConversionFunnel(hostId);
  }

  // ==========================================
  // NHÓM 3: TÀI CHÍNH "TIỀN TƯƠI" (Actual Cashflow)
  // ==========================================

  /**
   * GET /host-dashboard/cashflow?month=1&year=2026&limit=5
   * Lấy thống kê Cashflow:
   * - Tổng tiền cọc tháng này
   * - Tổng tiền cọc tất cả thời gian
   * - Top phòng hút khách (theo lượt xem)
   */
  @Get('cashflow')
  async getCashflowStats(
    @Request() req,
    @Query('month') month?: number,
    @Query('year') year?: number,
    @Query('limit') limit?: number,
  ): Promise<CashflowStatsDto> {
    const hostId = req.user.id;
    return this.hostDashboardService.getCashflowStats(
      hostId,
      month ? Number(month) : undefined,
      year ? Number(year) : undefined,
      limit ? Number(limit) : 5,
    );
  }

  // ==========================================
  // TẦNG 3: DANH SÁCH HÀNH ĐỘNG (Actionable List)
  // ==========================================

  /**
   * GET /host-dashboard/stalest-rooms?limit=5
   * Lấy Top 5 phòng "Ế" nhất (AVAILABLE lâu nhất)
   */
  @Get('stalest-rooms')
  async getStalestRooms(
    @Request() req,
    @Query('limit') limit?: number,
  ): Promise<VacantRoomDto[]> {
    const hostId = req.user.id;
    return this.hostDashboardService.getStalestRooms(hostId, limit ? Number(limit) : 5);
  }

  /**
   * GET /host-dashboard/recent-transactions?limit=5
   * Lấy giao dịch thành công gần đây
   */
  @Get('recent-transactions')
  async getRecentTransactions(
    @Request() req,
    @Query('limit') limit?: number,
  ): Promise<RecentTransactionsResponseDto> {
    const hostId = req.user.id;
    return this.hostDashboardService.getRecentTransactions(hostId, limit ? Number(limit) : 5);
  }

  /**
   * GET /host-dashboard/monthly-comparison
   * Lấy so sánh tháng này với tháng trước
   */
  @Get('monthly-comparison')
  async getMonthlyComparison(@Request() req) {
    const hostId = req.user.id;
    return this.hostDashboardService.getMonthlyComparison(hostId);
  }

  // ==========================================
  // TỔNG QUAN DASHBOARD
  // ==========================================

  /**
   * GET /host-dashboard/overview
   * Lấy tổng quan tất cả các nhóm chỉ số
   */
  @Get('overview')
  async getDashboardOverview(@Request() req) {
    const hostId = req.user.id;
    return this.hostDashboardService.getDashboardOverview(hostId);
  }
}
