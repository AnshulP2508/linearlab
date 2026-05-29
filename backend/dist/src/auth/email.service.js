"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer_1 = __importDefault(require("nodemailer"));
let EmailService = class EmailService {
    config;
    constructor(config) {
        this.config = config;
    }
    async sendOtp(email, otp) {
        const service = this.config.get('SMTP_SERVICE') ?? 'gmail';
        const user = this.config.get('SMTP_USER');
        const pass = this.config.get('SMTP_PASS');
        if (!user || !pass) {
            throw new common_1.ServiceUnavailableException('SMTP_USER and SMTP_PASS are required to send OTP emails');
        }
        const transporter = nodemailer_1.default.createTransport({
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
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], EmailService);
//# sourceMappingURL=email.service.js.map