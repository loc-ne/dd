import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../user/user.entity';
import { Booking } from '../../booking/entities/booking.entity';
import { Room } from '../../room/entities/room.entity';

@Entity({ name: 'reviews' })
export class Review {
  @PrimaryGeneratedColumn({ name: 'review_id' })
  id: number;

  @Column({ name: 'booking_id' })
  bookingId: number;

  @Column({ name: 'renter_id' })
  renterId: number;

  @Column({ name: 'room_id' })
  roomId: number;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  // Relations
  // Một user có thể thực hiện nhiều đánh giá. Một đánh giá chỉ có thể thuộc về một user
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'renter_id' })
  renter: User;

  // Một booking có thể được đánh giá bởi một user. Một user đánh giá cho một booking.
  @ManyToOne(() => Booking, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  // Một phòng có thể được nhiều đánh giá, mỗi đánh giá dành cho một phòng.
  @ManyToOne(() => Room, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room: Room;
}
