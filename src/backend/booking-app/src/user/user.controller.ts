import {
    Controller,
    Patch,
    Body,
    Req,
    UseInterceptors,
    UploadedFile,
    UseGuards,
    Get,
    Param,
    Delete,
    Query,
    ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Patch('profile')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor('avatar'))
    async updateProfile(
        @Req() req,
        @Body() updateUserDto: UpdateUserDto,
        @UploadedFile() file: Express.Multer.File,
    ) {

        const userId = req.user.id;

        return await this.usersService.updateProfile(userId, updateUserDto, file);
    }

    // Admin endpoints
    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    async getUsers(@Query('search') search?: string) {
        const users = await this.usersService.findAll(search);
        return {
            success: true,
            message: 'Lấy danh sách user thành công',
            data: users,
        };
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    async getUserById(@Param('id', ParseIntPipe) id: number) {
        const user = await this.usersService.findById(id);
        return {
            success: true,
            message: 'Lấy thông tin user thành công',
            data: user,
        };
    }

    @Patch(':id/lock')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    async lockUser(
        @Param('id', ParseIntPipe) id: number,
        @Body('reason') reason: string,
    ) {
        const user = await this.usersService.lockUser(id, reason);
        return {
            success: true,
            message: 'Khóa tài khoản thành công',
            data: user,
        };
    }

    @Patch(':id/unlock')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    async unlockUser(@Param('id', ParseIntPipe) id: number) {
        const user = await this.usersService.unlockUser(id);
        return {
            success: true,
            message: 'Mở khóa tài khoản thành công',
            data: user,
        };
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    async deleteUser(@Param('id', ParseIntPipe) id: number) {
        await this.usersService.deleteUser(id);
        return {
            success: true,
            message: 'Xóa tài khoản thành công',
        };
    }
}
