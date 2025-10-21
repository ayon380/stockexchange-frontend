-- Create tables for stock exchange

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  date_of_birth DATE,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  zip_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'US',
  ssn_last4 VARCHAR(4),
  employment_status VARCHAR(50),
  annual_income DECIMAL(15,2),
  net_worth DECIMAL(15,2),
  investment_experience VARCHAR(50),
  risk_tolerance VARCHAR(20),
  account_type VARCHAR(20) DEFAULT 'individual',
  is_verified BOOLEAN DEFAULT FALSE,
  is_2fa_enabled BOOLEAN DEFAULT TRUE, -- Made compulsory
  two_factor_type VARCHAR(20) DEFAULT 'email', -- 'email' or 'totp'
  two_factor_secret VARCHAR(255),
  email_2fa_code VARCHAR(6),
  email_2fa_expires_at TIMESTAMP,
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user_sessions table for additional session tracking
CREATE TABLE IF NOT EXISTS user_sessions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE,
  trading_token VARCHAR(255) UNIQUE,
  ip_address INET,
  user_agent TEXT,
  expires_at TIMESTAMP,
  trading_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_trading_token ON user_sessions(trading_token);

-- Create user_accounts table for trading engine
CREATE TABLE IF NOT EXISTS user_accounts (
  user_id VARCHAR(50) PRIMARY KEY,
  cash BIGINT NOT NULL DEFAULT 0,
  aapl_qty BIGINT NOT NULL DEFAULT 0,
  googl_qty BIGINT NOT NULL DEFAULT 0,
  msft_qty BIGINT NOT NULL DEFAULT 0,
  amzn_qty BIGINT NOT NULL DEFAULT 0,
  tsla_qty BIGINT NOT NULL DEFAULT 0,
  buying_power BIGINT NOT NULL DEFAULT 0,
  day_trading_buying_power BIGINT NOT NULL DEFAULT 0,
  total_trades BIGINT NOT NULL DEFAULT 0,
  realized_pnl BIGINT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for user_accounts
CREATE INDEX IF NOT EXISTS idx_user_accounts_user_id ON user_accounts(user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for users table
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

