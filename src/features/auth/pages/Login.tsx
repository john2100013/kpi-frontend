import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { login as loginAction, loginWithEmail as loginWithEmailAction, clearError } from '../../../store/slices/authSlice';
import { Button, Input, Card } from '../../../components/common';
import { isSuperAdmin, isManager, isHR, isEmployee } from '../../../utils/roleUtils';
import { useAuth } from '../../../context/AuthContext';

const Login: React.FC = () => {
  const [loginMethod, setLoginMethod] = useState<'payroll' | 'email'>('payroll');
  const [payrollNumber, setPayrollNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { setUser: setAuthContextUser } = useAuth();
  const { user, isLoading, error, hasMultipleCompanies, passwordChangeRequired } = useAppSelector((state) => state.auth);

  // Clear errors on component mount
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Handle navigation after successful login
  useEffect(() => {
    if (user && !isLoading) {
      // Sync Redux user to AuthContext
      console.log('[Login] Syncing Redux user to AuthContext:', user);
      setAuthContextUser(user);
      
      // Determine dashboard path based on role_id
      let dashboardPath = '/login'; // Default to login page to prevent loops
      if (isSuperAdmin(user)) {
        dashboardPath = '/super-admin/dashboard';
      } else if (isManager(user)) {
        dashboardPath = '/manager/dashboard';
      } else if (isEmployee(user)) {
        dashboardPath = '/employee/dashboard';
      } else if (isHR(user)) {
        dashboardPath = '/hr/dashboard';
      }

      // Handle password change requirement
      if (passwordChangeRequired) {
        navigate(`${dashboardPath}?passwordChangeRequired=true`);
        return;
      }

      // Handle multiple companies (except super admin who always sees company selection implicitly)
      if (hasMultipleCompanies && !isSuperAdmin(user)) {
        navigate('/select-company');
        return;
      }
      
      // Navigate to the appropriate dashboard
      navigate(dashboardPath);
    }
  }, [user, isLoading, hasMultipleCompanies, passwordChangeRequired, navigate, setAuthContextUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    dispatch(clearError());

    try {
      if (loginMethod === 'email') {
        if (!email || !password) {
          setLocalError('Email and password are required');
          return;
        }
        await dispatch(loginWithEmailAction({ email, password })).unwrap();
      } else {
        if (!payrollNumber || !password) {
          setLocalError('Payroll number and password are required');
          return;
        }
        await dispatch(loginAction({ payrollNumber, password })).unwrap();
      }
    } catch (err: any) {
      setLocalError(err || 'Login failed. Please check your credentials.');
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="max-w-md w-full" padding="lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 rounded-2xl mb-4 overflow-hidden">
            <img src="/ICTA.jpeg" alt="ICTA Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">KPI Manager</h1>
          <p className="text-gray-600">Performance Management System</p>
        </div>

        {/* Login Method Toggle */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => {
              setLoginMethod('payroll');
              setLocalError('');
              dispatch(clearError());
            }}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              loginMethod === 'payroll'
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Payroll Login
          </button>
          <button
            type="button"
            onClick={() => {
              setLoginMethod('email');
              setLocalError('');
              dispatch(clearError());
            }}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              loginMethod === 'email'
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Email Login
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {displayError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {displayError}
            </div>
          )}

          {loginMethod === 'email' ? (
            <>
              <Input
                name="email"
                type="email"
                label="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                autoComplete="email"
              />

              <div className="relative">
                <Input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  label="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
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
            </>
          ) : (
            <>
              <Input
                name="payrollNumber"
                type="text"
                label="Payroll Number"
                value={payrollNumber}
                onChange={(e) => setPayrollNumber(e.target.value)}
                placeholder="Enter your payroll number"
                required
                autoComplete="username"
              />

              <div className="relative">
                <Input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  label="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
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
            </>
          )}

          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default Login;

