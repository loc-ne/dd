import { Entity, PrimaryGeneratedColumn, Column, OneToMany, Index } from 'typeorm';
import { RoomAmenity } from './room-amenity.entity';

@Entity({ name: 'amenities' })
export class Amenity {
  @PrimaryGeneratedColumn({ name: 'amenity_id' })
  id: number;

  @Column({ name: 'amenity_name', type: 'varchar', length: 100 })
  name: string; 

  @Column({ type: 'varchar', length: 50, unique: true })
  @Index()
  slug: string; 

  @Column({ type: 'varchar', nullable: true })
  icon: string; 

  @OneToMany(() => RoomAmenity, (roomAmenity) => roomAmenity.amenity)
  roomAmenities: RoomAmenity[];
}