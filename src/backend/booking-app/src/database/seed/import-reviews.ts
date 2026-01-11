import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import csv from 'csv-parser';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function importCSV(dataSource: DataSource, tableName: string, csvFilePath: string) {
  const results: any[] = [];

  return new Promise<void>((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        try {
          if (results.length === 0) {
            console.log(`⚠️  ${tableName}: Không có dữ liệu`);
            resolve();
            return;
          }

          // Chèn từng bản ghi
          for (const row of results) {
            const columns = Object.keys(row).filter(key => row[key] !== '');
            const values = columns.map(col => row[col]);
            
            const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
            const columnsStr = columns.map(col => `"${col}"`).join(', ');
            
            const query = `INSERT INTO "${tableName}" (${columnsStr}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;
            
            await dataSource.query(query, values);
          }

          console.log(`✅ ${tableName}: Đã import ${results.length} bản ghi`);
          resolve();
        } catch (error) {
          console.error(`❌ Lỗi khi import ${tableName}:`, error);
          reject(error);
        }
      })
      .on('error', reject);
  });
}

async function main() {
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    console.error('❌ Lỗi: DATABASE_URL không được tìm thấy trong .env');
    console.error('Vui lòng kiểm tra file .env và đảm bảo có DATABASE_URL');
    process.exit(1);
  }

  console.log('📝 DATABASE_URL:', DATABASE_URL.replace(/:[^:@]+@/, ':****@'));

  const dataSource = new DataSource({
    type: 'postgres',
    url: DATABASE_URL,
    synchronize: false,
  });

  try {
    console.log('🔌 Đang kết nối database...');
    await dataSource.initialize();
    console.log('✅ Đã kết nối database\n');

    const seedDir = __dirname;

    console.log('📥 Bắt đầu import reviews.csv...\n');

    // Import reviews.csv
    await importCSV(dataSource, 'reviews', path.join(seedDir, 'reviews.csv'));

    console.log('\n🎉 Hoàn thành import reviews!');

  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

main();
