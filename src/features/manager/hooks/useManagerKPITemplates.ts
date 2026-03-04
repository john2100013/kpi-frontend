/**
 * useManagerKPITemplates
 * 
 * Custom hook for managing KPI Templates list state and logic.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { useToast } from '../../../context/ToastContext';
import { useConfirm } from '../../../hooks/useConfirm';

export interface KPITemplate {
  id: number;
  template_name: string;
  description: string;
  period: string;
  item_count: number;
  created_at: string;
}

interface UseManagerKPITemplatesReturn {
  templates: KPITemplate[];
  loading: boolean;
  confirmState: any;
  handleDelete: (id: number, name: string) => Promise<void>;
  handleCopy: (id: number, name: string) => Promise<void>;
  handleCreateTemplate: () => void;
  handleEditTemplate: (id: number) => void;
  handleBack: () => void;
  handleConfirm: () => void;
  handleCancel: () => void;
}

export const useManagerKPITemplates = (): UseManagerKPITemplatesReturn => {
  const navigate = useNavigate();
  const toast = useToast();
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();
  const [templates, setTemplates] = useState<KPITemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/templates');
      setTemplates(response.data.templates || []);
    } catch (error) {
      toast.error('Server error. Please try reloading or try later.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    const confirmed = await confirm({
      title: 'Delete Template',
      message: `Are you sure you want to delete template "${name}"?`,
      variant: 'danger'
    });
    
    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/templates/${id}`);
      toast.success('Template deleted successfully!');
      fetchTemplates();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete template');
    }
  };

  const handleCopy = async (id: number, name: string) => {
    const confirmed = await confirm({
      title: 'Copy Template',
      message: `Create a copy of template "${name}"?`,
      variant: 'info',
      confirmText: 'Copy',
      cancelText: 'Cancel'
    });
    
    if (!confirmed) {
      return;
    }

    try {
      const response = await api.post(`/templates/${id}/copy`);
      toast.success(`Template copied successfully as "${response.data.template.template_name}"!`);
      fetchTemplates();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to copy template');
    }
  };

  const handleCreateTemplate = () => {
    navigate('/manager/kpi-templates/create');
  };

  const handleEditTemplate = (id: number) => {
    navigate(`/manager/kpi-templates/${id}/edit`);
  };

  const handleBack = () => {
    navigate('/manager/dashboard');
  };

  return {
    templates,
    loading,
    confirmState,
    handleDelete,
    handleCopy,
    handleCreateTemplate,
    handleEditTemplate,
    handleBack,
    handleConfirm,
    handleCancel,
  };
};
