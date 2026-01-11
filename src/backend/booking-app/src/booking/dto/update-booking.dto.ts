import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BookingStatus } from '../booking.constant';

export class UpdateBookingDto {
  @IsOptional()
  @IsDateString()
  moveInDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  depositAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  totalPrice?: number;

  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ValidateIf((o) => o.status === BookingStatus.REJECTED)
  @IsString()
  @IsOptional()
  rejectReason?: string;

  @ValidateIf(
    (o) =>
      o.status === BookingStatus.CANCELLED_BY_RENTER ||
      o.status === BookingStatus.CANCELLED_BY_HOST,
  )
  @IsString()
  @IsOptional()
  cancelReason?: string;
}

