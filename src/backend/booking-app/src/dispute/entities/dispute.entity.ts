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
import { Booking } from '../../booking/entities/booking.entity';
import { User } from '../../user/user.entity';
import { DisputeStatus } from '../dispute.constant';

export { DisputeStatus };

@Entity('disputes')
export class Dispute {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'booking_id' })
    bookingId: number;

    @Column({ name: 'renter_id' })
    renterId: number;

    @Column({ type: 'text' })
    reason: string;

    @Column({ type: 'jsonb', nullable: true, name: 'evidence_images' })
    evidenceImages: string[] | null;

    @Column({ type: 'text', nullable: true, name: 'admin_decision_note' })
    adminDecisionNote: string | null;

    @Column({ type: 'decimal', precision: 10, scale: 2, name: 'refund_amount', default: 0 })
    refundAmount: number;

    @Column({
        type: 'enum',
        enum: DisputeStatus,
        default: DisputeStatus.PENDING_REVIEW,
    })
    status: DisputeStatus;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    // Relations
    @OneToOne(() => Booking)
    @JoinColumn({ name: 'booking_id' })
    booking: Booking;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'renter_id' })
    renter: User;
}
