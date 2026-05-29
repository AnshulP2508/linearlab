import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  constructor(private readonly config: ConfigService) {}

  async sendOtp(email: string, otp: string) {
    const service = this.config.get<string>('SMTP_SERVICE') ?? 'gmail';
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');

    if (!user || !pass) {
      throw new ServiceUnavailableException(
        'SMTP_USER and SMTP_PASS are required to send OTP emails',
      );
    }

    const transporter = nodemailer.createTransport({
      service,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: user,
      to: email,
      subject: 'Your Verification Code',
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
          <h2 style="margin:0 0 12px">Verify your email</h2>
          <p style="margin:0 0 16px">Use this verification code to finish creating your POC Management account.</p>
          <div style="display:inline-block;padding:14px 22px;border-radius:12px;background:#eef2ff;color:#1e1b4b;font-size:28px;font-weight:700;letter-spacing:6px">
            ${otp}
          </div>
          <p style="margin:16px 0 0;color:#4b5563">This code expires in 10 minutes.</p>
        </div>
      `,
    });
  }
}
