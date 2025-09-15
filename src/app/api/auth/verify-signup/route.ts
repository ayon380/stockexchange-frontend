import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { AuthUtils } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { userId, code, type } = await request.json();

    if (!userId || !code || !type) {
      return NextResponse.json(
        { error: 'User ID, code, and type are required' },
        { status: 400 }
      );
    }

    // Get user
    const userResult = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = userResult.rows[0];

    let isValid = false;

    if (type === 'totp') {
      if (!user.two_factor_secret) {
        return NextResponse.json(
          { error: 'TOTP not set up' },
          { status: 400 }
        );
      }
      isValid = AuthUtils.verifyTwoFactorCode(user.two_factor_secret, code, 'totp');
    } else if (type === 'email') {
      if (user.email_2fa_code !== code) {
        return NextResponse.json(
          { error: 'Invalid verification code' },
          { status: 401 }
        );
      }

      if (user.email_2fa_expires_at && new Date(user.email_2fa_expires_at) < new Date()) {
        return NextResponse.json(
          { error: 'Verification code has expired' },
          { status: 401 }
        );
      }

      isValid = true;

      // Clear the used code
      await pool.query(
        'UPDATE users SET email_2fa_code = NULL, email_2fa_expires_at = NULL WHERE id = $1',
        [user.id]
      );
    } else {
      return NextResponse.json(
        { error: 'Invalid 2FA type' },
        { status: 400 }
      );
    }

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    // Enable 2FA and mark as verified
    await pool.query(
      'UPDATE users SET is_2fa_enabled = TRUE, is_verified = TRUE WHERE id = $1',
      [userId]
    );

    // Generate tokens
    const tokens = AuthUtils.generateAuthTokens(userId);

    return NextResponse.json({
      message: 'Account verified successfully',
      tokens,
      user: AuthUtils.sanitizeUser({ ...user, is_2fa_enabled: true, is_verified: true })
    });

  } catch (error) {
    console.error('Signup verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
