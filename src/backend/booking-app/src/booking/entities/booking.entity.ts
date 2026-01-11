import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../user/user.entity';
import { Room } from '../../room/entities/room.entity';
import { BookingStatus } from '../booking.constant';

export { BookingStatus };

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'renter_id' })
  renterId: number;

  @Column({ name: 'room_id' })
  roomId: number;

  @Column({ type: 'date', name: 'move_in_date' })
  moveInDate: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'deposit_amount' })
  depositAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'total_price' })
  totalPrice: number;

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.PENDING,
  })
  status: BookingStatus;

  @Column({ type: 'text', nullable: true, name: 'reject_reason' })
  rejectReason: string | null;

  @Column({ type: 'text', nullable: true, name: 'cancel_reason' })
  cancelReason: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'renter_id' })
  renter: User;

  @ManyToOne(() => Room)
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @OneToOne('Dispute', 'booking')
  dispute: any;
}