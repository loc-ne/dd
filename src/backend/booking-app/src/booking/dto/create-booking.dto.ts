import { IsDateString, IsInt, IsNotEmpty } from 'class-validator';

export class CreateBookingDto {
  @IsInt()
  roomId: number;
  @IsDateString()
  moveInDate: string; 
}