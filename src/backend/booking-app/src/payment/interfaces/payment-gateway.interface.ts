export interface CreatePaymentUrlDto {
  amount: number;
  orderId: string;
  orderInfo: string;
  bankCode?: string;
  language?: string;
  ipAddr: string;
}

export interface IPaymentGateway {
  /**
   * Tạo URL để redirect người dùng sang trang thanh toán
   */
  createPaymentUrl(dto: CreatePaymentUrlDto): Promise<string>;

  /**
   * Kiểm tra chữ ký bảo mật từ Webhook (IPN) của gateway
   */
  verifySignature(params: any): boolean;

  /**
   * Xử lý hoàn tiền (Dành cho BE 4 sau này)
   */
  processRefund(
    transactionId: string,
    amount: number,
    transDate: string,
    vnpayTransactionNo: string,
  ): Promise<{ success: boolean; message: string; data?: any }>;
}