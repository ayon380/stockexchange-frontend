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
import redis from '@/lib/redis';
import { AuthUtils } from '@/lib/auth';
import { LoginRequest } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();

    // Validate required fields
    if (!body.email || !body.password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Get user from database
    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [body.email]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const user = userResult.rows[0];

    // Verify password
    const isPasswordValid = await AuthUtils.verifyPassword(body.password, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if 2FA is enabled (now compulsory)
    if (user.is_2fa_enabled) {
      if (!body.twoFactorCode) {
        // For email 2FA, automatically send the code
        if (user.two_factor_type === 'email') {
          const code = AuthUtils.generateEmailTwoFactorCode();
          const emailSent = await AuthUtils.sendEmailTwoFactorCode(user.email, code);

          if (!emailSent) {
            return NextResponse.json(
              { error: 'Failed to send verification email' },
              { status: 500 }
            );
          }

          // Store email 2FA code
          await pool.query(
            'UPDATE users SET email_2fa_code = $1, email_2fa_expires_at = $2 WHERE id = $3',
            [code, new Date(Date.now() + 10 * 60 * 1000), user.id] // 10 minutes expiry
          );
        }

        return NextResponse.json(
          {
            error: 'Two-factor authentication required',
            requires2FA: true,
            twoFactorType: user.two_factor_type,
            codeSent: user.two_factor_type === 'email' ? true : undefined
          },
          { status: 401 }
        );
      }

      // Verify 2FA code based on type
      if (user.two_factor_type === 'email') {
        // Check email 2FA code
        if (user.email_2fa_code !== body.twoFactorCode) {
          return NextResponse.json(
            { error: 'Invalid two-factor authentication code' },
            { status: 401 }
          );
        }

        // Check if code is expired
        if (user.email_2fa_expires_at && new Date(user.email_2fa_expires_at) < new Date()) {
          return NextResponse.json(
            { error: 'Two-factor authentication code has expired' },
            { status: 401 }
          );
        }

        // Clear the used code
        await pool.query(
          'UPDATE users SET email_2fa_code = NULL, email_2fa_expires_at = NULL WHERE id = $1',
          [user.id]
        );
      } else {
        // Verify TOTP code
        const is2FAValid = AuthUtils.verifyTwoFactorCode(user.two_factor_secret, body.twoFactorCode, 'totp');
        if (!is2FAValid) {
          return NextResponse.json(
            { error: 'Invalid two-factor authentication code' },
            { status: 401 }
          );
        }
      }
    }

    // Generate tokens
    const tokens = AuthUtils.generateAuthTokens(user.id);

    // Store trading token in Redis
    const userData = {
      ...AuthUtils.sanitizeUser(user),
      tradingToken: tokens.tradingToken,
      sessionToken: tokens.sessionToken
    };

    await redis.setex(
      `trading:${tokens.tradingToken}`,
      Math.floor(tokens.tradingExpiresIn / 1000),
      String(userData.id)
    );

    // Optional: Store user session mapping
    await redis.setex(
      `user:${user.id}:trading`,
      Math.floor(tokens.tradingExpiresIn / 1000),
      tokens.tradingToken
    );

    // Store session in database
    await pool.query(
      `INSERT INTO user_sessions (
        user_id, session_token, trading_token, expires_at, trading_expires_at
      ) VALUES ($1, $2, $3, $4, $5)`,
      [
        user.id,
        tokens.sessionToken,
        tokens.tradingToken,
        new Date(Date.now() + tokens.expiresIn),
        new Date(Date.now() + tokens.tradingExpiresIn)
      ]
    );

    return NextResponse.json({
      message: 'Login successful',
      user: userData,
      tokens
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
