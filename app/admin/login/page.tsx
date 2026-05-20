'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SF_STYLES } from '@/src/lib/constants/styles';

/**
 * Admin Login Page with 2FA (OTP)
 * Steps:
 * 1. Email + Password
 * 2. OTP Verification
 */
export default function AdminLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const getErrorMessage = (err: unknown): string => {
    if (err instanceof Error) return err.message;
    if (typeof err === 'string') return err;
    return 'An unexpected error occurred';
  };

  // Step 1: Initial Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      if (data.mfaRequired) {
        setStep(2);
      } else if (data.token) {
        // Direct login for default admin (no MFA)
        localStorage.setItem('adminToken', data.token);
        router.push('/admin/dashboard');
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'OTP verification failed');
      }

      // Store token (in production use secure cookies)
      localStorage.setItem('adminToken', data.token);
      
      // Redirect to dashboard
      router.push('/admin/dashboard');
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F3F3F3] p-4">
      <div className="w-full max-w-sm">
        {/* Branding */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-[#0176D3]">VC4S Starter Template</h1>
          <p className="text-sm text-[#444444] mt-1">Backend management system</p>
        </div>

        {/* Login Card */}
        <div className={SF_STYLES.card.base}>
          <h2 className="text-lg font-semibold mb-6 text-[#080707]">
            {step === 1 ? 'Sign in' : 'Verify your identity'}
          </h2>

          {error && (
            <div className="mb-4 p-3 text-sm bg-red-50 text-red-700 border-l-4 border-red-700">
              {error}
            </div>
          )}

          {step === 1 ? (
            /* Password Login Form */
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-[#444444]">Email / Username</label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={SF_STYLES.input.base}
                  placeholder="admin@vc4s.com or admin"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-[#444444]">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={SF_STYLES.input.base}
                  placeholder="Password"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full ${SF_STYLES.button.primary} ${loading ? 'opacity-50' : ''}`}
              >
                {loading ? 'Processing...' : 'Next'}
              </button>
            </form>
          ) : (
            /* OTP Verification Form */
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <p className="text-sm text-[#444444] mb-2">
                We&apos;ve sent a 6-digit verification code to <strong>{email}</strong>.
              </p>
              <div>
                <label className="block text-xs font-semibold mb-1 text-[#444444]">Verification Code</label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className={`${SF_STYLES.input.base} text-center tracking-[0.5em] text-xl font-bold`}
                  placeholder="000000"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full ${SF_STYLES.button.primary} ${loading ? 'opacity-50' : ''}`}
              >
                {loading ? 'Verifying...' : 'Sign in'}
              </button>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-xs text-[#0176D3] hover:underline text-center mt-2"
              >
                Back to login
              </button>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-6 text-center">
          <p className="text-[10px] text-[#444444]">
            &copy; {new Date().getFullYear()} VC4S Starter Template. Authorized access only.
          </p>
        </div>
      </div>
    </div>
  );
}

