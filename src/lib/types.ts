export interface User {
  id: number;
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
  user_id: number;
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
