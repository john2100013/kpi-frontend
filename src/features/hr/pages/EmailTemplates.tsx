import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { useToast } from '../../../context/ToastContext';
import { useConfirm } from '../../../hooks/useConfirm';
import { FiArrowLeft, FiSave, FiTrash2, FiEdit, FiMail, FiCheck, FiX, FiBold, FiItalic, FiUnderline, FiLink, FiCode } from 'react-icons/fi';

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
  const toast = useToast();
  const confirm = useConfirm();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editorMode, setEditorMode] = useState<'visual' | 'html'>('visual');
  const [showVariableHelper, setShowVariableHelper] = useState(false);
  const htmlTextareaRef = useRef<HTMLTextAreaElement>(null);
  const visualEditorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  // Sync visual editor content when template changes
  useEffect(() => {
    if (showEditor && editingTemplate && editorMode === 'visual' && visualEditorRef.current) {
      visualEditorRef.current.innerHTML = editingTemplate.body_html || '<p>Hello {{recipientName}},</p><p>Your email content here...</p>';
    }
  }, [editingTemplate?.body_html, editorMode, showEditor]);

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/email-templates');
      setTemplates(response.data.templates || []);
    } catch (error) {
      toast.error('Failed to fetch email templates. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  const handleCreate = () => {
    setEditingTemplate({
      template_type: templateTypes[0].value,
      subject: '',
      body_html: '<p>Hello {{recipientName}},</p><p>Your email content here...</p>',
      body_text: '',
      is_active: true,
    });
    setEditorMode('visual');
    setShowEditor(true);
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate({ ...template });
    setEditorMode('visual');
    setShowEditor(true);
  };


  const handleDelete = async (id: number) => {
    const confirmed = await confirm.confirm({
      title: 'Delete Template',
      message: 'Are you sure you want to delete this template?',
      variant: 'danger'
    });
    
    if (!confirmed) return;

    try {
      await api.delete(`/email-templates/${id}`);
      await fetchTemplates();
      toast.success('Template deleted successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error deleting template');
    }
  };

  const getTemplateLabel = (type: string) => {
    return templateTypes.find(t => t.value === type)?.label || type;
  };

  // Available variables for templates
  const availableVariables = [
    { name: 'employeeName', description: 'Employee\'s full name' },
    { name: 'employeeEmail', description: 'Employee\'s email address' },
    { name: 'employeePayroll', description: 'Employee\'s payroll number' },
    { name: 'managerName', description: 'Manager\'s full name' },
    { name: 'managerEmail', description: 'Manager\'s email address' },
    { name: 'recipientName', description: 'Name of email recipient' },
    { name: 'meetingDate', description: 'KPI setting meeting date' },
    { name: 'reminderType', description: 'Type of reminder (e.g., "2 weeks")' },
    { name: 'reminderLabel', description: 'Reminder label (e.g., "2 weeks before")' },
    { name: 'periodEndDate', description: 'KPI period end date' },
    { name: 'periodLabel', description: 'Period label (e.g., "Q1 2026 Quarterly")' },
    { name: 'daysPastEndDate', description: 'Days past period end date' },
    { name: 'kpiPeriod', description: 'KPI period type (Quarterly/Yearly)' },
    { name: 'kpiQuarter', description: 'KPI quarter (Q1, Q2, Q3, Q4)' },
    { name: 'kpiYear', description: 'KPI year' },
    { name: 'link', description: 'Link to view KPI details' },
    { name: 'dueDate', description: 'Review due date' },
  ];

  const insertVariable = (variableName: string) => {
    if (editorMode === 'html' && htmlTextareaRef.current) {
      const textarea = htmlTextareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const before = text.substring(0, start);
      const after = text.substring(end);
      const variable = `{{${variableName}}}`;
      textarea.value = before + variable + after;
      textarea.focus();
      textarea.setSelectionRange(start + variable.length, start + variable.length);
      setEditingTemplate({
        ...editingTemplate!,
        body_html: textarea.value,
      });
    } else if (editorMode === 'visual' && visualEditorRef.current) {
      const editor = visualEditorRef.current;
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        const textNode = document.createTextNode(`{{${variableName}}}`);
        range.insertNode(textNode);
        range.setStartAfter(textNode);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        editor.innerHTML += `{{${variableName}}}`;
      }
      updateVisualEditorContent();
    }
    setShowVariableHelper(false);
  };

  const updateVisualEditorContent = () => {
    if (visualEditorRef.current && editingTemplate) {
      setEditingTemplate({
        ...editingTemplate,
        body_html: visualEditorRef.current.innerHTML,
      });
    }
  };

  const formatText = (command: string, value?: string) => {
    if (editorMode === 'visual' && visualEditorRef.current) {
      document.execCommand(command, false, value);
      updateVisualEditorContent();
    }
  };

  const convertHtmlToText = (html: string): string => {
    // Simple HTML to text converter
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const handleModeSwitch = () => {
    if (editorMode === 'visual' && visualEditorRef.current && editingTemplate) {
      // Switching from visual to HTML - get HTML content
      setEditingTemplate({
        ...editingTemplate,
        body_html: visualEditorRef.current.innerHTML,
      });
      setEditorMode('html');
    } else if (editorMode === 'html' && htmlTextareaRef.current && editingTemplate) {
      // Switching from HTML to visual - set HTML content
      if (visualEditorRef.current) {
        visualEditorRef.current.innerHTML = editingTemplate.body_html;
      }
      setEditorMode('visual');
    }
  };

  const handleSave = async () => {
    if (!editingTemplate) return;

    // Get final HTML content based on current mode
    let finalHtml = editingTemplate.body_html;
    if (editorMode === 'visual' && visualEditorRef.current) {
      finalHtml = visualEditorRef.current.innerHTML;
    }

    if (!editingTemplate.subject || !finalHtml) {
      toast.warning('Subject and HTML body are required');
      return;
    }

    // Auto-generate text body from HTML if not provided
    let finalTextBody = editingTemplate.body_text;
    if (!finalTextBody || finalTextBody.trim() === '') {
      finalTextBody = convertHtmlToText(finalHtml);
    }

    setSaving(true);
    try {
      await api.post('/email-templates', {
        ...editingTemplate,
        body_html: finalHtml,
        body_text: finalTextBody,
      });
      await fetchTemplates();
      setShowEditor(false);
      setEditingTemplate(null);
      setEditorMode('visual');
      toast.success('Template saved successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error saving template');
    } finally {
      setSaving(false);
    }
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

          {/* Email Body Editor */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Email Body *
              </label>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowVariableHelper(!showVariableHelper)}
                  className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
                >
                  <FiCode className="inline mr-1" />
                  Insert Variable
                </button>
                <button
                  type="button"
                  onClick={handleModeSwitch}
                  className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  {editorMode === 'visual' ? 'Switch to HTML' : 'Switch to Visual'}
                </button>
              </div>
            </div>

            {/* Variable Helper */}
            {showVariableHelper && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-2">Available Variables:</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {availableVariables.map((variable) => (
                    <button
                      key={variable.name}
                      type="button"
                      onClick={() => insertVariable(variable.name)}
                      className="text-left px-3 py-2 bg-white border border-blue-200 rounded hover:bg-blue-100 text-xs"
                      title={variable.description}
                    >
                      <code className="text-purple-600">{`{{${variable.name}}}`}</code>
                      <p className="text-gray-600 text-xs mt-1">{variable.description}</p>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-blue-700 mt-2">
                  💡 Tip: Click any variable above to insert it into your template
                </p>
              </div>
            )}

            {/* Visual Editor Mode */}
            {editorMode === 'visual' ? (
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                {/* Toolbar */}
                <div className="bg-gray-50 border-b border-gray-300 p-2 flex items-center space-x-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => formatText('bold')}
                    className="p-2 hover:bg-gray-200 rounded"
                    title="Bold"
                  >
                    <FiBold />
                  </button>
                  <button
                    type="button"
                    onClick={() => formatText('italic')}
                    className="p-2 hover:bg-gray-200 rounded"
                    title="Italic"
                  >
                    <FiItalic />
                  </button>
                  <button
                    type="button"
                    onClick={() => formatText('underline')}
                    className="p-2 hover:bg-gray-200 rounded"
                    title="Underline"
                  >
                    <FiUnderline />
                  </button>
                  <div className="w-px h-6 bg-gray-300 mx-1" />
                  <select
                    onChange={(e) => formatText('formatBlock', e.target.value)}
                    className="px-2 py-1 text-sm border border-gray-300 rounded"
                    title="Heading"
                  >
                    <option value="">Normal</option>
                    <option value="h1">Heading 1</option>
                    <option value="h2">Heading 2</option>
                    <option value="h3">Heading 3</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      const url = prompt('Enter URL:');
                      if (url) formatText('createLink', url);
                    }}
                    className="p-2 hover:bg-gray-200 rounded"
                    title="Insert Link"
                  >
                    <FiLink />
                  </button>
                </div>
                {/* Visual Editor */}
                <div
                  ref={visualEditorRef}
                  contentEditable
                  onInput={updateVisualEditorContent}
                  dangerouslySetInnerHTML={{ __html: editingTemplate.body_html }}
                  className="min-h-[300px] p-4 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  style={{ 
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    color: '#374151'
                  }}
                />
              </div>
            ) : (
              /* HTML Editor Mode */
              <textarea
                ref={htmlTextareaRef}
                value={editingTemplate.body_html}
                onChange={(e) => setEditingTemplate({ ...editingTemplate, body_html: e.target.value })}
                placeholder="Enter HTML code here (use {{variableName}} for dynamic content)"
                rows={15}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono text-sm"
              />
            )}

            <div className="mt-2 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">
                <strong>HTML vs Text Body:</strong>
              </p>
              <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
                <li><strong>HTML Body:</strong> Rich formatting (colors, links, styling) - for modern email clients</li>
                <li><strong>Text Body:</strong> Plain text fallback - auto-generated from HTML if not provided</li>
                <li>Email clients will use HTML if supported, otherwise fall back to text</li>
              </ul>
            </div>
          </div>

          {/* Text Body (Optional, Auto-generated) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Text Body (Optional - Auto-generated)
            </label>
            <textarea
              value={editingTemplate.body_text || convertHtmlToText(editingTemplate.body_html)}
              onChange={(e) => setEditingTemplate({ ...editingTemplate, body_text: e.target.value })}
              placeholder="Plain text version (auto-generated from HTML if left empty)"
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-gray-50"
              readOnly={!editingTemplate.body_text || editingTemplate.body_text === convertHtmlToText(editingTemplate.body_html)}
            />
            <p className="text-xs text-gray-500 mt-1">
              💡 This will be automatically generated from your HTML body if you don't enter anything. You can customize it if needed.
            </p>
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

