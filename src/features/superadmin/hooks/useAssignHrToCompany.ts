import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { hrCompanyService, HrUser, CompanyOption } from '../services/hrCompanyService';

export const useAssignHrToCompany = () => {
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
    fetchHrUsers();
  }, []);

  const fetchHrUsers = async () => {
    try {
      console.log('[useAssignHrToCompany] Fetching HR users...');
      setLoading(true);
      const data = await hrCompanyService.fetchHrUsers();
      console.log('[useAssignHrToCompany] HR users fetched:', data.length);
      setHrUsers(data);
    } catch (err: any) {
      console.error('[useAssignHrToCompany] Error fetching HR users:', err);
      setError(err.response?.data?.error || 'Failed to load HR users');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectHr = async (hrId: string) => {
    setSelectedHrId(hrId);
    setSelectedCompanyId('');
    setAvailableCompanies([]);
    setSuccessMessage('');
    setError('');

    if (!hrId) return;

    try {
      setLoadingCompanies(true);
      const companies = await hrCompanyService.fetchAvailableCompaniesForHr(hrId);
      setAvailableCompanies(companies);
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

      await hrCompanyService.assignHrToCompany({
        userId: parseInt(selectedHrId, 10),
        companyId: parseInt(selectedCompanyId, 10),
      });

      setSuccessMessage('HR user was successfully assigned to the selected company.');

      // Refresh available companies
      const companies = await hrCompanyService.fetchAvailableCompaniesForHr(selectedHrId);
      setAvailableCompanies(companies);
      setSelectedCompanyId('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to assign HR to company');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSelectedHrId('');
    setAvailableCompanies([]);
    setSelectedCompanyId('');
    setError('');
    setSuccessMessage('');
  };

  const handleBack = () => {
    navigate('/super-admin/dashboard');
  };

  const selectedHr = hrUsers.find((hr) => hr.id === parseInt(selectedHrId || '0', 10));

  return {
    hrUsers,
    selectedHrId,
    availableCompanies,
    selectedCompanyId,
    loading,
    loadingCompanies,
    saving,
    error,
    successMessage,
    selectedHr,
    setSelectedCompanyId,
    handleSelectHr,
    handleAssign,
    handleReset,
    handleBack,
  };
};