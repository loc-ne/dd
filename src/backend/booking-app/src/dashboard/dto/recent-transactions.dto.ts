/**
 * DTO cho Giao dịch gần đây
 * Hiển thị "tiền tươi" đang về
 */

export class RecentTransactionDto {
  id: number;
  roomName: string;
  renterName: string;
  amount: number;
  createdAt: Date;
  paymentMethod: string;
}

export class RecentTransactionsResponseDto {
  transactions: RecentTransactionDto[];
  totalCount: number;
}
