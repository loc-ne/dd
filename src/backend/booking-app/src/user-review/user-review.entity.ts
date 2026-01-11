import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Check,
} from 'typeorm';
import { User } from '../user/user.entity';


@Entity({ name: 'user_reviews' })

// 1 user chỉ được review 1 lần cho 1 host
@Unique(['reviewer', 'host'])

// ràng buộc rating > 0 và < 5
@Check(`"rating" > 0 AND "rating" <= 5`)
export class UserReview {
  @PrimaryGeneratedColumn({ name: 'review_id' })
  id: number;

  /* =========================
     RELATIONS
     ========================= */

  // Người viết review
  @ManyToOne(() => User, (user) => user.writtenReviews, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  reviewer: User;

  // Host được review
  @ManyToOne(() => User, (user) => user.receivedReviews, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'host_id' })
  host: User;

  /* =========================
     REVIEW DATA
     ========================= */

  @Column({
    type: 'decimal',
    precision: 2,
    scale: 1,
    nullable: false,
  })
  rating: number;

  @Column({
    type: 'text',
    nullable: true,
  })
  comment: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;
}
