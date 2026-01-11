import { IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
export class CreateReviewDto {
    @IsInt()
    @Type(() => Number)
    bookingId: number;

    @IsInt()
    @Type(() => Number)
    @Min(1)
    @Max(5)
    rating: number;

    //Không giới hạn độ dài comment
    @IsString()
    comment: string;
}
