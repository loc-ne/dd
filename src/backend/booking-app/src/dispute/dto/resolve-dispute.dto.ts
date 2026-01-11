import {
    IsEnum,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Min,
} from 'class-validator';
import { DisputeStatus } from '../dispute.constant';

export class ResolveDisputeDto {
    @IsNotEmpty()
    @IsEnum(DisputeStatus)
    status: DisputeStatus;

    @IsOptional()
    @IsString()
    reason: string;

    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    refundAmount: number;
}
