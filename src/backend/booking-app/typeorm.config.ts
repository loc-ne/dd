import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';

config(); // load .env

const configService = new ConfigService();

export default new DataSource({
  type: 'postgres',
  url: configService.get<string>('DATABASE_URL'),
  entities: ['dist/**/*.entity.js'],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});
