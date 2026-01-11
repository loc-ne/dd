import {
  Controller,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadService } from './upload.service';


@Controller('images')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @UseInterceptors(
    FilesInterceptor('images', 10, { 
      

      storage: memoryStorage(),
      
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(
            new HttpException('File is not an image.', HttpStatus.BAD_REQUEST),
            false,
          );
        }
        cb(null, true);
      },

      limits: {
        fileSize: 1024 * 1024 * 5, 
      },
    }),
  )
  async uploadFiles(@UploadedFiles() files: Array<Express.Multer.File>) {
    if (!files || files.length === 0) {
      throw new HttpException('No files uploaded.', HttpStatus.BAD_REQUEST);
    }
    
    const publicIds = await this.uploadService.uploadImages(files);

    return {
      success: true,
      message: 'Files uploaded successfully',
      data: {
        public_ids: publicIds,
      },
    };
  }
}