import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../../context/ToastContext';
import { companyService, Company, CompanyFormData } from '../services/companyService';

export const useCompanyManagement = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState<CompanyFormData>({
    name: '',
    domain: '',
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      console.log('[CompanyManagement] Fetching companies...');
      const data = await companyService.fetchCompanies();
      console.log('[CompanyManagement] Companies fetched successfully:', data);
      setCompanies(data);
      if (data.length === 0) {
        console.warn('[CompanyManagement] No companies returned from API');
      }
    } catch (error: any) {
      console.error('[CompanyManagement] Error fetching companies:', error);
      const message = error.response?.data?.error || 'Failed to fetch companies';
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      domain: company.domain || '',
    });
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleCancel = () => {
    setEditingCompany(null);
    setFormData({ name: '', domain: '' });
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompany) return;

    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const updatedCompany = await companyService.updateCompany(editingCompany.id, formData);
      
      // Update company in list
      setCompanies(prev => prev.map(c => 
        c.id === editingCompany.id ? updatedCompany : c
      ));
      
      const message = 'Company updated successfully!';
      setSuccessMessage(message);
      toast.success(message);
      
      setTimeout(() => {
        handleCancel();
        setSuccessMessage('');
      }, 2000);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to update company';
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate('/super-admin/dashboard');
  };

  return {
    companies,
    loading,
    editingCompany,
    saving,
    successMessage,
    errorMessage,
    formData,
    handleEdit,
    handleCancel,
    handleChange,
    handleSubmit,
    handleBack,
  };
};