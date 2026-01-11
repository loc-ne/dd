import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from './user/users.module';
import { AuthModule } from './auth/auth.module';
import { RoomsModule } from './room/rooms.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { BookingModule } from './booking/booking.module';
import { PaymentModule } from './payment/payment.module';
import { DisputeModule } from './dispute/dispute.module';
import { ReviewModule } from './review/review.module';
import { UserReviewModule } from './user-review/user-review.module';
import { HostDashboardModule } from './dashboard/host-dashboard.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: true,
      }),
      inject: [ConfigService],
    }),

    MailerModule.forRoot({
      transport: {
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, 
        auth: {
          user: 'nakrothnguyen127@gmail.com', 
          pass: 'ldcv jqxm iewu qddu',    
        },
      },
      defaults: {
        from: '"No Reply - PhongTro.vn" <nakrothnguyen127@gmail.com>',
      },
      template: {
        dir: join(process.cwd(), 'src/mail/templates'),
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    }),

    UsersModule,
    AuthModule,
    RoomsModule,
    BookingModule,
    PaymentModule,
    DisputeModule,
    ReviewModule,
    UserReviewModule,
    HostDashboardModule,
    AiModule,
  ],
})
export class AppModule { }
