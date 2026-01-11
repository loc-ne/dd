import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ProcessBookingStatus } from '../booking.constant';

export class ProcessBookingDto {
  @IsEnum(ProcessBookingStatus)
  status: ProcessBookingStatus;

  @IsOptional()
  @IsString()
  rejectReason?: string; 
}