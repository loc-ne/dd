import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Req,
  ParseIntPipe,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateRoomDto } from './dto/create-room.dto';
import { FilterRoomDto } from './dto/filter-room.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ModerateRoomDto } from './dto/moderate-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) { }

  @Get()
  @UsePipes(new ValidationPipe({ transform: true }))
  async findAll(@Query() filter: FilterRoomDto) {
    const rooms = await this.roomsService.findAll(filter);
    return {
      success: true,
      data: rooms,
    };
  }

  @Get('pending')
  //@UseGuards(JwtAuthGuard)
  //  @Roles('ADMIN')
  async getPendingRooms() {
    const rooms = await this.roomsService.getPendingRooms();
    return {
      success: true,
      data: rooms,
    };
  }


  @Get('my-rooms')
  @UseGuards(JwtAuthGuard)
  async getMyRooms(@Req() req) {
    const userId = req.user.id;
    const rooms = await this.roomsService.findByHost(userId);
    return {
      success: true,
      data: rooms,
    };
  }

  @Get('my-rooms/:id')
  @UseGuards(JwtAuthGuard)
  async getMyRoomDetail(
    @Param('id', ParseIntPipe) id: number,
    @Req() req,
  ) {
    const room = await this.roomsService.findOneForHost(id, req.user.id);
    return {
      success: true,
      data: room,
    };
  }

  @Get('admin-detail/:id')
  //@UseGuards(JwtAuthGuard)
  // @Roles('ADMIN')
  async getRoomDetailForAdmin(@Param('id', ParseIntPipe) id: number) {
    const room = await this.roomsService.findOneForAdmin(id);
    return { success: true, data: room };
  }

  // return watchlist
  @Get('watchlist')
  @UseGuards(JwtAuthGuard)
  async getWishlist(@Req() req) {
    const userId = req.user.id;
    const rooms = await this.roomsService.getUserWatchlist(userId);
    return rooms;
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const room = await this.roomsService.findOne(id);
    // Tăng số lượt xem
    await this.roomsService.incrementViews(id);
    return {
      success: true,
      data: room,
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files', 10))
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async create(
    @Req() req,
    @Body() createRoomDto: CreateRoomDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return this.roomsService.create(createRoomDto, files, req.user);
  }

  @Patch(':id/moderation')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async moderateRoom(
    @Param('id', ParseIntPipe) id: number,
    @Body() moderateDto: ModerateRoomDto,
  ) {
    return this.roomsService.moderateRoom(id, moderateDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files', 10))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoomDto: UpdateRoomDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Req() req,
  ) {
    return this.roomsService.update(id, updateRoomDto, files, req.user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @Req() req,
  ) {
    return this.roomsService.delete(id, req.user);
  }

  // toggle wishlist
  @UseGuards(JwtAuthGuard)
  @Post(':id/toggle-save')
  toggleSave(
    @Param('id') id: number,
    @Req() req
  ) {
    return this.roomsService.toggleSaveRoom(id, req.user.id);
  }

}