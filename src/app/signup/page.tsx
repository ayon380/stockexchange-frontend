'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
    ssnLast4: '',
    employmentStatus: '',
    annualIncome: '',
    netWorth: '',
    investmentExperience: '',
    riskTolerance: 'moderate',
    accountType: 'individual',
    twoFactorType: 'email'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationData, setVerificationData] = useState<{
    userId: number;
    type: string;
    qrCodeUrl?: string;
    backupCodes?: string[];
    emailSent?: boolean;
  } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          annualIncome: formData.annualIncome ? parseFloat(formData.annualIncome) : undefined,
          netWorth: formData.netWorth ? parseFloat(formData.netWorth) : undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Set verification data
        setVerificationData({
          userId: data.userId,
          type: data.twoFactorSetup.type,
          qrCodeUrl: data.twoFactorSetup.qrCodeUrl,
          backupCodes: data.twoFactorSetup.backupCodes,
          emailSent: data.twoFactorSetup.emailSent
        });
      } else {
        setError(data.error);
      }
    } catch {
      setError('An error occurred during signup');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleVerify = async () => {
    if (!verificationData || !verificationCode) return;

    setIsVerifying(true);
    setError('');

    try {
      const response = await fetch('/api/auth/verify-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: verificationData.userId,
          code: verificationCode,
          type: verificationData.type
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store tokens
        localStorage.setItem('sessionToken', data.tokens.sessionToken);
        localStorage.setItem('tradingToken', data.tokens.tradingToken);

        // Redirect to dashboard
        router.push('/app');
      } else {
        setError(data.error);
      }
    } catch {
      setError('An error occurred during verification');
    } finally {
      setIsVerifying(false);
    }
  };

  if (verificationData) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 border border-gray-200 dark:border-gray-700">
          <h1 className="text-3xl font-bold text-center text-black dark:text-white mb-8">
            Verify Your Account
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {verificationData.type === 'email' ? 'Check your email for the verification code.' : 'Scan the QR code below with your authenticator app:'}
          </p>
          {verificationData.type === 'totp' && verificationData.qrCodeUrl && (
            <div className="text-center mb-4">
              <Image
                src={verificationData.qrCodeUrl}
                alt="QR Code"
                width={200}
                height={200}
                className="mx-auto"
              />
            </div>
          )}
          {verificationData.type === 'totp' && verificationData.backupCodes && (
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded mb-4">
              <h3 className="font-medium text-black dark:text-white mb-2">Backup Codes:</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Save these codes in a safe place. You can use them to access your account if you lose your device.</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {verificationData.backupCodes.map((code: string, index: number) => (
                  <div key={index} className="font-mono text-gray-700 dark:text-gray-300">
                    {code}
                  </div>
                ))}
              </div>
            </div>
          )}
          <form onSubmit={(e) => { e.preventDefault(); handleVerify(); }} className="space-y-4">
            <div>
              <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Verification Code
              </label>
              <input
                type="text"
                id="verificationCode"
                name="verificationCode"
                required
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-black dark:text-white"
              />
            </div>

            {verificationData.type === 'app' && verificationData.backupCodes && (
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded mb-4">
                <h3 className="font-medium text-black dark:text-white mb-2">Backup Codes:</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {verificationData.backupCodes.map((code: string, index: number) => (
                    <div key={index} className="font-mono text-gray-700 dark:text-gray-300">
                      {code}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="text-red-600 dark:text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-md transition duration-200"
            >
              {isVerifying ? 'Verifying...' : 'Verify Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Already verified?{' '}
              <a href="/login" className="text-blue-600 hover:text-blue-500 font-medium">
                Login
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black p-4">
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 border border-gray-200 dark:border-gray-700">
        <h1 className="text-3xl font-bold text-center text-black dark:text-white mb-8">
          Create StockExchange Account
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                First Name *
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                required
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-black dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Last Name *
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                required
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-black dark:text-white"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-black dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password *
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-black dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirm Password *
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-black dark:text-white"
              />
            </div>
          </div>

          <div>
            <label htmlFor="twoFactorType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Two-Factor Authentication Method *
            </label>
            <select
              id="twoFactorType"
              name="twoFactorType"
              required
              value={formData.twoFactorType}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-black dark:text-white"
            >
              <option value="email">Email Passcode</option>
              <option value="totp">Authenticator App (TOTP)</option>
            </select>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-black dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date of Birth
              </label>
              <input
                type="date"
                id="dateOfBirth"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-black dark:text-white"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Address
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-black dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                City
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-black dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                State
              </label>
              <input
                type="text"
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-black dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ZIP Code
              </label>
              <input
                type="text"
                id="zipCode"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-black dark:text-white"
              />
            </div>
          </div>

          {/* Financial Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="annualIncome" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Annual Income
              </label>
              <input
                type="number"
                id="annualIncome"
                name="annualIncome"
                value={formData.annualIncome}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-black dark:text-white"
                placeholder="50000"
              />
            </div>
            <div>
              <label htmlFor="netWorth" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Net Worth
              </label>
              <input
                type="number"
                id="netWorth"
                name="netWorth"
                value={formData.netWorth}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-black dark:text-white"
                placeholder="100000"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="investmentExperience" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Investment Experience
              </label>
              <select
                id="investmentExperience"
                name="investmentExperience"
                value={formData.investmentExperience}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-black dark:text-white"
              >
                <option value="">Select experience level</option>
                <option value="none">None</option>
                <option value="limited">Limited</option>
                <option value="moderate">Moderate</option>
                <option value="extensive">Extensive</option>
              </select>
            </div>
            <div>
              <label htmlFor="riskTolerance" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Risk Tolerance
              </label>
              <select
                id="riskTolerance"
                name="riskTolerance"
                value={formData.riskTolerance}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-black dark:text-white"
              >
                <option value="conservative">Conservative</option>
                <option value="moderate">Moderate</option>
                <option value="aggressive">Aggressive</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="text-red-600 dark:text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-md transition duration-200"
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <a href="/login" className="text-blue-600 hover:text-blue-500 font-medium">
              Login
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
