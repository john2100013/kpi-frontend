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
      console.log('📥 [useManagerKPITemplates] Fetching templates from /templates');
      const response = await api.get('/templates');
      console.log('✅ [useManagerKPITemplates] Templates received:', response.data.templates?.length || 0);
      setTemplates(response.data.templates || []);
    } catch (error) {
      console.error('❌ [useManagerKPITemplates] Error fetching templates:', error);
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
      console.log('🗑️ [useManagerKPITemplates] Deleting template:', id);
      await api.delete(`/templates/${id}`);
      console.log('✅ [useManagerKPITemplates] Template deleted successfully');
      toast.success('Template deleted successfully!');
      fetchTemplates();
    } catch (error: any) {
      console.error('❌ [useManagerKPITemplates] Error deleting template:', error);
      toast.error(error.response?.data?.error || 'Failed to delete template');
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
    handleCreateTemplate,
    handleEditTemplate,
    handleBack,
    handleConfirm,
    handleCancel,
  };
};
