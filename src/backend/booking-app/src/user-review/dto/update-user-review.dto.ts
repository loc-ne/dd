import { Min, Max, IsOptional, IsString, IsNumber } from 'class-validator';

export class UpdateUserReviewDto {
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsString()
  comment?: string;
}
