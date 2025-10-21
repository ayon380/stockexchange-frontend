import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { AuthUtils } from '@/lib/auth';

/**
 * GET /api/balance/positions
 * Fetches detailed position information with market values
 * 
 * This endpoint provides real-time position data synced from the database.
 * Market values are calculated using the latest prices from the order book.
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

    // Query user account
    const accountResult = await pool.query(
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

    if (accountResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    const account = accountResult.rows[0];

    // Get latest prices for each stock from daily_stats table
    const pricesResult = await pool.query(
      `SELECT symbol, close_price, last_trade_price 
       FROM daily_stats 
       WHERE symbol IN ('AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA')
       AND date = CURRENT_DATE`
    );

    const prices: { [key: string]: number } = {};
    pricesResult.rows.forEach(row => {
      // Use last_trade_price if available, otherwise close_price
      prices[row.symbol] = (row.last_trade_price || row.close_price) / 100; // Convert cents to dollars
    });

    // Calculate position values
    const positions = [
      {
        symbol: 'AAPL',
        quantity: account.aapl_qty || 0,
        currentPrice: prices['AAPL'] || 0,
        marketValue: (account.aapl_qty || 0) * (prices['AAPL'] || 0),
      },
      {
        symbol: 'GOOGL',
        quantity: account.googl_qty || 0,
        currentPrice: prices['GOOGL'] || 0,
        marketValue: (account.googl_qty || 0) * (prices['GOOGL'] || 0),
      },
      {
        symbol: 'MSFT',
        quantity: account.msft_qty || 0,
        currentPrice: prices['MSFT'] || 0,
        marketValue: (account.msft_qty || 0) * (prices['MSFT'] || 0),
      },
      {
        symbol: 'AMZN',
        quantity: account.amzn_qty || 0,
        currentPrice: prices['AMZN'] || 0,
        marketValue: (account.amzn_qty || 0) * (prices['AMZN'] || 0),
      },
      {
        symbol: 'TSLA',
        quantity: account.tsla_qty || 0,
        currentPrice: prices['TSLA'] || 0,
        marketValue: (account.tsla_qty || 0) * (prices['TSLA'] || 0),
      },
    ].filter(pos => pos.quantity > 0); // Only show positions with holdings

    const totalMarketValue = positions.reduce((sum, pos) => sum + pos.marketValue, 0);
    const cash = account.cash / 100;
    const totalPortfolioValue = cash + totalMarketValue;

    return NextResponse.json({
      userId: account.user_id,
      cash,
      positions,
      summary: {
        totalMarketValue,
        totalPortfolioValue,
        buyingPower: account.buying_power / 100,
        dayTradingBuyingPower: account.day_trading_buying_power / 100,
        totalTrades: account.total_trades || 0,
        realizedPnl: account.realized_pnl / 100,
      },
      isActive: account.is_active,
      lastUpdated: account.updated_at,
      syncNote: 'Balance is synced from the C++ engine every 30 seconds during TRADING mode, or immediately during ADMIN mode operations.',
    });
  } catch (error) {
    console.error('Error fetching positions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
