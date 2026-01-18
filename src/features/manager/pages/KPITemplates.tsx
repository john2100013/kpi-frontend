import React from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiCopy, FiFileText, FiArrowLeft } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { Button, ConfirmDialog } from '../../../components/common';
import { useManagerKPITemplates } from '../hooks';

const ManagerKPITemplates: React.FC = () => {
  const navigate = useNavigate();
  const {
    templates,
    loading,
    confirmState,
    handleDelete,
    handleCreateTemplate,
    handleEditTemplate,
    handleBack,
    handleConfirm,
    handleCancel,
  } = useManagerKPITemplates();

  console.log('🏗️ [KPITemplates] Component state:', {
    templatesCount: templates.length,
    loading,
  });

  const handleUseTemplate = (templateId: number) => {
    console.log('🚀🚀🚀 [KPITemplates] Use Template clicked!');
    console.log('🚀 [KPITemplates] Template ID:', templateId);
    console.log('🚀 [KPITemplates] Current location:', window.location.pathname);
    const targetPath = `/manager/kpi-setting/template/${templateId}`;
    console.log('🚀 [KPITemplates] Target path:', targetPath);
    console.log('🚀 [KPITemplates] Calling navigate...');
    navigate(targetPath);
    console.log('🚀 [KPITemplates] Navigate called successfully');
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
          <Button
            onClick={handleBack}
            variant="ghost"
            icon={FiArrowLeft}
            className="p-2"
          />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">KPI Templates</h1>
            <p className="text-sm text-gray-600 mt-1">
              Create reusable KPI templates to quickly assign KPIs to multiple employees
            </p>
          </div>
        </div>
        <Button
          onClick={handleCreateTemplate}
          variant="primary"
          icon={FiPlus}
        >
          Create Template
        </Button>
      </div>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <FiFileText className="mx-auto text-5xl text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Templates Yet</h3>
          <p className="text-gray-600 mb-6">
            Create your first KPI template to quickly assign KPIs to multiple employees
          </p>
          <Button
            onClick={handleCreateTemplate}
            variant="primary"
            icon={FiPlus}
            size="lg"
          >
            Create Your First Template
          </Button>
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
                <Button
                  onClick={() => handleUseTemplate(template.id)}
                  variant="primary"
                  icon={FiCopy}
                  size="sm"
                  fullWidth
                >
                  Use Template
                </Button>
                <Button
                  onClick={() => handleEditTemplate(template.id)}
                  variant="secondary"
                  icon={FiEdit2}
                  size="sm"
                  fullWidth
                >
                  Edit
                </Button>
                <Button
                  onClick={() => handleDelete(template.id, template.template_name)}
                  variant="danger"
                  icon={FiTrash2}
                  size="sm"
                  fullWidth
                  className="col-span-2"
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        title={confirmState.title}
        message={confirmState.message}
        variant={confirmState.variant}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
      />
    </div>
  );
};

export default ManagerKPITemplates;
