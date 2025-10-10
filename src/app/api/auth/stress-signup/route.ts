import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { AuthUtils } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

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

    // Insert user with 2FA disabled for stress testing
    const result = await pool.query(
      `INSERT INTO users (
        email, password_hash, first_name, last_name, country,
        account_type, is_verified, is_2fa_enabled, two_factor_type
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, email, first_name, last_name`,
      [
        body.email,
        passwordHash,
        body.firstName,
        body.lastName,
        body.country || 'US',
        'individual',
        true, // is_verified
        false, // is_2fa_enabled - disabled for stress testing
        'none'
      ]
    );

    const user = result.rows[0];

    return NextResponse.json({
      message: 'User created successfully for stress testing',
      userId: user.id,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        isVerified: true,
        is2FAEnabled: false
      }
    });

  } catch (error) {
    console.error('Stress signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}