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
    handleCopy,
    handleCreateTemplate,
    handleEditTemplate,
    handleBack,
    handleConfirm,
    handleCancel,
  } = useManagerKPITemplates();

  

  const handleUseTemplate = (templateId: number) => {
    const targetPath = `/manager/kpi-setting/template/${templateId}`;
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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
      </div>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <FiFileText className="text-4xl text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Templates Yet</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
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
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200"
            >
              {/* Card Header */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate" title={template.template_name}>
                  {template.template_name}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-2 min-h-[2.5rem]">
                  {template.description || 'No description'}
                </p>
              </div>

              {/* Card Body */}
              <div className="px-6 py-4">
                <div className="space-y-3 mb-5">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600 font-medium">Period</span>
                    <span className="text-sm font-semibold text-gray-900 capitalize bg-gray-100 px-3 py-1 rounded">
                      {template.period}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600 font-medium">KPI Items</span>
                    <span className="text-sm font-semibold text-gray-900 bg-blue-50 text-blue-700 px-3 py-1 rounded">
                      {template.item_count} item{template.item_count !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-600 font-medium">Created</span>
                    <span className="text-xs text-gray-500">
                      {new Date(template.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Button
                    onClick={() => handleUseTemplate(template.id)}
                    variant="primary"
                    icon={FiCopy}
                    size="sm"
                    fullWidth
                  >
                    Use Template
                  </Button>
                  <div className="grid grid-cols-3 gap-2">
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
                      onClick={() => handleCopy(template.id, template.template_name)}
                      variant="secondary"
                      icon={FiCopy}
                      size="sm"
                      fullWidth
                    >
                      Copy
                    </Button>
                    <Button
                      onClick={() => handleDelete(template.id, template.template_name)}
                      variant="danger"
                      icon={FiTrash2}
                      size="sm"
                      fullWidth
                    >
                      Delete
                    </Button>
                  </div>
                </div>
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
