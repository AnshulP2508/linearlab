import { ConfigService } from '@nestjs/config';
export declare class EmailService {
    private readonly config;
    constructor(config: ConfigService);
    sendOtp(email: string, otp: string): Promise<void>;
}
