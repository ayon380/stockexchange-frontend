/*
 * Copyright (c) 2026 Ayon Sarkar. All Rights Reserved.
 *
 * This source code is licensed under the terms found in the
 * LICENSE file in the root directory of this source tree.
 *
 * USE FOR EVALUATION ONLY. NO PRODUCTION USE OR COPYING PERMITTED.
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { User, AuthTokens, TwoFactorSetup } from './types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export class AuthUtils {
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static generateSessionToken(userId: string): string {
    return jwt.sign(
      { userId, type: 'session' },
      JWT_SECRET,
      { expiresIn: '15d' }
    );
  }

  static generateTradingToken(userId: string): string {
    return jwt.sign(
      { userId, type: 'trading' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
  }

  static verifyToken(token: string): { userId: string; type: string } | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload & { userId: string; type: string };
      return { userId: decoded.userId, type: decoded.type };
    } catch {
      return null;
    }
  }

  static generateTwoFactorSecret(): TwoFactorSetup {
    const secret = speakeasy.generateSecret({
      name: 'StockExchange App',
      issuer: 'StockExchange'
    });

    const backupCodes = [];
    for (let i = 0; i < 10; i++) {
      backupCodes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }

    return {
      type: 'totp',
      secret: secret.base32,
      qrCodeUrl: secret.otpauth_url || '',
      backupCodes
    };
  }

  static generateEmailTwoFactorCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  static async sendEmailTwoFactorCode(email: string, code: string): Promise<boolean> {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        debug: true, // Enable debug logging
        logger: true // Enable logger
      });

      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@stockexchange.com',
        to: email,
        subject: 'Your StockExchange 2FA Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">StockExchange Security Code</h2>
            <p>Your two-factor authentication code is:</p>
            <div style="font-size: 32px; font-weight: bold; color: #007bff; text-align: center; padding: 20px; border: 2px solid #007bff; border-radius: 8px; margin: 20px 0;">
              ${code}
            </div>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't request this code, please ignore this email.</p>
          </div>
        `
      });

      console.log('Email sent successfully to', email);
      return true;
    } catch (error) {
      console.error('Email sending error:', error);
      return false;
    }
  }

  static verifyTwoFactorCode(secret: string, code: string, type: string = 'totp'): boolean {
    if (type === 'email') {
      // For email 2FA, we just check if the code matches (verification happens in the API)
      return true;
    }

    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: code,
      window: 2 // Allow 2 time windows (30 seconds each)
    });
  }

  static generateAuthTokens(userId: string): AuthTokens {
    const sessionToken = this.generateSessionToken(userId);
    const tradingToken = this.generateTradingToken(userId);

    return {
      sessionToken,
      tradingToken,
      expiresIn: 15 * 24 * 60 * 60 * 1000, // 15 days in milliseconds
      tradingExpiresIn: 24 * 60 * 60 * 1000 // 24 hours in milliseconds
    };
  }

  static validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static sanitizeUser(user: User): Partial<User> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, two_factor_secret, email_2fa_code, email_2fa_expires_at, ssn_last4, ...sanitizedUser } = user;
    return sanitizedUser;
  }
}
