/*
 * Copyright (c) 2026 Ayon Sarkar. All Rights Reserved.
 *
 * This source code is licensed under the terms found in the
 * LICENSE file in the root directory of this source tree.
 *
 * USE FOR EVALUATION ONLY. NO PRODUCTION USE OR COPYING PERMITTED.
 */

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { AuthUtils } from '@/lib/auth';
import { SignupRequest, TwoFactorSetup } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body: SignupRequest = await request.json();

    // Validate required fields
    if (!body.email || !body.password || !body.firstName || !body.lastName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = AuthUtils.validatePassword(body.password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: 'Password does not meet requirements', details: passwordValidation.errors },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [body.email]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await AuthUtils.hashPassword(body.password);

    // Generate 2FA setup based on type
    const twoFactorType = body.twoFactorType || 'email';

    // Insert user first
    const result = await pool.query(
      `INSERT INTO users (
        email, password_hash, first_name, last_name, phone, date_of_birth,
        address, city, state, zip_code, country, ssn_last4, employment_status,
        annual_income, net_worth, investment_experience, risk_tolerance,
        account_type, two_factor_type
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING id, email, first_name, last_name, is_verified, is_2fa_enabled, two_factor_type`,
      [
        body.email,
        passwordHash,
        body.firstName,
        body.lastName,
        body.phone || null,
        body.dateOfBirth || null,
        body.address || null,
        body.city || null,
        body.state || null,
        body.zipCode || null,
        body.country || 'US',
        body.ssnLast4 || null,
        body.employmentStatus || null,
        body.annualIncome || null,
        body.netWorth || null,
        body.investmentExperience || null,
        body.riskTolerance || null,
        body.accountType || 'individual',
        twoFactorType
      ]
    );

    const user = result.rows[0];

    // Generate 2FA setup based on type
    let twoFactorSetup: TwoFactorSetup;

    if (twoFactorType === 'totp') {
      twoFactorSetup = AuthUtils.generateTwoFactorSecret();
      // Update user with TOTP secret
      await pool.query(
        'UPDATE users SET two_factor_secret = $1 WHERE id = $2',
        [twoFactorSetup.secret, user.id]
      );
    } else {
      // For email 2FA, generate code and send email
      const code = AuthUtils.generateEmailTwoFactorCode();
      const emailSent = await AuthUtils.sendEmailTwoFactorCode(body.email, code);

      if (!emailSent) {
        return NextResponse.json(
          { error: 'Failed to send verification email' },
          { status: 500 }
        );
      }

      twoFactorSetup = {
        type: 'email',
        emailSent: true
      };

      // Store email 2FA code
      await pool.query(
        'UPDATE users SET email_2fa_code = $1, email_2fa_expires_at = $2 WHERE id = $3',
        [code, new Date(Date.now() + 10 * 60 * 1000), user.id] // 10 minutes expiry
      );
    }

    // For TOTP, return setup info; for email, user needs to verify code
    if (twoFactorType === 'totp') {
      return NextResponse.json({
        message: 'User created successfully. Please set up two-factor authentication.',
        userId: user.id,
        user: AuthUtils.sanitizeUser(user),
        twoFactorSetup: {
          type: 'totp',
          qrCodeUrl: twoFactorSetup.qrCodeUrl,
          backupCodes: twoFactorSetup.backupCodes
        },
        requiresVerification: true
      });
    } else {
      return NextResponse.json({
        message: 'User created successfully. Please check your email for the verification code.',
        userId: user.id,
        user: AuthUtils.sanitizeUser(user),
        twoFactorSetup: {
          type: 'email',
          emailSent: true
        },
        requiresVerification: true
      });
    }

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
