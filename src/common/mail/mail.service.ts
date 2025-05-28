import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailerService: MailerService) {}

  /**
   * Gửi email với nội dung tùy chỉnh
   * @param to - Địa chỉ email người nhận
   * @param subject - Tiêu đề email
   * @param content - Nội dung email (HTML hoặc plain text)
   */
  async send(to: string, subject: string, content: string): Promise<boolean> {
    try {
      await this.mailerService.sendMail({
        to,
        subject,
        html: content,
      });
      this.logger.log(`Email sent to ${to} - ${subject}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error.stack);
      return false;
    }
  }
}
