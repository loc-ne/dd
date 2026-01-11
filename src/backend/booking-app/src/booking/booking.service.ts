import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Not } from 'typeorm';
import { Booking } from './entities/booking.entity';
import { Room } from '../room/entities/room.entity';
import { BookingStatus } from './entities/booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class BookingService {
  constructor(
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    @InjectRepository(Room) private roomRepo: Repository<Room>,
    private mailerService: MailService,
    private dataSource: DataSource,
  ) { }

  async create(renterId: number, dto: CreateBookingDto): Promise<Booking> {
    const room = await this.roomRepo.findOneBy({ id: dto.roomId });
    if (!room) throw new NotFoundException('Room not found');

    const booking = this.bookingRepo.create({
      renterId,
      roomId: dto.roomId,
      moveInDate: new Date(dto.moveInDate),
      depositAmount: room.deposit,
      totalPrice: room.pricePerMonth,
      status: BookingStatus.PENDING,
    });
    return await this.bookingRepo.save(booking);
  }

async findOne(bookingId: number): Promise<Booking> {
  const booking = await this.bookingRepo.findOne({
    where: { id: bookingId },
    relations: ['room', 'renter'],
  });

  if (!booking) {
    throw new NotFoundException(`Booking ${bookingId} not found`);
  }
  return booking;
}


  async getMyBookings(renterId: number): Promise<Booking[]> {
    return await this.bookingRepo.find({
      where: { renterId },
      relations: ['room', 'room.images', 'room.host', 'renter', 'dispute'],
      order: { createdAt: 'DESC' }
    });
  }

  async getHostBookings(hostId: number): Promise<Booking[]> {
    return await this.bookingRepo
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.room', 'room')
      .leftJoinAndSelect('room.images', 'images')
      .leftJoinAndSelect('booking.renter', 'renter')
      .leftJoinAndSelect('booking.dispute', 'dispute')
      .where('room.hostId = :hostId', { hostId })
      .orderBy('booking.createdAt', 'DESC')
      .getMany();
  }

  async approve(hostId: number, bookingId: number): Promise<Booking> {
    return await this.dataSource.transaction(async (manager) => {
      const booking = await manager.findOne(Booking, {
        where: { id: bookingId },
        relations: ['renter', 'room']
      });
      if (!booking) throw new NotFoundException('Booking not found');

      booking.status = BookingStatus.APPROVED;

      // AF3: Tự động từ chối các yêu cầu trùng phòng
      await manager.update(Booking,
        { roomId: booking.roomId, status: BookingStatus.PENDING, id: Not(bookingId) },
        { status: BookingStatus.REJECTED, rejectReason: 'Room has been rented.' }
      );

      await this.mailerService.sendBookingResult(booking.renter, booking.room.title, 'APPROVED');
      return await manager.save(booking);
    });
  }

  async confirmBooking(bookingId: number): Promise<Booking> {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId },
      relations: ['room', 'renter'],
    });

    if (!booking) throw new NotFoundException('Booking not found');

    booking.status = BookingStatus.CONFIRMED;
    const savedBooking = await this.bookingRepo.save(booking);

    // Gửi email thông báo thanh toán thành công
    await this.mailerService.sendPaymentSuccess(
      booking.renter,
      booking.room.title,
      booking.depositAmount,
      booking.moveInDate,
    );

    return savedBooking;
  }

  async reject(hostId: number, bookingId: number, reason: string): Promise<Booking> {
    const booking = await this.bookingRepo.findOne({ where: { id: bookingId }, relations: ['renter', 'room'] });
    if (!booking) throw new NotFoundException('Booking not found');

    booking.status = BookingStatus.REJECTED;
    booking.rejectReason = reason;

    await this.mailerService.sendBookingResult(booking.renter, booking.room.title, 'REJECTED', reason);
    return await this.bookingRepo.save(booking);
  }

  async cancelByRenter(renterId: number, bookingId: number, reason: string): Promise<void> {
    await this.bookingRepo.update(
      { id: bookingId, renterId },
      { status: BookingStatus.CANCELLED_BY_RENTER, cancelReason: reason }
    );
  }

  async cancelByHost(hostId: number, bookingId: number, reason: string): Promise<void> {
    await this.bookingRepo.update(
      { id: bookingId },
      { status: BookingStatus.CANCELLED_BY_HOST, cancelReason: reason }
    );
  }
}