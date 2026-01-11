import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
  Index,
} from 'typeorm';
import { User } from '../../user/user.entity';
import { RoomImage } from './room-image.entity';
import { RoomAmenity } from './room-amenity.entity';


export enum RoomTypeEnum {
  ROOM = 'ROOM',       // Phòng trọ
  STUDIO = 'STUDIO',   // Chung cư mini / Studio
  DORM = 'DORM',       // KTX / Ở ghép
  HOUSE = 'HOUSE',     // Nhà nguyên căn
}

export enum TargetGender {
  ALL = 'ALL',
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}

export enum UtilityUnit {
  KWH = 'KWH',         // Số điện
  M3 = 'M3',           // Khối nước
  PERSON = 'PERSON',   // Theo người
  ROOM = 'ROOM',       // Theo phòng
  FREE = 'FREE',       // Miễn phí
}

export enum RoomStatus {
  AVAILABLE = 'AVAILABLE',
  RENTED = 'RENTED',
  PENDING = 'PENDING',
  HIDDEN = "HIDDEN"
}

export enum ModerationStatus {
  DRAFT = 'DRAFT',         // Nháp
  PENDING = 'PENDING',     // Chờ duyệt
  APPROVED = 'APPROVED',   // Đã duyệt
  REJECTED = 'REJECTED',   // Từ chối
  NEEDS_EDIT = 'NEEDS_EDIT', // Cần chỉnh sửa
}

@Entity({ name: 'rooms' })
@Index('idx_rooms_location', ['latitude', 'longitude'])
@Index('idx_rooms_price', ['pricePerMonth'])
@Index('idx_rooms_address', ['city', 'district', 'ward'])
export class Room {
  @PrimaryGeneratedColumn({ name: 'room_id' })
  id: number;

  @Column({ name: 'host_id' })
  @Index()
  hostId: number;

  // --- 1. BASIC INFO ---
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: RoomTypeEnum,
    name: 'room_type',
    default: RoomTypeEnum.ROOM
  })
  roomType: RoomTypeEnum;

  // --- 2. LOCATION ---
  @Column({ type: 'varchar', length: 100 })
  city: string;

  @Column({ type: 'varchar', length: 100 })
  district: string;

  @Column({ type: 'varchar', length: 100 })
  ward: string;

  @Column({ name: 'address_detail', type: 'varchar', length: 255 })
  address: string;

  @Column({ type: 'float', nullable: true })
  latitude: number;

  @Column({ type: 'float', nullable: true })
  longitude: number;

  // --- 3. SPECS ---
  @Column({ type: 'float' })
  area: number;

  @Column({ name: 'guest_capacity', type: 'int', default: 1 })
  guestCapacity: number;

  // --- 4. PRICING & TERMS ---
  @Column({ name: 'price_per_month', type: 'decimal', precision: 12, scale: 0 })
  pricePerMonth: number;

  @Column({ name: 'deposit', type: 'decimal', precision: 12, scale: 0, default: 0 })
  deposit: number;

  @Column({ name: 'min_lease_term', type: 'int', default: 6 })
  minLeaseTerm: number;

  // --- 5. Chi phí ---
  // Điện
  @Column({ name: 'electricity_price', type: 'decimal', precision: 10, scale: 0, default: 0 })
  electricityPrice: number;

  @Column({ name: 'electricity_unit', type: 'enum', enum: UtilityUnit, default: UtilityUnit.KWH })
  electricityUnit: UtilityUnit;

  // Nước
  @Column({ name: 'water_price', type: 'decimal', precision: 10, scale: 0, default: 0 })
  waterPrice: number;

  @Column({ name: 'water_unit', type: 'enum', enum: UtilityUnit, default: UtilityUnit.M3 })
  waterUnit: UtilityUnit;

  // Khác
  @Column({ name: 'wifi_price', type: 'decimal', precision: 10, scale: 0, default: 0 })
  wifiPrice: number;

  @Column({ name: 'parking_fee', type: 'decimal', precision: 10, scale: 0, default: 0 })
  parkingFee: number;

  @Column({ name: 'management_fee', type: 'decimal', precision: 10, scale: 0, default: 0 })
  managementFee: number; // Phí dịch vụ/rác

  @Column({ name: 'misc_notes', type: 'text', nullable: true })
  miscNotes: string | null;

  // --- 6. RULES & FEATURES ---
  @Column({ name: 'cooking_allowed', type: 'boolean', default: true })
  cookingAllowed: boolean;

  @Column({ name: 'pet_allowed', type: 'boolean', default: false })
  petAllowed: boolean;

  @Column({ type: 'enum', enum: TargetGender, default: TargetGender.ALL })
  gender: TargetGender;

  @Column({ type: 'boolean', default: true })
  curfew: boolean; // true = Có giờ giới nghiêm

  @Column({ name: 'curfew_time', type: 'varchar', length: 10, nullable: true })
  curfewTime: string | null; // Ví dụ: "23:30"


  // --- SYSTEM ---
  @Column({ type: 'enum', enum: RoomStatus, default: RoomStatus.AVAILABLE })
  status: RoomStatus;

  @Column({ type: 'enum', enum: ModerationStatus, default: ModerationStatus.DRAFT })
  moderationStatus: ModerationStatus;

  @Column({ name: 'moderation_notes', type: 'text', nullable: true })
  moderationNotes: string;

  @Column({ name: 'contact_name', type: 'varchar', length: 100, nullable: true })
  contactName: string;

  @Column({ name: 'contact_phone', type: 'varchar', length: 15, nullable: true })
  phone: string;


  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({name: 'total_views', type: 'int', default: 0})
  totalViews: number;   //Tổng số lượt xem phòng, mặc định bằng 0

  // --- RELATIONS ---
  @ManyToOne(() => User, (user: User) => user.rooms, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'host_id' })
  host: User;

  @OneToMany(() => RoomImage, (image) => image.room, { cascade: true })
  images?: RoomImage[];

  @OneToMany(() => RoomAmenity, (ra) => ra.room, { cascade: true })
  roomAmenities: RoomAmenity[];

  @ManyToMany(() => User, (user: User) => user.savedRooms, { cascade: true })
  @JoinTable({
    name: 'room_wishlist',
    joinColumn: {
      name: 'room_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'user_id',
      referencedColumnName: 'id',
    },
  })
  watchList: User[];
}