import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Room } from './room.entity';

@Entity({ name: 'room_images' })
export class RoomImage {
  @PrimaryGeneratedColumn({ name: 'image_id' })
  id: number;

  @Column({ name: 'room_id' })
  roomId: number;

  @Column({ name: 'image_url', type: 'varchar', length: 500 })
  imageUrl: string;

  @Column({ name: 'public_id', type: 'varchar', length: 100, nullable: true })
  publicId: string;
  
  @Column({ name: 'is_thumbnail', type: 'boolean', default: false })
  isThumbnail: boolean;

  @ManyToOne(() => Room, (room) => room.images, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room: Room;
}