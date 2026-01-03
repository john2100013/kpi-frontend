import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { FiArrowLeft, FiSave, FiTrash2, FiEdit, FiMail, FiCheck, FiX } from 'react-icons/fi';

interface EmailTemplate {
  id?: number;
  template_type: string;
  subject: string;
  body_html: string;
  body_text?: string;
  is_active: boolean;
}

const templateTypes = [
  { value: 'kpi_setting_reminder', label: 'KPI Setting Reminder' },
  { value: 'kpi_review_reminder', label: 'KPI Review Reminder' },
  { value: 'kpi_assigned', label: 'KPI Assigned' },
  { value: 'kpi_acknowledged', label: 'KPI Acknowledged' },
  { value: 'self_rating_submitted', label: 'Self-Rating Submitted' },
  { value: 'review_completed', label: 'Review Completed' },
];

const EmailTemplates: React.FC = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/email-templates');
      setTemplates(response.data.templates || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate({ ...template });
    setShowEditor(true);
  };

  const handleCreate = () => {
    setEditingTemplate({
      template_type: templateTypes[0].value,
      subject: '',
      body_html: '',
      body_text: '',
      is_active: true,
    });
    setShowEditor(true);
  };

  const handleSave = async () => {
    if (!editingTemplate) return;

    if (!editingTemplate.subject || !editingTemplate.body_html) {
      alert('Subject and HTML body are required');
      return;
    }

    setSaving(true);
    try {
      await api.post('/email-templates', editingTemplate);
      await fetchTemplates();
      setShowEditor(false);
      setEditingTemplate(null);
      alert('Template saved successfully!');
    } catch (error: any) {
      console.error('Error saving template:', error);
      alert(error.response?.data?.error || 'Error saving template');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      await api.delete(`/email-templates/${id}`);
      await fetchTemplates();
      alert('Template deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting template:', error);
      alert(error.response?.data?.error || 'Error deleting template');
    }
  };

  const getTemplateLabel = (type: string) => {
    return templateTypes.find(t => t.value === type)?.label || type;
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <FiArrowLeft className="text-xl" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Email Templates</h1>
            <p className="text-sm text-gray-600 mt-1">Manage email templates for notifications</p>
          </div>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          <FiMail className="text-lg" />
          <span>Create Template</span>
        </button>
      </div>

      {/* Templates List */}
      {!showEditor && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Email Templates ({templates.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {templates.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No email templates found. Create one to get started.
              </div>
            ) : (
              templates.map((template) => (
                <div key={template.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {getTemplateLabel(template.template_type)}
                        </h3>
                        {template.is_active ? (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center space-x-1">
                            <FiCheck className="text-xs" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1 font-medium">Subject: {template.subject}</p>
                      <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                        {template.body_html.replace(/<[^>]*>/g, '').substring(0, 150)}...
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleEdit(template)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Edit"
                      >
                        <FiEdit className="text-lg" />
                      </button>
                      <button
                        onClick={() => template.id && handleDelete(template.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete"
                      >
                        <FiTrash2 className="text-lg" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Editor */}
      {showEditor && editingTemplate && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              {editingTemplate.id ? 'Edit Template' : 'Create Template'}
            </h2>
            <button
              onClick={() => {
                setShowEditor(false);
                setEditingTemplate(null);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <FiX className="text-xl" />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template Type *
            </label>
            <select
              value={editingTemplate.template_type}
              onChange={(e) => setEditingTemplate({ ...editingTemplate, template_type: e.target.value })}
              disabled={!!editingTemplate.id}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              {templateTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Available variables: {'{{employeeName}}'}, {'{{managerName}}'}, {'{{meetingDate}}'}, {'{{link}}'}, {'{{reminderType}}'}, {'{{period}}'}, {'{{dueDate}}'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject *
            </label>
            <input
              type="text"
              value={editingTemplate.subject}
              onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
              placeholder="Email subject line"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              HTML Body *
            </label>
            <textarea
              value={editingTemplate.body_html}
              onChange={(e) => setEditingTemplate({ ...editingTemplate, body_html: e.target.value })}
              placeholder="HTML email body (use {{variableName}} for dynamic content)"
              rows={12}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Use HTML for formatting. Variables will be replaced with actual values when sending.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Text Body (Optional)
            </label>
            <textarea
              value={editingTemplate.body_text || ''}
              onChange={(e) => setEditingTemplate({ ...editingTemplate, body_text: e.target.value })}
              placeholder="Plain text version (optional, will auto-generate from HTML if not provided)"
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={editingTemplate.is_active}
              onChange={(e) => setEditingTemplate({ ...editingTemplate, is_active: e.target.checked })}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
              Active (use this template when sending emails)
            </label>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                setShowEditor(false);
                setEditingTemplate(null);
              }}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center space-x-2"
            >
              <FiSave className="text-lg" />
              <span>{saving ? 'Saving...' : 'Save Template'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailTemplates;

