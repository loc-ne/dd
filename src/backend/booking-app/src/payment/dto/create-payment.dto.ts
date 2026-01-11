import { IsNumber, IsOptional, IsString, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '../payment.constant';

export class CreatePaymentDto {
  @IsNumber()
  @Type(() => Number)
  bookingId: number;

  @IsNumber()
  @Min(1000, { message: 'Số tiền tối thiểu là 1,000 VNĐ' })
  @Type(() => Number) 
  amount: number;

  @IsEnum(PaymentMethod)
  @IsOptional()
  method?: PaymentMethod;

  @IsString()
  @IsOptional()
  orderId?: string;

  @IsString()
  @IsOptional()
  orderInfo?: string;

  @IsString()
  @IsOptional()
  bankCode?: string;

  @IsString()
  @IsOptional()
  language?: string;
}