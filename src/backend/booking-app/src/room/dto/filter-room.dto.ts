import { IsOptional, IsString, IsInt, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { RoomTypeEnum, TargetGender } from '../entities/room.entity';

export enum SortField {
  PRICE = 'pricePerMonth',
  AREA = 'area',
  CREATED = 'createdAt',
}

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class FilterRoomDto {
  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  ward?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minArea?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxArea?: number;

  @IsOptional()
  @IsEnum(RoomTypeEnum)
  roomType?: RoomTypeEnum;

  @IsOptional()
  @IsEnum(TargetGender)
  gender?: TargetGender;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  hostId?: number;

  @IsOptional()
  @IsString()
  amenities?: string; // Comma-separated amenity names: "WiFi miễn phí,Máy lạnh"

  @IsOptional()
  @IsString()
  sort?: string; // "pricePerMonth:ASC"

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  keyword?: string;
}