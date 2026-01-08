import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { FiPlus, FiEdit2, FiTrash2, FiCopy, FiFileText, FiArrowLeft } from 'react-icons/fi';

interface KPITemplate {
  id: number;
  template_name: string;
  description: string;
  period: string;
  item_count: number;
  created_at: string;
}

const KPITemplates: React.FC = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<KPITemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/kpi-templates');
      setTemplates(response.data.templates || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete template "${name}"?`)) {
      return;
    }

    try {
      await api.delete(`/kpi-templates/${id}`);
      alert('Template deleted successfully!');
      fetchTemplates();
    } catch (error: any) {
      console.error('Error deleting template:', error);
      alert(error.response?.data?.error || 'Failed to delete template');
    }
  };

  const handleUseTemplate = (id: number) => {
    navigate(`/manager/kpi-templates/${id}/apply`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading templates...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/manager/dashboard')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
          >
            <FiArrowLeft className="text-xl" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">KPI Templates</h1>
            <p className="text-sm text-gray-600 mt-1">
              Create reusable KPI templates to quickly assign KPIs to multiple employees
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/manager/kpi-templates/create')}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          <FiPlus className="text-lg" />
          <span>Create Template</span>
        </button>
      </div>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <FiFileText className="mx-auto text-5xl text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Templates Yet</h3>
          <p className="text-gray-600 mb-6">
            Create your first KPI template to quickly assign KPIs to multiple employees
          </p>
          <button
            onClick={() => navigate('/manager/kpi-templates/create')}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <FiPlus className="text-lg" />
            <span>Create Your First Template</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {template.template_name}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {template.description || 'No description'}
                  </p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Period:</span>
                  <span className="font-medium text-gray-900 capitalize">
                    {template.period}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">KPI Items:</span>
                  <span className="font-medium text-gray-900">
                    {template.item_count} item{template.item_count !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Created:</span>
                  <span className="font-medium text-gray-900">
                    {new Date(template.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleUseTemplate(template.id)}
                  className="flex items-center justify-center space-x-1 px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700"
                >
                  <FiCopy className="text-sm" />
                  <span>Use Template</span>
                </button>
                <button
                  onClick={() => navigate(`/manager/kpi-templates/${template.id}/edit`)}
                  className="flex items-center justify-center space-x-1 px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200"
                >
                  <FiEdit2 className="text-sm" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(template.id, template.template_name)}
                  className="col-span-2 flex items-center justify-center space-x-1 px-3 py-2 bg-red-50 text-red-600 text-sm rounded-lg hover:bg-red-100"
                >
                  <FiTrash2 className="text-sm" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default KPITemplates;
