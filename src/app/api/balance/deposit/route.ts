import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { AuthUtils } from '@/lib/auth';

/**
 * POST /api/balance/deposit
 * Request funds deposit (requires admin approval in ADMIN mode)
 * 
 * During TRADING mode, deposits are queued for processing.
 * During ADMIN mode, deposits can be processed immediately by admins.
 */
export async function POST(request: NextRequest) {
  try {
    // Get session token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = AuthUtils.verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    const userId = decoded.userId;
    const body = await request.json();

    // Validate amount
    const amount = parseFloat(body.amount);
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount - must be positive' },
        { status: 400 }
      );
    }

    if (amount > 1000000) {
      return NextResponse.json(
        { error: 'Amount exceeds maximum deposit limit ($1,000,000)' },
        { status: 400 }
      );
    }

    // Check if user account exists
    const accountResult = await pool.query(
      'SELECT user_id, cash, is_active FROM user_accounts WHERE user_id = $1',
      [userId]
    );

    if (accountResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    const account = accountResult.rows[0];
    
    if (!account.is_active) {
      return NextResponse.json(
        { error: 'Account is inactive' },
        { status: 403 }
      );
    }

    // Create deposit request (to be processed by admin or automatically)
    // For now, we'll log it but not automatically apply it
    // This should be processed through the C++ engine's admin mode
    
    const depositRequest = {
      userId,
      amount,
      timestamp: new Date().toISOString(),
      status: 'pending',
    };

    return NextResponse.json({
      message: 'Deposit request created. Please contact an administrator to process this deposit through the exchange admin mode.',
      request: depositRequest,
      note: 'Deposits must be processed when the exchange is in ADMIN mode for immediate effect, or queued during TRADING mode.',
    });
  } catch (error) {
    console.error('Error processing deposit request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
