import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { AuthUtils } from '@/lib/auth';

/**
 * GET /api/balance
 * Fetches the current user's account balance and positions
 * 
 * Note: Balance is synced to DB every 30 seconds from the C++ engine during TRADING mode.
 * In ADMIN mode, balance is updated immediately after deposit/withdrawal operations.
 */
export async function GET(request: NextRequest) {
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

    // Query user account from database
    const result = await pool.query(
      `SELECT 
        user_id,
        cash,
        aapl_qty,
        googl_qty,
        msft_qty,
        amzn_qty,
        tsla_qty,
        buying_power,
        day_trading_buying_power,
        total_trades,
        realized_pnl,
        is_active,
        updated_at
      FROM user_accounts 
      WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    const account = result.rows[0];

    // Convert fixed-point integers to dollars (divide by 100)
    const balanceData = {
      userId: account.user_id,
      cash: account.cash / 100,
      positions: {
        AAPL: account.aapl_qty || 0,
        GOOGL: account.googl_qty || 0,
        MSFT: account.msft_qty || 0,
        AMZN: account.amzn_qty || 0,
        TSLA: account.tsla_qty || 0,
      },
      buyingPower: account.buying_power / 100,
      dayTradingBuyingPower: account.day_trading_buying_power / 100,
      totalTrades: account.total_trades || 0,
      realizedPnl: account.realized_pnl / 100,
      isActive: account.is_active,
      lastUpdated: account.updated_at,
    };

    return NextResponse.json(balanceData);
  } catch (error) {
    console.error('Error fetching balance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
