import {
    isNotEmpty,
    IsNotEmpty,
    isNumber,
    IsNumber,
    IsString,
    MinLength,
} from 'class-validator'
import { Type } from 'class-transformer';

export class CreateDisputeDto {
    @IsNotEmpty()
    @Type(() => Number)
    @IsNumber()
    bookingId: number; 

    @IsNotEmpty()
    @IsString()
    @MinLength(3) 
    reason: string;
}
