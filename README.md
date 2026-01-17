# StockExchange Frontend

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript) ![Tailwind](https://img.shields.io/badge/Tailwind_CSS-3.0-38B2AC?style=for-the-badge&logo=tailwind-css) ![License](https://img.shields.io/badge/License-Source_Available-red?style=for-the-badge)

> **Note**: Unlike typical dashboard templates, this frontend is engineered to handle **real-time, high-frequency data streams** from a C++ trading engine (50k+ ops/s). It implements complex state management for live order books, a custom dual-token authentication system with 2FA, and optimizes render performance for rapidly changing market data.

**Architected & Developed by Ayon Sarkar**

---

A modern stock trading dashboard with authentication, 2FA, and real-time data visualization.

## Key Technologies

- **Next.js 15**: React framework with App Router
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling with dark mode support
- **PostgreSQL**: Primary database
- **Redis**: Session and token storage
- **bcryptjs**: Password hashing
- **jsonwebtoken**: JWT token management
- **speakeasy**: 2FA TOTP implementation
- **Recharts**: Data visualization

## Technical Highlights

- **Real-Time Performance**: Optimized React components to render high-frequency WebSocket updates (prices, order book depths) without UI freezing.
- **Robust Security**: Custom implementation of JWT-based authentication with a dual-token strategy (Session vs. Trading tokens) and TOTP 2FA.
- **Modern Architecture**: Built on Next.js 15 using the App Router, Server Actions, and React Server Components for optimal initial load and SEO.
- **Type Safety**: End-to-end type safety shared with the backend protocols to ensure reliable data handling.

## Features

- **User Authentication**: Secure login/signup with JWT tokens
- **Two-Factor Authentication**: TOTP-based 2FA with backup codes
- **Real-time Dashboard**: Live stock price updates and market index
- **PostgreSQL Database**: User data and session storage
- **Redis Integration**: Session management and trading token storage
- **Responsive Design**: Clean UI that adapts to system theme
- **TypeScript**: Full type safety throughout the application

## Setup Instructions

### 1. Database Setup

#### PostgreSQL Installation
```bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt-get install postgresql postgresql-contrib

# Install PostgreSQL (macOS with Homebrew)
brew install postgresql
brew services start postgresql

# Install PostgreSQL (Windows)
# Download from: https://www.postgresql.org/download/windows/
```

#### Create Database
```bash
# Login to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE stockexchange;
CREATE USER stockuser WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE stockexchange TO stockuser;
\q
```

#### Run Schema
```bash
# Connect to database
psql -d stockexchange -U stockuser

# Run the schema file
\i src/lib/schema.sql
```

### 2. Redis Setup

#### Redis Installation
```bash
# Install Redis (Ubuntu/Debian)
sudo apt-get install redis-server
sudo systemctl start redis-server

# Install Redis (macOS with Homebrew)
brew install redis
brew services start redis

# Install Redis (Windows)
# Download from: https://redis.io/download
```

### 3. Environment Configuration

Copy the example environment file:
```bash
cp .env.example .env.local
```

Update the following variables in `.env.local`:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=stockexchange
DB_USER=stockuser
DB_PASSWORD=your_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT (Generate secure random strings)
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-refresh-secret-key-here
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Run the Application

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/2fa` - Setup 2FA
- `PUT /api/auth/2fa` - Enable/disable 2FA

### Pages
- `/login` - Login page
- `/signup` - Registration page
- `/app` - Main dashboard

## Token Management

### Session Token
- **Purpose**: General session management
- **Expiry**: 15 days
- **Storage**: Database + Client localStorage

### Trading Token
- **Purpose**: Trading operations and C++ engine authentication
- **Expiry**: 24 hours
- **Storage**: Redis (key: `trading:<token>`) + Client localStorage
- **Redis Data**: Full user object JSON

### Redis Structure
```
trading:<token> → {
  "id": 1,
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  // ... sanitized user data
}
```

## Security Features

- **Password Hashing**: bcrypt with 12 salt rounds
- **JWT Tokens**: Separate session and trading tokens
- **2FA**: TOTP with backup codes
- **Input Validation**: Comprehensive form validation
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: Proper input sanitization

## Development

### Project Structure
```
src/
├── app/
│   ├── api/auth/          # Authentication API routes
│   ├── login/             # Login page
│   ├── signup/            # Signup page
│   └── app/               # Main dashboard
├── lib/
│   ├── auth.ts            # Authentication utilities
│   ├── db.ts              # Database connection
│   ├── redis.ts           # Redis connection
│   ├── types.ts           # TypeScript types
│   └── schema.sql         # Database schema
└── components/            # Reusable components
```



## Production Deployment

1. Set up production database and Redis instances
2. Configure environment variables
3. Build the application: `npm run build`
4. Start the application: `npm start`
5. Set up reverse proxy (nginx) for production
6. Configure SSL certificates
7. Set up monitoring and logging

