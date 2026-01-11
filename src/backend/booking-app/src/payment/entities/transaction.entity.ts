import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { User } from '../../user/user.entity';
import { Booking } from '../../booking/entities/booking.entity';
import { TransactionStatus, TransactionType, PaymentMethod } from '../payment.constant';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'booking_id' })
  bookingId: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ type: 'decimal', precision: 15, scale: 0 }) 
  amount: number;

  @Column({ 
    type: 'enum', 
    enum: PaymentMethod,
    name: 'payment_method'
  })
  paymentMethod: PaymentMethod;

  @Column({ 
    type: 'enum', 
    enum: TransactionStatus, 
    default: TransactionStatus.PENDING 
  })
  status: TransactionStatus;

  @Column({ 
    type: 'enum', 
    enum: TransactionType, 
    default: TransactionType.DEPOSIT 
  })
  type: TransactionType;

  @Column({ name: 'gateway_transaction_id', nullable: true })
  gatewayTransactionId: string;

  // Nội dung thanh toán
  @Column({ nullable: true })
  description: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Booking)
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;
}