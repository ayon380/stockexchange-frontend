import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { AuthUtils } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Generate 2FA secret
    const twoFactorSetup = AuthUtils.generateTwoFactorSecret();

    // Update user with 2FA secret
    await pool.query(
      'UPDATE users SET two_factor_secret = $1 WHERE id = $2',
      [twoFactorSetup.secret, userId]
    );

    return NextResponse.json({
      secret: twoFactorSetup.secret,
      qrCodeUrl: twoFactorSetup.qrCodeUrl,
      backupCodes: twoFactorSetup.backupCodes
    });

  } catch (error) {
    console.error('2FA setup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId, code, enable } = await request.json();

    if (!userId || !code) {
      return NextResponse.json(
        { error: 'User ID and verification code are required' },
        { status: 400 }
      );
    }

    // Get user
    const userResult = await pool.query(
      'SELECT two_factor_secret FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = userResult.rows[0];

    // Verify 2FA code
    const isValid = AuthUtils.verifyTwoFactorCode(user.two_factor_secret, code);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    // Enable or disable 2FA
    await pool.query(
      'UPDATE users SET is_2fa_enabled = $1 WHERE id = $2',
      [enable, userId]
    );

    return NextResponse.json({
      message: `Two-factor authentication ${enable ? 'enabled' : 'disabled'} successfully`
    });

  } catch (error) {
    console.error('2FA verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
