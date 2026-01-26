import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Card } from '../../../components/common';
import api from '../../../services/api';

type Step = 'request' | 'verify' | 'reset' | 'success';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('request');
  const [identifier, setIdentifier] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailMasked, setEmailMasked] = useState('');
  const [phoneMasked, setPhoneMasked] = useState('');
  
  // OTP Timer state (3 minutes = 180 seconds)
  const [otpTimer, setOtpTimer] = useState(180); // 180 seconds (3 minutes)
  const [canResend, setCanResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  // Format timer as MM:SS
  const formatTimer = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Timer effect for OTP expiry
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (step === 'verify' && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, otpTimer]);

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const response = await api.post('/auth/forgot-password', { identifier });
      
      if (response.data.success) {
        setSuccessMessage(response.data.message);
        setEmailMasked(response.data.data?.email_masked || '');
        setPhoneMasked(response.data.data?.phone_masked || '');
        setStep('verify');
        setOtpTimer(180); // Reset timer to 180 seconds (3 minutes)
        setCanResend(false);
        setOtpCode(''); // Clear any previous OTP
      } else {
        setError(response.data.error || 'Failed to send OTP');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError('');
    setSuccessMessage('');
    setResendLoading(true);

    try {
      const response = await api.post('/auth/resend-otp', { identifier });
      
      if (response.data.success) {
        setSuccessMessage('OTP resent successfully!');
        setEmailMasked(response.data.data?.email_masked || '');
        setPhoneMasked(response.data.data?.phone_masked || '');
        setOtpTimer(180); // Reset timer to 180 seconds (3 minutes)
        setCanResend(false);
        setOtpCode(''); // Clear the OTP input
      } else {
        setError(response.data.error || 'Failed to resend OTP');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'An error occurred. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const response = await api.post('/auth/verify-otp', {
        identifier,
        otp_code: otpCode
      });

      if (response.data.success) {
        setResetToken(response.data.data.reset_token);
        setSuccessMessage('OTP verified successfully!');
        setStep('reset');
      } else {
        setError(response.data.error || 'Invalid OTP code');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to verify OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    // Validate passwords
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/reset-password', {
        reset_token: resetToken,
        new_password: newPassword,
        confirm_password: confirmPassword
      });

      if (response.data.success) {
        setSuccessMessage(response.data.message);
        setStep('success');
      } else {
        setError(response.data.error || 'Failed to reset password');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full space-y-8 p-8">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            {step === 'request' && 'Forgot Password'}
            {step === 'verify' && 'Verify OTP'}
            {step === 'reset' && 'Reset Password'}
            {step === 'success' && 'Success!'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {step === 'request' && 'Enter your email or payroll number to receive an OTP'}
            {step === 'verify' && 'Enter the OTP code sent to your email and phone'}
            {step === 'reset' && 'Enter your new password'}
            {step === 'success' && 'Your password has been reset successfully'}
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 border border-red-200">
            <div className="flex">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="rounded-md bg-green-50 p-4 border border-green-200">
            <div className="flex">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {step === 'request' && (
          <form className="mt-8 space-y-6" onSubmit={handleRequestOTP}>
            <Input
              name="identifier"
              type="text"
              label="Email or Payroll Number"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Enter your email or payroll number"
              required
              autoComplete="username"
            />

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                fullWidth
                onClick={handleBackToLogin}
              >
                Back to Login
              </Button>
              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={loading}
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send OTP'}
              </Button>
            </div>
          </form>
        )}

        {step === 'verify' && (
          <form className="mt-8 space-y-6" onSubmit={handleVerifyOTP}>
            {(emailMasked || phoneMasked) && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <p className="text-sm text-blue-700">
                  OTP sent to:
                  {emailMasked && <span className="block font-medium">📧 {emailMasked}</span>}
                  {phoneMasked && <span className="block font-medium">📱 {phoneMasked}</span>}
                </p>
              </div>
            )}

            {/* OTP Timer Display */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-center">
              {otpTimer > 0 ? (
                <div>
                  <p className="text-sm text-yellow-800 font-medium">
                    ⏱️ OTP expires in: <span className="text-xl font-bold">{formatTimer(otpTimer)}</span>
                  </p>
                  <p className="text-xs text-yellow-600 mt-1">
                    Please enter the code before it expires
                  </p>
                </div>
              ) : (
                <p className="text-sm text-red-700 font-medium">
                  ⚠️ OTP has expired. Please request a new code.
                </p>
              )}
            </div>

            <Input
              name="otp"
              type="text"
              label="OTP Code"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit OTP"
              required
              maxLength={6}
              autoComplete="one-time-code"
            />

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                fullWidth
                onClick={handleResendOTP}
                disabled={!canResend || resendLoading}
                loading={resendLoading}
              >
                {resendLoading ? 'Sending...' : canResend ? 'Resend OTP' : `Resend (${formatTimer(otpTimer)})`}
              </Button>
              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={loading}
                disabled={loading || otpCode.length !== 6 || otpTimer === 0}
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </Button>
            </div>
          </form>
        )}

        {step === 'reset' && (
          <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
            <div className="relative">
              <Input
                name="newPassword"
                type={showPassword ? 'text' : 'password'}
                label="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 8 characters)"
                required
                minLength={8}
                autoComplete="new-password"
              />
              <Button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                variant="ghost"
                size="sm"
                className="absolute right-3 top-[38px] text-gray-500 hover:text-gray-700 p-0"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </Button>
            </div>

            <Input
              name="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              label="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your new password"
              required
              minLength={8}
              autoComplete="new-password"
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              disabled={loading}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>
        )}

        {step === 'success' && (
          <div className="mt-8 space-y-6 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
              <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-gray-700">
              Your password has been successfully reset. You can now login with your new password.
            </p>
            <Button
              variant="primary"
              fullWidth
              onClick={handleBackToLogin}
            >
              Back to Login
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ForgotPassword;
