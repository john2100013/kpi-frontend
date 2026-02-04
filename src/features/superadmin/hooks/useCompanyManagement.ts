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
  const [selectedLogo, setSelectedLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);

      const data = await companyService.fetchCompanies();

      setCompanies(data);
      if (data.length === 0) {
      }
    } catch (error: any) {
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
    setLogoPreview(company.logo_url || null);
    setSelectedLogo(null);
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleCancel = () => {
    setEditingCompany(null);
    setFormData({ name: '', domain: '' });
    setSelectedLogo(null);
    setLogoPreview(null);
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

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please select a valid image file (JPEG, PNG, GIF, SVG)');
        return;
      }
      
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Logo file size must be less than 5MB');
        return;
      }
      
      setSelectedLogo(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setSelectedLogo(null);
    setLogoPreview(editingCompany?.logo_url || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompany) return;

    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const updatedCompany = await companyService.updateCompany(
        editingCompany.id, 
        formData, 
        selectedLogo
      );
      
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
    selectedLogo,
    logoPreview,
    handleEdit,
    handleCancel,
    handleChange,
    handleLogoChange,
    handleRemoveLogo,
    handleSubmit,
    handleBack,
  };
};