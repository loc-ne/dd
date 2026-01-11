export enum TransactionStatus {
  PENDING = 'PENDING', // Đang chờ thanh toán
  SUCCESS = 'SUCCESS', // Thanh toán thành công
  FAILED = 'FAILED', // Thanh toán thất bại
  REFUNDED = 'REFUNDED', // Đã hoàn tiền (cho Dispute)
}

export enum TransactionType {
  DEPOSIT = 'DEPOSIT', // Thanh toán tiền cọc
  REFUND = 'REFUND', // Hoàn tiền
}

export enum PaymentMethod {
  VNPAY = 'VNPAY',
  MOMO = 'MOMO',
}
