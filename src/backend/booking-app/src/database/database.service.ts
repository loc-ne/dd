import { neon } from '@neondatabase/serverless';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly sql;
  private readonly logger = new Logger(DatabaseService.name);

  constructor(private configService: ConfigService) {
    const databaseUrl = this.configService.get<string>('DATABASE_URL');
    if (!databaseUrl) throw new Error('DATABASE_URL is missing in .env');
    
    this.sql = neon(databaseUrl);
  }

  async onModuleInit() {
    try {
      await this.sql`SELECT 1`; // Test kết nối nhanh
      this.logger.log('✅ Database connected');
    } catch (error) {
      this.logger.error(`❌ Connection failed: ${error.message}`);
    }
  }

  // Hàm này giúp bạn thực hiện truy vấn ở các nơi khác
  get raw() {
    return this.sql;
  }
}