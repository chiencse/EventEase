import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';

@Module({
  imports: [
    ConfigModule, // Đảm bảo đã import ConfigModule
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const user = configService.get<string>('MAIL_USER');
        const pass = configService.get<string>('MAIL_PASS');

        console.log('📧 Mail config loaded:', { user, pass: pass ? '***' : 'undefined' });

        return {
          transport: {
            service: 'gmail',
            auth: {
              user,
              pass,
            },
          },
          defaults: {
            from: `"EventEase 🎉" <${user}>`,
          },
        };
      },
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
