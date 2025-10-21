export interface User {
  id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  phone?: string;
  date_of_birth?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country: string;
  ssn_last4?: string;
  employment_status?: string;
  annual_income?: number;
  net_worth?: number;
  investment_experience?: string;
  risk_tolerance?: string;
  account_type: string;
  is_verified: boolean;
  is_2fa_enabled: boolean;
  two_factor_type: string;
  two_factor_secret?: string;
  email_2fa_code?: string;
  email_2fa_expires_at?: string;
  email_verified: boolean;
  phone_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserSession {
  id: number;
  user_id: string;
  session_token: string;
  trading_token: string;
  ip_address?: string;
  user_agent?: string;
  expires_at: string;
  trading_expires_at: string;
  created_at: string;
  last_activity: string;
}

export interface AuthTokens {
  sessionToken: string;
  tradingToken: string;
  expiresIn: number;
  tradingExpiresIn: number;
}

export interface LoginRequest {
  email: string;
  password: string;
  twoFactorCode?: string;
  twoFactorType?: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  ssnLast4?: string;
  employmentStatus?: string;
  annualIncome?: number;
  netWorth?: number;
  investmentExperience?: string;
  riskTolerance?: string;
  accountType?: string;
  twoFactorType?: string;
}

export interface TwoFactorSetup {
  type: string;
  secret?: string;
  qrCodeUrl?: string;
  backupCodes?: string[];
  emailSent?: boolean;
}

export interface UserAccount {
  user_id: string;
  cash: number;
  aapl_qty: number;
  googl_qty: number;
  msft_qty: number;
  amzn_qty: number;
  tsla_qty: number;
  buying_power: number;
  day_trading_buying_power: number;
  total_trades: number;
  realized_pnl: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface BalanceResponse {
  userId: string;
  cash: number;
  positions: {
    AAPL: number;
    GOOGL: number;
    MSFT: number;
    AMZN: number;
    TSLA: number;
  };
  buyingPower: number;
  dayTradingBuyingPower: number;
  totalTrades: number;
  realizedPnl: number;
  isActive: boolean;
  lastUpdated?: string;
}

export interface Position {
  symbol: string;
  quantity: number;
  currentPrice: number;
  marketValue: number;
}

export interface PositionsResponse {
  userId: string;
  cash: number;
  positions: Position[];
  summary: {
    totalMarketValue: number;
    totalPortfolioValue: number;
    buyingPower: number;
    dayTradingBuyingPower: number;
    totalTrades: number;
    realizedPnl: number;
  };
  isActive: boolean;
  lastUpdated?: string;
  syncNote?: string;
}

export interface DepositRequest {
  amount: number;
}

export interface WithdrawalRequest {
  amount: number;
}

export interface TransactionRequest {
  userId: string;
  amount: number;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
}
