'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    twoFactorCode: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorType, setTwoFactorType] = useState<string>('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // Store tokens in localStorage
        localStorage.setItem('sessionToken', data.tokens.sessionToken);
        localStorage.setItem('tradingToken', data.tokens.tradingToken);

        // Redirect to dashboard
        router.push('/app');
      } else {
        if (data.requires2FA) {
          setRequires2FA(true);
          setTwoFactorType(data.twoFactorType);
          if (data.codeSent) {
            setCodeSent(true);
          }
        } else {
          setError(data.error);
        }
      }
    } catch {
      setError('An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSendCode = async () => {
    setIsSendingCode(true);
    setError('');

    try {
      const response = await fetch('/api/auth/send-2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await response.json();

      if (response.ok) {
        setCodeSent(true);
        setError(''); // Clear any previous error
        // Could show a success message here
      } else {
        setError(data.error);
      }
    } catch {
      setError('An error occurred sending the code');
    } finally {
      setIsSendingCode(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 border border-gray-200 dark:border-gray-700">
        <h1 className="text-3xl font-bold text-center text-black dark:text-white mb-8">
          Login to StockExchange
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-black dark:text-white"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-black dark:text-white"
              placeholder="Enter your password"
            />
          </div>

          {requires2FA && (
            <div className="space-y-4">
              {codeSent && (
                <div className="text-green-600 dark:text-green-400 text-sm text-center">
                  A verification code has been sent to your email.
                </div>
              )}
              <div>
                <label htmlFor="twoFactorCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Two-Factor Authentication Code
                </label>
                <input
                  type="text"
                  id="twoFactorCode"
                  name="twoFactorCode"
                  required
                  value={formData.twoFactorCode}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-black dark:text-white"
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                />
              </div>
              {twoFactorType === 'email' && !codeSent && (
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={isSendingCode}
                  className="w-full bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition duration-200"
                >
                  {isSendingCode ? 'Sending...' : 'Send Code to Email'}
                </button>
              )}
            </div>
          )}

          {error && (
            <div className="text-red-600 dark:text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition duration-200"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {requires2FA && codeSent && (
          <div className="mt-4">
            <button
              onClick={handleSendCode}
              disabled={isSendingCode}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-2 px-4 rounded-md transition duration-200"
            >
              {isSendingCode ? 'Sending code...' : 'Resend 2FA Code'}
            </button>
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Don&apos;t have an account?{' '}
            <a href="/signup" className="text-blue-600 hover:text-blue-500 font-medium">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
