import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const [loginMethod, setLoginMethod] = useState<'payroll' | 'email'>('payroll');
  const [payrollNumber, setPayrollNumber] = useState('');
  const [] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginWithEmail } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let result;
      if (loginMethod === 'email') {
        if (!email || !password) {
          setError('Email and password are required');
          setLoading(false);
          return;
        }
        result = await loginWithEmail(email, password);
      } else {
        if (!payrollNumber || !password) {
          setError('Payroll number and password are required');
          setLoading(false);
          return;
        }
        result = await login(payrollNumber, password);
      }
      
      // Get user role for navigation
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // Check if password change is required for any user
      if (result.passwordChangeRequired) {
        // Store flag in localStorage
        localStorage.setItem('passwordChangeRequired', 'true');
        
        // Navigate to appropriate dashboard with password change flag
        if (user.role === 'super_admin') {
          navigate('/super-admin/dashboard?passwordChangeRequired=true');
        } else if (user.role === 'manager') {
          navigate('/manager/dashboard?passwordChangeRequired=true');
        } else if (user.role === 'employee') {
          navigate('/employee/dashboard?passwordChangeRequired=true');
        } else if (user.role === 'hr') {
          navigate('/hr/dashboard?passwordChangeRequired=true');
        }
        return;
      }
      
      if (user.role === 'super_admin') {
        navigate('/super-admin/dashboard');
        return;
      }
      
      // If user has multiple companies, redirect to company selection
      if (result.hasMultipleCompanies) {
        navigate('/select-company');
        return;
      }
      
      if (user.role === 'manager') {
        navigate('/manager/dashboard');
      } else if (user.role === 'employee') {
        navigate('/employee/dashboard');
      } else if (user.role === 'hr') {
        navigate('/hr/dashboard');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
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
              setError('');
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
              setError('');
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
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {loginMethod === 'email' ? (
            <>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter your password"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label htmlFor="payrollNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Payroll Number *
                </label>
                <input
                  id="payrollNumber"
                  type="text"
                  value={payrollNumber}
                  onChange={(e) => setPayrollNumber(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter your payroll number"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter your password"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white py-2.5 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        
      </div>
    </div>
  );
};

export default Login;

