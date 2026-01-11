import {
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

// User tạo một review

export class CreateUserReviewDto {
  @IsNumber()
  @Min(0.1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  comment?: string;
}
