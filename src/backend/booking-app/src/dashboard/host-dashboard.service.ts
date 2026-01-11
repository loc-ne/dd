import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../payment/entities/transaction.entity';
import { Booking } from '../booking/entities/booking.entity';
import { Room, RoomStatus } from '../room/entities/room.entity';
import { TransactionStatus, TransactionType } from '../payment/payment.constant';
import {
  InventoryStatsDto,
  VacantRoomDto,
  ConversionFunnelDto,
  CashflowStatsDto,
  TopRoomDto,
  RecentTransactionDto,
  RecentTransactionsResponseDto,
} from './dto';

@Injectable()
export class HostDashboardService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
  ) {}

  // ==========================================
  // NHÓM 1: QUẢN LÝ "HÀNG TỒN" (Inventory Management)
  // ==========================================

  /**
   * Lấy thống kê "Hàng tồn" - Inventory Stats
   * - Tỉ lệ lấp đầy (Occupancy Rate)
   * - Biểu đồ Donut: RENTED vs AVAILABLE
   * - Lost Revenue: Tiền "xót" từ phòng trống
   */
  async getInventoryStats(hostId: number): Promise<InventoryStatsDto> {
    // Lấy tất cả phòng của host
    const allRooms = await this.roomRepository.find({
      where: { hostId },
      select: ['id', 'title', 'pricePerMonth', 'status', 'updatedAt'],
    });

    const totalRooms = allRooms.length;

    if (totalRooms === 0) {
      return {
        occupancyChart: {
          rentedCount: 0,
          availableCount: 0,
          occupancyRate: 0,
        },
        totalLostRevenue: 0,
        vacantRooms: [],
        totalRooms: 0,
      };
    }

    // Đếm phòng theo trạng thái
    const rentedRooms = allRooms.filter(r => r.status === RoomStatus.RENTED);
    const availableRooms = allRooms.filter(r => r.status === RoomStatus.AVAILABLE);

    const rentedCount = rentedRooms.length;
    const availableCount = availableRooms.length;

    // Tính tỉ lệ lấp đầy
    const occupancyRate = totalRooms > 0 
      ? Number(((rentedCount / totalRooms) * 100).toFixed(2))
      : 0;

    // Tính Lost Revenue cho từng phòng AVAILABLE
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const daysSinceMonthStart = Math.floor(
      (now.getTime() - startOfMonth.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1; // +1 vì tính cả ngày hiện tại

    const vacantRooms: VacantRoomDto[] = availableRooms.map(room => {
      // Số ngày trống = số ngày từ đầu tháng (đơn giản hóa)
      // Trong thực tế có thể cần check updatedAt để biết từ khi nào trống
      const vacantDays = daysSinceMonthStart;
      const pricePerMonth = Number(room.pricePerMonth);
      const lostRevenue = Math.round(pricePerMonth * (vacantDays / 30));

      return {
        roomId: room.id,
        roomName: room.title,
        pricePerMonth,
        vacantDays,
        lostRevenue,
        updatedAt: room.updatedAt,
      };
    });

    const totalLostRevenue = vacantRooms.reduce((sum, r) => sum + r.lostRevenue, 0);

    return {
      occupancyChart: {
        rentedCount,
        availableCount,
        occupancyRate,
      },
      totalLostRevenue,
      vacantRooms,
      totalRooms,
    };
  }

  // ==========================================
  // NHÓM 2: HIỆU SUẤT "CHỐT CỌC" (Conversion Funnel)
  // ==========================================

  /**
   * Lấy dữ liệu Conversion Funnel
   * Biểu đồ Phễu 3 tầng:
   * - Tầng 1: Lượt xem (SUM Room.totalViews)
   * - Tầng 2: Lượt đặt phòng (COUNT Booking)
   * - Tầng 3: Lượt chốt cọc thành công (COUNT Transaction SUCCESS)
   */
  async getConversionFunnel(hostId: number): Promise<ConversionFunnelDto> {
    // Lấy danh sách roomIds của host
    const hostRooms = await this.roomRepository.find({
      where: { hostId },
      select: ['id'],
    });
    const roomIds = hostRooms.map(room => room.id);

    if (roomIds.length === 0) {
      return {
        funnel: {
          totalViews: 0,
          totalBookings: 0,
          successfulDeposits: 0,
        },
        conversionRate: 0,
        viewToBookingRate: 0,
        bookingToDepositRate: 0,
      };
    }

    // Tầng 1: Tổng lượt xem - SUM(Room.totalViews)
    const viewsResult = await this.roomRepository
      .createQueryBuilder('room')
      .where('room.host_id = :hostId', { hostId })
      .select('SUM(room.total_views)', 'total')
      .getRawOne();
    const totalViews = Number(viewsResult?.total || 0);

    // Tầng 2: Tổng lượt đặt phòng - COUNT(Booking)
    const totalBookings = await this.bookingRepository
      .createQueryBuilder('booking')
      .where('booking.room_id IN (:...roomIds)', { roomIds })
      .getCount();

    // Tầng 3: Tổng lượt chốt cọc thành công - COUNT(Transaction) với status = SUCCESS
    const successfulDeposits = await this.transactionRepository
      .createQueryBuilder('transaction')
      .innerJoin('transaction.booking', 'booking')
      .where('booking.room_id IN (:...roomIds)', { roomIds })
      .andWhere('transaction.status = :status', { status: TransactionStatus.SUCCESS })
      .andWhere('transaction.type = :type', { type: TransactionType.DEPOSIT })
      .getCount();

    // Tính các tỉ lệ chuyển đổi
    const conversionRate = totalViews > 0
      ? Number(((successfulDeposits / totalViews) * 100).toFixed(2))
      : 0;

    const viewToBookingRate = totalViews > 0
      ? Number(((totalBookings / totalViews) * 100).toFixed(2))
      : 0;

    const bookingToDepositRate = totalBookings > 0
      ? Number(((successfulDeposits / totalBookings) * 100).toFixed(2))
      : 0;

    return {
      funnel: {
        totalViews,
        totalBookings,
        successfulDeposits,
      },
      conversionRate,
      viewToBookingRate,
      bookingToDepositRate,
    };
  }

  // ==========================================
  // NHÓM 3: TÀI CHÍNH "TIỀN TƯƠI" (Actual Cashflow)
  // ==========================================

  /**
   * Lấy thống kê Cashflow - Tiền cọc thực tế
   * - Tổng tiền cọc tháng này
   * - Top phòng hút khách
   */
  async getCashflowStats(
    hostId: number,
    month?: number,
    year?: number,
    topLimit: number = 5,
  ): Promise<CashflowStatsDto> {
    const now = new Date();
    const targetMonth = month || now.getMonth() + 1; // 1-12
    const targetYear = year || now.getFullYear();

    // Lấy danh sách roomIds của host
    const hostRooms = await this.roomRepository.find({
      where: { hostId },
      select: ['id'],
    });
    const roomIds = hostRooms.map(room => room.id);

    if (roomIds.length === 0) {
      return {
        monthlyDeposit: 0,
        totalDeposit: 0,
        monthlyTransactionCount: 0,
        topRooms: [],
        month: targetMonth,
        year: targetYear,
      };
    }

    // Tổng tiền cọc THÁNG NÀY
    const monthlyResult = await this.transactionRepository
      .createQueryBuilder('transaction')
      .innerJoin('transaction.booking', 'booking')
      .where('booking.room_id IN (:...roomIds)', { roomIds })
      .andWhere('transaction.status = :status', { status: TransactionStatus.SUCCESS })
      .andWhere('transaction.type = :type', { type: TransactionType.DEPOSIT })
      .andWhere('EXTRACT(MONTH FROM transaction.created_at) = :month', { month: targetMonth })
      .andWhere('EXTRACT(YEAR FROM transaction.created_at) = :year', { year: targetYear })
      .select('SUM(transaction.amount)', 'total')
      .addSelect('COUNT(transaction.id)', 'count')
      .getRawOne();

    const monthlyDeposit = Number(monthlyResult?.total || 0);
    const monthlyTransactionCount = Number(monthlyResult?.count || 0);

    // Tổng tiền cọc TẤT CẢ THỜI GIAN
    const totalResult = await this.transactionRepository
      .createQueryBuilder('transaction')
      .innerJoin('transaction.booking', 'booking')
      .where('booking.room_id IN (:...roomIds)', { roomIds })
      .andWhere('transaction.status = :status', { status: TransactionStatus.SUCCESS })
      .andWhere('transaction.type = :type', { type: TransactionType.DEPOSIT })
      .select('SUM(transaction.amount)', 'total')
      .getRawOne();

    const totalDeposit = Number(totalResult?.total || 0);

    // TOP PHÒNG HÚT KHÁCH (theo lượt xem + có thêm thông tin revenue)
    const topRoomsData = await this.roomRepository
      .createQueryBuilder('room')
      .leftJoin('bookings', 'booking', 'booking.room_id = room.room_id')
      .leftJoin(
        'transactions',
        'transaction',
        'transaction.booking_id = booking.id AND transaction.status = :txStatus AND transaction.type = :txType',
        { txStatus: TransactionStatus.SUCCESS, txType: TransactionType.DEPOSIT }
      )
      .where('room.host_id = :hostId', { hostId })
      .select('room.room_id', 'roomId')
      .addSelect('room.title', 'roomName')
      .addSelect('room.room_type', 'roomType')
      .addSelect('room.total_views', 'totalViews')
      .addSelect('COUNT(DISTINCT booking.id)', 'totalBookings')
      .addSelect('COUNT(DISTINCT transaction.id)', 'totalDeposits')
      .addSelect('COALESCE(SUM(transaction.amount), 0)', 'totalRevenue')
      .groupBy('room.room_id')
      .addGroupBy('room.title')
      .addGroupBy('room.room_type')
      .addGroupBy('room.total_views')
      .orderBy('room.total_views', 'DESC')
      .limit(topLimit)
      .getRawMany();

    const topRooms: TopRoomDto[] = topRoomsData.map(row => ({
      roomId: row.roomId,
      roomName: row.roomName,
      roomType: row.roomType,
      totalViews: parseInt(row.totalViews) || 0,
      totalBookings: parseInt(row.totalBookings) || 0,
      totalDeposits: parseInt(row.totalDeposits) || 0,
      totalRevenue: Number(row.totalRevenue) || 0,
    }));

    return {
      monthlyDeposit,
      totalDeposit,
      monthlyTransactionCount,
      topRooms,
      month: targetMonth,
      year: targetYear,
    };
  }

  // ==========================================
  // PHƯƠNG THỨC TỔNG HỢP (Legacy support)
  // ==========================================

  /**
   * Lấy tổng quan Dashboard (gọi tất cả các nhóm)
   */
  async getDashboardOverview(hostId: number) {
    const [inventory, funnel, cashflow] = await Promise.all([
      this.getInventoryStats(hostId),
      this.getConversionFunnel(hostId),
      this.getCashflowStats(hostId),
    ]);

    return {
      inventory,
      funnel,
      cashflow,
    };
  }

  // ==========================================
  // TẦNG 3: DANH SÁCH HÀNH ĐỘNG (Actionable List)
  // ==========================================

  /**
   * Lấy Top 5 phòng "Ế" nhất
   * Phòng AVAILABLE với updatedAt lâu nhất (trống lâu nhất)
   */
  async getStalestRooms(hostId: number, limit: number = 5): Promise<VacantRoomDto[]> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const daysSinceMonthStart = Math.floor(
      (now.getTime() - startOfMonth.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;

    const stalestRooms = await this.roomRepository.find({
      where: { 
        hostId, 
        status: RoomStatus.AVAILABLE,
      },
      select: ['id', 'title', 'pricePerMonth', 'updatedAt'],
      order: { updatedAt: 'ASC' }, // Cũ nhất lên đầu
      take: limit,
    });

    return stalestRooms.map(room => {
      // Tính số ngày từ lần cập nhật cuối
      const daysSinceUpdate = Math.floor(
        (now.getTime() - new Date(room.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      const pricePerMonth = Number(room.pricePerMonth);
      const lostRevenue = Math.round(pricePerMonth * (daysSinceMonthStart / 30));

      return {
        roomId: room.id,
        roomName: room.title,
        pricePerMonth,
        vacantDays: daysSinceUpdate,
        lostRevenue,
        updatedAt: room.updatedAt,
      };
    });
  }

  /**
   * Lấy giao dịch thành công gần đây
   * Để chủ nhà thấy "tiền tươi" đang về
   */
  async getRecentTransactions(
    hostId: number, 
    limit: number = 5
  ): Promise<RecentTransactionsResponseDto> {
    // Lấy danh sách roomIds của host
    const hostRooms = await this.roomRepository.find({
      where: { hostId },
      select: ['id'],
    });
    const roomIds = hostRooms.map(room => room.id);

    if (roomIds.length === 0) {
      return {
        transactions: [],
        totalCount: 0,
      };
    }

    // Lấy giao dịch thành công gần đây
    const recentTransactions = await this.transactionRepository
      .createQueryBuilder('transaction')
      .innerJoin('transaction.booking', 'booking')
      .innerJoin('booking.room', 'room')
      .innerJoin('booking.renter', 'renter')
      .where('booking.room_id IN (:...roomIds)', { roomIds })
      .andWhere('transaction.status = :status', { status: TransactionStatus.SUCCESS })
      .andWhere('transaction.type = :type', { type: TransactionType.DEPOSIT })
      .select([
        'transaction.id AS id',
        'room.title AS "roomName"',
        'renter.name AS "renterName"',
        'transaction.amount AS amount',
        'transaction.created_at AS "createdAt"',
        'transaction.payment_method AS "paymentMethod"',
      ])
      .orderBy('transaction.created_at', 'DESC')
      .limit(limit)
      .getRawMany();

    // Đếm tổng giao dịch
    const totalCount = await this.transactionRepository
      .createQueryBuilder('transaction')
      .innerJoin('transaction.booking', 'booking')
      .where('booking.room_id IN (:...roomIds)', { roomIds })
      .andWhere('transaction.status = :status', { status: TransactionStatus.SUCCESS })
      .andWhere('transaction.type = :type', { type: TransactionType.DEPOSIT })
      .getCount();

    const transactions: RecentTransactionDto[] = recentTransactions.map(tx => ({
      id: tx.id,
      roomName: tx.roomName,
      renterName: tx.renterName || 'Khách hàng',
      amount: Number(tx.amount),
      createdAt: tx.createdAt,
      paymentMethod: tx.paymentMethod,
    }));

    return {
      transactions,
      totalCount,
    };
  }

  /**
   * Lấy thống kê so sánh với tháng trước
   * Để hiển thị % tăng/giảm
   */
  async getMonthlyComparison(hostId: number) {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    // Tháng trước
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    // Lấy roomIds
    const hostRooms = await this.roomRepository.find({
      where: { hostId },
      select: ['id'],
    });
    const roomIds = hostRooms.map(room => room.id);

    if (roomIds.length === 0) {
      return {
        currentMonthDeposit: 0,
        previousMonthDeposit: 0,
        changePercent: 0,
      };
    }

    // Tổng cọc tháng này
    const currentResult = await this.transactionRepository
      .createQueryBuilder('transaction')
      .innerJoin('transaction.booking', 'booking')
      .where('booking.room_id IN (:...roomIds)', { roomIds })
      .andWhere('transaction.status = :status', { status: TransactionStatus.SUCCESS })
      .andWhere('transaction.type = :type', { type: TransactionType.DEPOSIT })
      .andWhere('EXTRACT(MONTH FROM transaction.created_at) = :month', { month: currentMonth })
      .andWhere('EXTRACT(YEAR FROM transaction.created_at) = :year', { year: currentYear })
      .select('SUM(transaction.amount)', 'total')
      .getRawOne();

    // Tổng cọc tháng trước
    const prevResult = await this.transactionRepository
      .createQueryBuilder('transaction')
      .innerJoin('transaction.booking', 'booking')
      .where('booking.room_id IN (:...roomIds)', { roomIds })
      .andWhere('transaction.status = :status', { status: TransactionStatus.SUCCESS })
      .andWhere('transaction.type = :type', { type: TransactionType.DEPOSIT })
      .andWhere('EXTRACT(MONTH FROM transaction.created_at) = :month', { month: prevMonth })
      .andWhere('EXTRACT(YEAR FROM transaction.created_at) = :year', { year: prevYear })
      .select('SUM(transaction.amount)', 'total')
      .getRawOne();

    const currentMonthDeposit = Number(currentResult?.total || 0);
    const previousMonthDeposit = Number(prevResult?.total || 0);
    
    const changePercent = previousMonthDeposit > 0 
      ? Number((((currentMonthDeposit - previousMonthDeposit) / previousMonthDeposit) * 100).toFixed(1))
      : (currentMonthDeposit > 0 ? 100 : 0);

    return {
      currentMonthDeposit,
      previousMonthDeposit,
      changePercent,
    };
  }
}
