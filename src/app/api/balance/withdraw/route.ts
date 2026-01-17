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

/**
 * POST /api/balance/withdraw
 * Request funds withdrawal (requires admin approval in ADMIN mode)
 * 
 * During TRADING mode, withdrawals are NOT allowed.
 * During ADMIN mode, withdrawals can be processed immediately by admins.
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

    // Check if user account exists and has sufficient funds
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

    const currentCash = account.cash / 100; // Convert from cents to dollars
    
    if (amount > currentCash) {
      return NextResponse.json(
        { error: `Insufficient funds. Available: $${currentCash.toFixed(2)}` },
        { status: 400 }
      );
    }

    // Create withdrawal request (to be processed by admin)
    // Withdrawals MUST be processed through the C++ engine's admin mode
    
    const withdrawalRequest = {
      userId,
      amount,
      availableCash: currentCash,
      timestamp: new Date().toISOString(),
      status: 'pending',
    };

    return NextResponse.json({
      message: 'Withdrawal request created. Please contact an administrator to process this withdrawal through the exchange admin mode.',
      request: withdrawalRequest,
      note: 'Withdrawals can ONLY be processed when the exchange is in ADMIN mode (press E to enter admin mode).',
    });
  } catch (error) {
    console.error('Error processing withdrawal request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
