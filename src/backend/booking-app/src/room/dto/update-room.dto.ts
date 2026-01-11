import { PartialType } from '@nestjs/mapped-types';
import { CreateRoomDto } from './create-room.dto';
import { IsArray, IsNumber, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateRoomDto extends PartialType(CreateRoomDto) {
  // Frontend sẽ gửi dạng: deleteImageIds[] = 1 & deleteImageIds[] = 2
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') return [parseInt(value)];
    if (Array.isArray(value)) return value.map((v) => parseInt(v));
    return value;
  })
  @IsArray()
  @IsNumber({}, { each: true })
  deleteImageIds?: number[];

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  coverImageId?: number;

  // chọn ảnh MỚI làm thumbnail
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  newCoverIndex?: number;
}