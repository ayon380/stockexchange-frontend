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

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Get user
    const userResult = await pool.query(
      'SELECT id, two_factor_type FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = userResult.rows[0];

    if (user.two_factor_type === 'email') {
      // Generate new email 2FA code
      const code = AuthUtils.generateEmailTwoFactorCode();
      console.log('Generated 2FA code for', email, ':', code);
      
      const emailSent = await AuthUtils.sendEmailTwoFactorCode(email, code);
      console.log('Email sent result:', emailSent);

      if (!emailSent) {
        return NextResponse.json(
          { error: 'Failed to send verification email. Please check your email configuration.' },
          { status: 500 }
        );
      }

      // Store email 2FA code
      await pool.query(
        'UPDATE users SET email_2fa_code = $1, email_2fa_expires_at = $2 WHERE id = $3',
        [code, new Date(Date.now() + 10 * 60 * 1000), user.id] // 10 minutes expiry
      );

      return NextResponse.json({
        message: 'Verification code sent to your email',
        type: 'email'
      });
    } else {
      return NextResponse.json(
        { error: 'TOTP authentication does not require email codes' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Send 2FA error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
