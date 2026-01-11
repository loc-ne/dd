// src/rooms/dto/moderate-room.dto.ts
import { IsEnum, IsOptional, IsString, ValidateIf } from 'class-validator';
import { ModerationStatus } from '../entities/room.entity';

export class ModerateRoomDto {
  @IsEnum(ModerationStatus)
  decision: ModerationStatus; //  APPROVED, REJECTED, NEEDS_EDIT

  @IsOptional()
  @IsString()
  @ValidateIf(o => o.decision !== ModerationStatus.APPROVED) 
  reason?: string; 
}