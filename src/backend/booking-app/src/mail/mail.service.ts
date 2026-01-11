import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { User } from '../user/user.entity';

export enum ModerationStatus {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  NEEDS_EDIT = 'NEEDS_EDIT',
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
}

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendUserConfirmation(user: User, token: string) {
    const url = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Chào mừng đến với Newbie.com! Xác thực Email của bạn',
      template: './confirmation',
      context: {
        name: user.fullName,
        url,
      },
    });
  }

  async sendModerationResult(
    user: User,
    roomTitle: string,
    status: ModerationStatus,
    reason: string = '',
    roomId: number,
  ) {
    let template = '';
    let subject = '';
    let link = '';

    const frontendUrl = process.env.FRONTEND_URL;

    switch (status) {
      case ModerationStatus.APPROVED:
        template = './listing-approved';
        subject = 'Tin đăng của bạn đã được duyệt!';
        link = `${frontendUrl}/rooms/${roomId}`;
        break;

      case ModerationStatus.REJECTED:
        template = './listing-rejected';
        subject = 'Tin đăng bị từ chối';
        link = `${frontendUrl}/dashboard/host/rooms`;
        break;

      case ModerationStatus.NEEDS_EDIT:
        template = './listing-needs-edit';
        subject = 'Yêu cầu chỉnh sửa tin đăng';
        link = `${frontendUrl}/dashboard/host/rooms`;
        break;
    }

    await this.mailerService.sendMail({
      to: user.email,
      subject: subject,
      template: template,
      context: {
        name: user.fullName,
        roomTitle: roomTitle,
        reason: reason,
        link: link,
      },
    });
  }

  async sendBookingResult(
    user: User,
    roomTitle: string,
    status: 'APPROVED' | 'REJECTED',
    reason: string = '',
  ) {
    const isApproved = status === 'APPROVED';

    await this.mailerService.sendMail({
      to: user.email,
      subject: isApproved
        ? 'Yêu cầu đặt phòng đã được duyệt!'
        : 'Yêu cầu đặt phòng bị từ chối',
      template: isApproved ? './booking-approved' : './booking-rejected',
      context: {
        name: user.fullName,
        roomTitle: roomTitle,
        reason: reason,
        actionUrl: `${process.env.FRONTEND_URL}/dashboard/bookings`,
      },
    });
  }

  /**
   * Gửi email thông báo thanh toán cọc thành công
   */
  async sendPaymentSuccess(
    user: User,
    roomTitle: string,
    amount: number,
    moveInDate: Date,
  ) {
    await this.mailerService.sendMail({
      to: user.email,
      subject: '✅ Thanh toán cọc thành công - Xác nhận đặt phòng',
      template: './payment-success',
      context: {
        name: user.fullName,
        roomTitle: roomTitle,
        amount: amount,
        moveInDate: moveInDate,
        actionUrl: `${process.env.FRONTEND_URL}/dashboard/bookings`,
      },
    });
  }

  async sendRefundResult(
    user: User,
    transactionId: string,
    status: 'APPROVED' | 'REJECTED' | 'PENDING',
    amount: number,
    reason: string = '',
  ) {
    await this.mailerService.sendMail({
      to: user.email,
      subject:
        status === 'APPROVED'
          ? 'Yêu cầu hoàn tiền đã được duyệt!'
          : status === 'REJECTED'
            ? 'Yêu cầu hoàn bị từ chối'
            : 'Yêu cầu hoàn tiền đang được xem xét',
      template:
        status === 'APPROVED'
          ? './refund-approved'
          : status === 'REJECTED'
            ? './refund-rejected'
            : './refund-pending',
      context: {
        name: user.fullName,
        transactionId: transactionId,
        amount: amount,
        reason: reason,
      },
    });
  }

  /**
   * Gửi email thông báo kết quả dispute cho renter
   */
  async sendDisputeResult(
    user: User,
    roomTitle: string,
    status: 'APPROVED' | 'DENIED',
    refundAmount: number,
    reason: string = '',
  ) {
    const isApproved = status === 'APPROVED';

    await this.mailerService.sendMail({
      to: user.email,
      subject: isApproved
        ? 'Khiếu nại của bạn đã được chấp nhận!'
        : 'Khiếu nại của bạn bị từ chối',
      template: isApproved ? './dispute-approved' : './dispute-denied',
      context: {
        name: user.fullName,
        roomTitle: roomTitle,
        refundAmount: refundAmount,
        reason: reason,
        actionUrl: `http://${process.env.FRONTEND_URL}/dashboard/bookings`,
      },
    });
  }

  /**
   * Gửi email thông báo kết quả dispute cho host
   */
  async sendDisputeResultHost(
    host: User,
    roomTitle: string,
    renterName: string,
    status: 'APPROVED' | 'DENIED',
    refundAmount: number,
    reason: string = '',
  ) {
    const isApproved = status === 'APPROVED';

    await this.mailerService.sendMail({
      to: host.email,
      subject: isApproved
        ? `Khiếu nại từ ${renterName} đã được chấp nhận`
        : `Khiếu nại từ ${renterName} đã bị từ chối`,
      template: isApproved
        ? './dispute-host-refunded'
        : './dispute-host-denied',
      context: {
        name: host.fullName,
        roomTitle: roomTitle,
        renterName: renterName,
        refundAmount: refundAmount,
        reason: reason,
        actionUrl: `http://${process.env.FRONTEND_URL}/dashboard/host/rooms`,
      },
    });
  }

  async sendPasswordReset(user: User, token: string) {
    const url = `http://${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Yêu cầu đặt lại mật khẩu',
      template: './reset-password',
      context: {
        name: user.fullName,
        url,
      },
    });
  }
}
