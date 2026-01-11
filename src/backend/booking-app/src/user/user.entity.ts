import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
} from 'typeorm';
import { Room } from '../room/entities/room.entity';
import { UserReview } from '../user-review/user-review.entity';

export enum AuthProvider {
  LOCAL = 'local',
  GOOGLE = 'google',
}

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn({ name: 'user_id' })
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: false })
  email: string;

  @Column({
    name: 'password_hash',
    type: 'varchar',
    length: 255,
    nullable: true, // Cho phép null khi đăng nhập bằng Google
    select: false,
  })
  passwordHash: string;

  @Column({ name: 'full_name', type: 'varchar', length: 100, nullable: false })
  fullName: string;

  @Column({
    name: 'phone_number',
    type: 'varchar',
    length: 15,
    nullable: true,
  })
  phoneNumber: string;

  @Column({ name: 'avatar_url', type: 'varchar', length: 255, nullable: true })
  avatarUrl: string;

  @Column({
    name: 'auth_provider',
    type: 'enum',
    enum: AuthProvider,
    default: AuthProvider.LOCAL,
    nullable: false,
  })
  authProvider: AuthProvider;

  @Column({
    name: 'google_id',
    type: 'varchar',
    length: 255,
    nullable: true,
    unique: true,
  })
  googleId: string;

  @Column({ name: 'is_host', type: 'boolean', default: false, nullable: false })
  isHost: boolean;

  @Column({ name: 'is_admin', type: 'boolean', default: false, nullable: false })
  isAdmin: boolean;

  @Column({
    name: 'is_active',
    type: 'boolean',
    default: false, // chờ xác thực email sẽ set true
    nullable: false,
  })
  isActive: boolean;

  @Column({
    name: 'lock_reason',
    type: 'text',
    nullable: true,
  })
  lockReason: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @OneToMany(() => Room, (room) => room.host)
  rooms: Room[];

  //// Wishlist
  @ManyToMany(() => Room, room => room.watchList)
  savedRooms: Room[];

  //// User Review

  // Các đánh giá mà USER này VIẾT
  @OneToMany(() => UserReview, (review) => review.reviewer)
  writtenReviews: UserReview[];
  // Các đánh giá mà HOST này NHẬN
  @OneToMany(() => UserReview, (review) => review.host)
  receivedReviews: UserReview[];

  //// Cache kết quả rating cho mỗi host

  @Column({
    name: 'avg_rating',
    type: 'decimal',
    precision: 5,
    scale: 3,
    default: 0,
  })
  avgRating: number;

  @Column({
    name: 'review_count',
    type: 'int',
    default: 0,
  })
  reviewCount: number;
}