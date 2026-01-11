import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class UploadService {
    constructor() {
        // Provider đã config Cloudinary ở trên
    }

    async uploadImages(
        files: Array<Express.Multer.File>,
    ): Promise<string[]> {

        // Tạo mảng các promise để upload song song
        const uploadPromises = files.map((file) => {
            return this.uploadSingleStream(file);
        });

        const results = await Promise.all(uploadPromises);

        return results.map((result) => result.public_id);
    }

    // Hàm private để xử lý upload 1 file
    private uploadSingleStream(
        file: Express.Multer.File,
    ): Promise<UploadApiResponse> {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'phongtro_vn/rooms',
                },
                (error, result) => {
                    if (error) {
                        return reject(
                            new HttpException(
                                `Cloudinary upload error: ${error.message}`,
                                HttpStatus.INTERNAL_SERVER_ERROR,
                            ),
                        );
                    }
                    if (!result) {
                        return reject(
                            new HttpException(
                                'Cloudinary upload failed: No result returned.',
                                HttpStatus.INTERNAL_SERVER_ERROR,
                            ),
                        );
                    }
                    resolve(result);
                },
            );

            Readable.from(file.buffer).pipe(uploadStream);
        });
    }
}