import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as querystring from 'qs';

import {
  IPaymentGateway,
  CreatePaymentUrlDto,
} from '../interfaces/payment-gateway.interface';
import moment from 'moment';
import { url } from 'inspector';

@Injectable()
export class VnpayService implements IPaymentGateway {
  private readonly vnp_TmnCode: string;
  private readonly vnp_HashSecret: string;
  private readonly vnp_Url: string;
  private readonly vnp_ReturnUrl: string;

  constructor(private configService: ConfigService) {
    // Lấy config từ environment variables hoặc sử dụng giá trị mặc định
    this.vnp_TmnCode =
      this.configService.get<string>('VNPAY_TMN_CODE') || 'CU3BPYJS';
    this.vnp_HashSecret =
      this.configService.get<string>('VNPAY_HASH_SECRET') ||
      'QO7A6BIM0IZ6WOQ4QCZ4K25DKTOKGEEE';
    this.vnp_Url =
      this.configService.get<string>('VNPAY_URL') ||
      'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    this.vnp_ReturnUrl =
      this.configService.get<string>('VNPAY_RETURN_URL') ||
      'http://localhost:3000/api/payment/vnpay-return';
  }

  /**
   * Hàm sắp xếp object theo thứ tự key
   */
  private sortObject(obj: any): any {
    const sorted = {};
    let str: string[] = [];
    let key;

    for (key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        str.push(encodeURIComponent(key));
      }
    }

    str.sort();

    for (key = 0; key < str.length; key++) {
      sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, '+');
    }

    return sorted;
  }

  /**
   * Hàm format date theo định dạng YYYYMMDDHHmmss
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  /**
   * Tạo URL để redirect người dùng sang trang thanh toán VNPay
   */
  async createPaymentUrl(dto: CreatePaymentUrlDto): Promise<string> {
    process.env.TZ = 'Asia/Ho_Chi_Minh';

    const date = new Date();
    const createDate = this.formatDate(date);

    const locale = dto.language || 'vn';
    const currCode = 'VND';

    let vnp_Params: any = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = this.vnp_TmnCode;
    vnp_Params['vnp_Locale'] = locale;
    vnp_Params['vnp_CurrCode'] = currCode;
    vnp_Params['vnp_TxnRef'] = dto.orderId;
    vnp_Params['vnp_OrderInfo'] = dto.orderInfo;
    vnp_Params['vnp_OrderType'] = 'other';
    vnp_Params['vnp_Amount'] = dto.amount * 100; // VNPay yêu cầu số tiền nhân 100
    vnp_Params['vnp_ReturnUrl'] = this.vnp_ReturnUrl;
    vnp_Params['vnp_IpAddr'] = dto.ipAddr;
    vnp_Params['vnp_CreateDate'] = createDate;

    if (dto.bankCode && dto.bankCode !== '') {
      vnp_Params['vnp_BankCode'] = dto.bankCode;
    }

    vnp_Params = this.sortObject(vnp_Params);

    const signData = querystring.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac('sha512', this.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    vnp_Params['vnp_SecureHash'] = signed;

    const paymentUrl =
      this.vnp_Url + '?' + querystring.stringify(vnp_Params, { encode: false });

    return paymentUrl;
  }

  /**
   * Kiểm tra chữ ký bảo mật từ Webhook (IPN) hoặc Return URL của VNPay
   */
  verifySignature(params: any): boolean {
    const vnp_Params = { ...params };
    const secureHash = vnp_Params['vnp_SecureHash'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    const sortedParams = this.sortObject(vnp_Params);
    const signData = querystring.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac('sha512', this.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    return secureHash === signed;
  }

  /**
   * Xử lý hoàn tiền
   * 
   * ⚠️ LƯU Ý: VNPay Sandbox có thể KHÔNG hỗ trợ Refund API.
   * Refund API thường chỉ hoạt động trên môi trường Production với merchant account thật.
   * 
   * Nếu gặp lỗi "Transaction not found" (code 91):
   * 1. Kiểm tra vnp_TransactionNo có đúng là mã VNPay trả về không
   * 2. Xác nhận merchant account có quyền refund
   * 3. Test trên Production environment nếu cần thiết
   * 
   * @param transactionId - Order ID gốc (vnp_TxnRef)
   * @param amount - Số tiền hoàn
   * @param transDate - Ngày giao dịch gốc format YYYYMMDDHHmmss (14 chữ số)
   * @param vnpayTransactionNo - Số GD VNPay gốc (vnp_TransactionNo)
   */
  async processRefund(
    transactionId: string,
    amount: number,
    transDate: string,
    vnpayTransactionNo: string,
  ): Promise<{ success: boolean; message: string; data?: any }> {
    process.env.TZ = 'Asia/Ho_Chi_Minh';
    const date = new Date();

    const vnp_TmnCode = this.vnp_TmnCode;
    const secretKey = this.vnp_HashSecret;
    const vnp_Api = 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction';

    const vnp_RequestId = crypto.randomUUID();
    const vnp_Version = '2.1.0';
    const vnp_Command = 'refund';
    const vnp_TransactionType = '02'; // 02 = Hoàn toàn phần, 03 = Hoàn một phần
    const vnp_TxnRef = transactionId;
    const vnp_Amount = amount * 100;
    const vnp_OrderInfo = `Hoan tien GD ma: ${vnp_TxnRef}`;
    const vnp_TransactionNo = vnpayTransactionNo; // SỐ GD VNPAY GỐC
    const vnp_TransactionDate = transDate; // Format: YYYYMMDDHHmmss
    const vnp_CreateBy = 'admin';
    const vnp_CreateDate = moment(date).format('YYYYMMDDHHmmss');
    const vnp_IpAddr = '127.0.0.1';

    // Tạo chuỗi dữ liệu để hash
    const data =
      vnp_RequestId +
      '|' +
      vnp_Version +
      '|' +
      vnp_Command +
      '|' +
      vnp_TmnCode +
      '|' +
      vnp_TransactionType +
      '|' +
      vnp_TxnRef +
      '|' +
      vnp_Amount +
      '|' +
      vnp_TransactionNo +
      '|' +
      vnp_TransactionDate +
      '|' +
      vnp_CreateBy +
      '|' +
      vnp_CreateDate +
      '|' +
      vnp_IpAddr +
      '|' +
      vnp_OrderInfo;

    const hmac = crypto.createHmac('sha512', secretKey);
    const vnp_SecureHash = hmac.update(Buffer.from(data, 'utf-8')).digest('hex');

    const dataObj = {
      vnp_RequestId,
      vnp_Version,
      vnp_Command,
      vnp_TmnCode,
      vnp_TransactionType,
      vnp_TxnRef,
      vnp_Amount,
      vnp_TransactionNo,
      vnp_CreateBy,
      vnp_OrderInfo,
      vnp_TransactionDate,
      vnp_CreateDate,
      vnp_IpAddr,
      vnp_SecureHash,
    };

    console.log('=== VNPay Refund Request ===');
    console.log('Request Data:', JSON.stringify(dataObj, null, 2));

    try {
      const res = await fetch(vnp_Api, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataObj),
      });

      const json = await res.json();
      console.log('=== VNPay Refund Response ===');
      console.log('Response:', JSON.stringify(json, null, 2));

      // Kiểm tra response code và signature
      if (json.vnp_ResponseCode === '00') {
        console.log('✅ Refund successful!');
        return {
          success: true,
          message: 'Hoàn tiền thành công',
          data: json,
        };
      } else {
        console.error('❌ Refund failed with code:', json.vnp_ResponseCode);
        const errorMessages: Record<string, string> = {
          '02': 'Merchant không hợp lệ',
          '03': 'Dữ liệu gửi sang không đúng định dạng',
          '04': 'Không cho phép hoàn trả giao dịch',
          '13': 'Chỉ cho phép hoàn trả một phần',
          '91': 'Không tìm thấy giao dịch',
          '93': 'Số tiền hoàn trả không hợp lệ',
          '94': 'Yêu cầu bị trùng',
          '95': 'Giao dịch chưa được thanh toán',
          '97': 'Chữ ký không hợp lệ',
          '99': 'Lỗi không xác định',
        };
        return {
          success: false,
          message: errorMessages[json.vnp_ResponseCode] || `Lỗi VNPay: ${json.vnp_ResponseCode}`,
          data: json,
        };
      }
    } catch (err) {
      console.error('❌ Refund network error:', err);
      return {
        success: false,
        message: 'Lỗi kết nối VNPay API',
        data: { error: err.message },
      };
    }
  }
}
