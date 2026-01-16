import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { FiHome, FiLogOut, FiCheckCircle } from 'react-icons/fi';

const CompanySelection: React.FC = () => {
  const { companies, selectCompany } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Log companies state
  React.useEffect(() => {
    console.log('[CompanySelection] \ud83c\udfe2 Companies from AuthContext:', companies);
    console.log('[CompanySelection] \ud83d\udcca Companies count:', companies?.length || 0);
    console.log('[CompanySelection] \ud83d\udd0d Companies array:', JSON.stringify(companies, null, 2));
  }, [companies]);

  const handleSelectCompany = async (companyId: number) => {
    try {
      setLoading(true);
      setError('');
      await selectCompany(companyId);
      navigate('/hr/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to select company');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <FiHome className="text-3xl text-purple-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Select Company</h1>
          <p className="text-gray-600 text-sm">
            Choose the company you want to manage
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {companies.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No companies available</p>
            <button
              onClick={handleLogout}
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              Back to Login
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available Companies
              </label>
              <div className="space-y-3">
                {companies.map((company) => (
                  <button
                    key={company.id}
                    onClick={() => handleSelectCompany(company.id)}
                    disabled={loading}
                    className="w-full p-4 border border-gray-300 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors text-left disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{company.name}</p>
                        {company.domain && (
                          <p className="text-sm text-gray-500">{company.domain}</p>
                        )}
                      </div>
                      <FiCheckCircle className="text-purple-600" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FiLogOut className="text-lg" />
              <span>Logout</span>
            </button>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            You have access to {companies.length} {companies.length === 1 ? 'company' : 'companies'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CompanySelection;

