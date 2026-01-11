import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Query,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { IsString, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { AiService, AiChatResponse } from './ai.service';

// DTOs
class ChatRequestDto {
  @IsString()
  message: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  roomId?: number;
}

class GeneralChatRequestDto {
  @IsString()
  message: string;
}

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  /**
   * Chat với AI về thông tin phòng cụ thể
   * POST /ai/chat
   * Response: { message, suggestedQuestions[] }
   */
  @Post('chat')
  @HttpCode(HttpStatus.OK)
  async chat(@Body() body: ChatRequestDto) {
    if (!body.message || body.message.trim() === '') {
      throw new BadRequestException('Vui lòng nhập tin nhắn');
    }

    if (body.roomId) {
      // Chat về phòng cụ thể - trả về message + suggestedQuestions
      const response: AiChatResponse = await this.aiService.chatWithGemini(body.message, body.roomId);
      return {
        success: true,
        data: {
          message: response.message,
          suggestedQuestions: response.suggestedQuestions,
          roomId: body.roomId,
        },
      };
    } else {
      // Chat tổng quát
      const response = await this.aiService.chatGeneral(body.message);
      return {
        success: true,
        data: {
          message: response,
          suggestedQuestions: [
            'Quy trình thuê phòng như thế nào?',
            'Chính sách hoàn cọc ra sao?',
            'Cần lưu ý gì khi thuê phòng?',
          ],
          roomId: null,
        },
      };
    }
  }

  /**
   * Lấy suggested questions ban đầu khi mở chat
   * GET /ai/suggestions?roomId=123
   */
  @Get('suggestions')
  async getInitialSuggestions(@Query('roomId', ParseIntPipe) roomId: number) {
    const suggestions = await this.aiService.getInitialSuggestions(roomId);
    return {
      success: true,
      data: {
        suggestedQuestions: suggestions,
        roomId,
      },
    };
  }
}