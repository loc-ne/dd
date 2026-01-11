import { DataSource } from 'typeorm';
import { User } from '../../user/user.entity';
import { Room } from '../../room/entities/room.entity';
import { Booking, BookingStatus } from '../../booking/entities/booking.entity';
import { Review } from '../../review/entities/review.entity';
import { UserReview } from '../../user-review/user-review.entity';

export const seedReviewData = async (dataSource: DataSource) => {
  const userRepository = dataSource.getRepository(User);
  const roomRepository = dataSource.getRepository(Room);
  const bookingRepository = dataSource.getRepository(Booking);
  const reviewRepository = dataSource.getRepository(Review);
  const userReviewRepository = dataSource.getRepository(UserReview);

  // 1. Lấy dữ liệu từ DB (Đảm bảo bạn đã import CSV trước đó)
  const hosts = await userRepository.find({ where: { isHost: true } });
  const renters = await userRepository.find({ where: { isHost: false, isAdmin: false } });
  const rooms = await roomRepository.find({ relations: ['host'] });

  if (rooms.length === 0 || renters.length === 0) {
    console.error('Lỗi: Không tìm thấy dữ liệu Room hoặc Renter. Hãy seed User và Room trước!');
    return;
  }

  console.log(`--- Đang bắt đầu seed 3 nhóm Review cho ${rooms.length} phòng ---`);

  for (let i = 0; i < rooms.length; i++) {
    const room = rooms[i];
    // Xoay vòng người thuê (vì chỉ có 7 người thuê cho 32 phòng)
    const renter = renters[i % renters.length];
    
    let rating: number;
    let roomComment: string;
    let hostComment: string;

    // CHIA 3 NHÓM DỮ LIỆU DỰA TRÊN CHỈ SỐ I
    if (i % 3 === 0) { 
      // NHÓM 1: TÍCH CỰC (4-5 SAO) - Chiếm ~33%
      rating = Math.random() > 0.4 ? 5 : 4;
      const positiveReviews = [
        `Phòng ở ${room.district} này rất tuyệt, sạch sẽ và thoáng mát. Anh ${room.host.fullName} hỗ trợ nhiệt tình.`,
        "Không gian yên tĩnh, an ninh cực tốt, rất phù hợp để học tập và làm việc lâu dài.",
        "Nội thất mới, y hệt như trong ảnh. Cảm ơn chủ nhà vì trải nghiệm tuyệt vời!",
        "Vị trí thuận tiện, gần các tiện ích. Phòng sạch và không gian sống rất thoải mái."
      ];
      roomComment = positiveReviews[Math.floor(Math.random() * positiveReviews.length)];
      hostComment = "Chủ nhà cực kỳ uy tín, thân thiện và giải quyết yêu cầu rất nhanh.";

    } else if (i % 3 === 1) {
      // NHÓM 2: TRUNG BÌNH (3 SAO) - Chiếm ~33%
      rating = 3;
      const neutralReviews = [
        "Phòng đẹp nhưng hẻm vào hơi sâu và tối, đi lại buổi đêm hơi bất tiện.",
        "Tiện nghi ổn nhưng tiền điện tính giá kinh doanh hơi cao. Cần cân nhắc chi phí này.",
        "Chất lượng phòng tốt nhưng cách âm không được tốt lắm, thỉnh thoảng nghe tiếng ồn từ nhà bên cạnh.",
        "Mọi thứ ở mức ổn, phù hợp với giá tiền nhưng cần cải thiện khâu vệ sinh hành lang."
      ];
      roomComment = neutralReviews[Math.floor(Math.random() * neutralReviews.length)];
      hostComment = "Chủ nhà bình thường, đôi khi liên hệ qua Zalo phản hồi hơi chậm.";

    } else {
      // NHÓM 3: TIÊU CỰC (1-2 SAO) - Chiếm ~33%
      rating = Math.random() > 0.5 ? 2 : 1;
      const negativeReviews = [
        "Thất vọng! Phòng bị thấm dột khi mưa lớn mà báo chủ nhà mãi không thấy qua xử lý.",
        "Mọi người nên cẩn thận, lúc dọn đi chủ nhà tìm đủ mọi cách để trừ tiền cọc vô lý.",
        "Phòng cực kỳ ồn ào vì gần quán nhậu, không thể tập trung làm việc được. Rất tệ!",
        "Không đúng như mô tả, phòng nhỏ và bí bách hơn trong hình nhiều."
      ];
      roomComment = negativeReviews[Math.floor(Math.random() * negativeReviews.length)];
      hostComment = "Rất không hài lòng với thái độ của chủ nhà khi giải quyết khiếu nại của người thuê.";
    }

    // A. TẠO BOOKING (Trạng thái COMPLETED để hợp lệ cho Review)
    const booking = await bookingRepository.save(
      bookingRepository.create({
        renterId: renter.id,
        roomId: room.id,
        moveInDate: new Date(),
        depositAmount: room.deposit,
        totalPrice: room.pricePerMonth,
        status: BookingStatus.CONFIRMED,
      })
    );

    // B. TẠO REVIEW PHÒNG
    await reviewRepository.save(
      reviewRepository.create({
        bookingId: booking.id,
        renterId: renter.id,
        roomId: room.id,
        rating: rating,
        comment: roomComment,
      })
    );

    // C. TẠO REVIEW CHỦ NHÀ (Đảm bảo tính Unique reviewer-host)
    const existingUserReview = await userReviewRepository.findOne({
      where: { 
        reviewer: { id: renter.id }, 
        host: { id: room.host.id } 
      }
    });

    if (!existingUserReview) {
      await userReviewRepository.save(
        userReviewRepository.create({
          reviewer: renter,
          host: room.host,
          rating: rating,
          comment: hostComment,
        })
      );
    }
  }

  // 2. CẬP NHẬT AVG RATING CHO HOST (Để demo giao diện hiển thị sao)
  console.log("Đang cập nhật chỉ số Rating cho các Host...");
  for (const host of hosts) {
    const reviews = await userReviewRepository.find({ where: { host: { id: host.id } } });
    const count = reviews.length;
    const avg = count > 0 ? reviews.reduce((sum, r) => sum + Number(r.rating), 0) / count : 0;

    await userRepository.update(host.id, {
      avgRating: parseFloat(avg.toFixed(1)),
      reviewCount: count,
    });
  }

  console.log('--- SEED DỮ LIỆU REVIEW THÀNH CÔNG! ---');
};