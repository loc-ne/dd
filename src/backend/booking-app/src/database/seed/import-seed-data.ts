// import { DataSource } from 'typeorm';
// import * as dotenv from 'dotenv';
// import { seedTransactionData } from '../../payment/entities/seed-transactions';

// // Import tất cả các Entity liên quan
// import { User } from '../../user/user.entity'; // Sửa lại đường dẫn cho đúng
// import { Room } from '../../room/entities/room.entity';
// import { Booking } from '../../booking/entities/booking.entity';
// import { Review } from '../../review/entities/review.entity';
// import { UserReview } from '../../user-review/user-review.entity';
// import { RoomImage } from '../../room/entities/room-image.entity';
// import { RoomAmenity } from '../../room/entities/room-amenity.entity';
// import { Amenity } from '../../room/entities/amenity.entity';
// import { Dispute } from "../../dispute/entities/dispute.entity";
// import { Transaction } from '../../payment/entities/transaction.entity';
// dotenv.config();

// async function main() {
//   const DATABASE_URL = process.env.DATABASE_URL;

//   if (!DATABASE_URL) {
//     console.error('❌ Lỗi: DATABASE_URL không tìm thấy trong .env');
//     process.exit(1);
//   }

//   const dataSource = new DataSource({
//     type: 'postgres',
//     url: DATABASE_URL,
//     // QUAN TRỌNG: Phải khai báo entities ở đây
//     entities: [User, Room, Booking, Review, UserReview, RoomImage, RoomAmenity, Amenity, Dispute],
//     synchronize: false,
//     logging: false, // Bật true nếu muốn xem câu lệnh SQL chạy ngầm
//   });

//   try {
//     console.log('🚀 Đang kết nối Database...');
//     await dataSource.initialize();
//     console.log('✅ Kết nối thành công!');

//     console.log('\n📝 Đang bắt đầu seed transaction data...');
//     await seedTransactionData(dataSource);

//     console.log('\n✨ Chúc mừng! Dữ liệu đã được seed thành công để demo.');
//   } catch (error) {
//     console.error('❌ Lỗi trong quá trình seed:', error);
//   } finally {
//     await dataSource.destroy(); // Đóng kết nối sau khi xong
//   }
// }

// main();