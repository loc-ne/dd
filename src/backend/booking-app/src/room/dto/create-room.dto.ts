// src/rooms/dto/create-room.dto.ts
import { IsNotEmpty, IsString, IsNumber, IsEnum, IsBoolean, IsOptional, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';
import { RoomTypeEnum, UtilityUnit, TargetGender } from '../entities/room.entity';

export class CreateRoomDto {
  // --- Flag: Lưu nháp hay Đăng tin ---
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isDraft?: boolean;

  // --- 1. Basic Info ---
  @IsNotEmpty({ message: 'Tiêu đề không được để trống' })
  @IsString()
  title: string;

  @IsNotEmpty({ message: 'Mô tả không được để trống' })
  @IsString()
  description: string;

  @IsNotEmpty({ message: 'Loại phòng không được để trống' })
  @IsEnum(RoomTypeEnum)
  roomType: RoomTypeEnum;

  // --- 2. Location ---
  @IsNotEmpty({ message: 'Tỉnh/Thành phố không được để trống' })
  @IsString()
  province: string; 

  @IsNotEmpty({ message: 'Quận/Huyện không được để trống' })
  @IsString()
  district: string;

  @IsNotEmpty({ message: 'Phường/Xã không được để trống' })
  @IsString()
  ward: string;

  @IsNotEmpty({ message: 'Địa chỉ chi tiết không được để trống' })
  @IsString()
  address: string;

  @IsNotEmpty()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  latitude: number;

  @IsNotEmpty()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  longitude: number;

  // --- 3. Specs ---
  @IsNotEmpty({ message: 'Diện tích không được để trống' })
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  area: number;

  @IsNotEmpty()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  guestCapacity: number;

  // --- 4. Pricing ---
  @IsNotEmpty({ message: 'Giá thuê không được để trống' })
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  pricePerMonth: number;

  @IsNotEmpty()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  deposit: number;

  @IsNotEmpty()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  minLeaseTerm: number;

  // --- Utilities ---
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  electricityPrice: number;

  @IsEnum(UtilityUnit)
  electricityUnit: UtilityUnit;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  waterPrice: number;

  @IsEnum(UtilityUnit)
  waterUnit: UtilityUnit;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  wifiPrice: number;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  parkingFee: number;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  managementFee: number;

  @IsOptional()
  @IsString()
  miscNotes?: string;

  // --- 5. Amenities & Rules ---
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') return [value]; 
    return value;
  })
  @IsArray()
  @IsString({ each: true })
  amenities: string[];

  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  cookingAllowed: boolean;

  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  petAllowed: boolean;

  @IsEnum(TargetGender)
  gender: TargetGender;

  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  curfew: boolean;

  @IsOptional()
  @IsString()
  curfewTime?: string;

  // --- 6. Contact ---
  @IsNotEmpty({ message: 'Tên liên hệ không được để trống' })
  @IsString()
  contactName: string;

  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @IsString()
  phone: string;

  // --- 7. Images Meta ---
  @IsNotEmpty()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  coverImageIndex: number;
}