import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { FiUser, FiHome, FiArrowRight, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

interface HrCompany {
  id: number;
  name: string;
  domain?: string;
  is_primary?: boolean;
}

interface HrUser {
  id: number;
  name: string;
  email?: string;
  companies: HrCompany[];
}

interface CompanyOption {
  id: number;
  name: string;
  domain?: string;
}

const AssignHrToCompany: React.FC = () => {
  const navigate = useNavigate();
  const [hrUsers, setHrUsers] = useState<HrUser[]>([]);
  const [selectedHrId, setSelectedHrId] = useState<string>('');
  const [availableCompanies, setAvailableCompanies] = useState<CompanyOption[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchHrUsers = async () => {
      try {
        setLoading(true);
        const response = await api.get('/companies/hr-users');
        setHrUsers(response.data.hrUsers || []);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load HR users');
      } finally {
        setLoading(false);
      }
    };

    fetchHrUsers();
  }, []);

  const handleSelectHr = async (hrId: string) => {
    setSelectedHrId(hrId);
    setSelectedCompanyId('');
    setAvailableCompanies([]);
    setSuccessMessage('');
    setError('');

    if (!hrId) return;

    try {
      setLoadingCompanies(true);
      const response = await api.get(`/companies/available-companies-for-hr/${hrId}`);
      setAvailableCompanies(response.data.companies || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load companies for selected HR');
    } finally {
      setLoadingCompanies(false);
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHrId || !selectedCompanyId) return;

    try {
      setSaving(true);
      setError('');
      setSuccessMessage('');

      await api.post('/companies/assign-hr-to-company', {
        userId: parseInt(selectedHrId, 10),
        companyId: parseInt(selectedCompanyId, 10),
      });

      setSuccessMessage('HR user was successfully assigned to the selected company.');

      // Refresh available companies for this HR so the newly assigned company disappears from the list
      const response = await api.get(`/companies/available-companies-for-hr/${selectedHrId}`);
      setAvailableCompanies(response.data.companies || []);
      setSelectedCompanyId('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to assign HR to company');
    } finally {
      setSaving(false);
    }
  };

  const selectedHr = hrUsers.find((hr) => hr.id === parseInt(selectedHrId || '0', 10));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assign HR to Additional Company</h1>
          <p className="text-gray-600">
            Select an HR user, then choose another company to associate them with. Existing companies are excluded automatically.
          </p>
        </div>
        <button
          onClick={() => navigate('/super-admin/dashboard')}
          className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Back to Dashboard
        </button>
      </div>

      {(error || successMessage) && (
        <div className="space-y-3">
          {error && (
            <div className="flex items-start space-x-2 p-3 rounded-md bg-red-50 text-red-700 border border-red-200 text-sm">
              <FiAlertCircle className="mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {successMessage && (
            <div className="flex items-start space-x-2 p-3 rounded-md bg-green-50 text-green-700 border border-green-200 text-sm">
              <FiCheckCircle className="mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Step 1: Select HR */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold text-sm">
              1
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Select HR User</h2>
              <p className="text-xs text-gray-500">Choose the HR you want to add to another company.</p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">HR User</label>
            <select
              value={selectedHrId}
              onChange={(e) => handleSelectHr(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">Select HR user...</option>
              {hrUsers.map((hr) => (
                <option key={hr.id} value={hr.id}>
                  {hr.name} {hr.email ? `(${hr.email})` : ''}
                </option>
              ))}
            </select>

            {selectedHr && (
              <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <FiUser className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{selectedHr.name}</p>
                    {selectedHr.email && <p className="text-xs text-gray-500">{selectedHr.email}</p>}
                  </div>
                </div>
                <p className="text-xs font-medium text-gray-600 mb-1">Current Company Associations</p>
                {selectedHr.companies && selectedHr.companies.length > 0 ? (
                  <ul className="space-y-1 text-xs text-gray-700">
                    {selectedHr.companies.map((c) => (
                      <li key={c.id} className="flex items-center space-x-2">
                        <FiHome className="text-gray-400" />
                        <span>
                          {c.name}
                          {c.is_primary && <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">Primary</span>}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-gray-500">No company associations found.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Arrow / Step indicator for large screens */}
        <div className="hidden lg:flex items-center justify-center">
          <FiArrowRight className="text-3xl text-gray-400" />
        </div>

        {/* Step 2: Select Company */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold text-sm">
              2
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Select Additional Company</h2>
              <p className="text-xs text-gray-500">
                Only companies not already linked to the selected HR will appear here.
              </p>
            </div>
          </div>

          {!selectedHrId ? (
            <p className="text-sm text-gray-500">
              First select an HR user to see companies that can be assigned.
            </p>
          ) : loadingCompanies ? (
            <p className="text-sm text-gray-500">Loading available companies...</p>
          ) : availableCompanies.length === 0 ? (
            <p className="text-sm text-gray-500">
              This HR user is already associated with all existing companies.
            </p>
          ) : (
            <form onSubmit={handleAssign} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <select
                  value={selectedCompanyId}
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  required
                >
                  <option value="">Select company...</option>
                  {availableCompanies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name} {company.domain ? `(${company.domain})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedHrId('');
                    setAvailableCompanies([]);
                    setSelectedCompanyId('');
                    setError('');
                    setSuccessMessage('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  Reset
                </button>
                <button
                  type="submit"
                  disabled={saving || !selectedCompanyId}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50"
                >
                  {saving ? 'Assigning...' : 'Assign HR to Company'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignHrToCompany;


