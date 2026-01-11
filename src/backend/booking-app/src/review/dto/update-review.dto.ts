import { PartialType } from '@nestjs/mapped-types';
import { CreateReviewDto } from './create-review.dto';
import { IsOptional, IsInt, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateReviewDto extends PartialType(CreateReviewDto) {
    @IsOptional()
    @IsInt()
    @Type(() => Number)
    @Min(1)
    @Max(5)
    rating?: number;

    //Không sửa phần BookingId khi update review
    @IsOptional()
    @IsString()
    comment?: string;
}
