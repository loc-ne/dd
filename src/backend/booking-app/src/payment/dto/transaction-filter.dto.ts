import { IsOptional, IsDateString, IsEnum } from 'class-validator';
import { TransactionStatus, TransactionType } from '../payment.constant';

export class TransactionFilterDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;
}
