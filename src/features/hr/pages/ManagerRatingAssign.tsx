import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { useToast } from '../../../context/ToastContext';
import { Button } from '../../../components/common/Button';
import { Card } from '../../../components/common/Card';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { PageContainer } from '../../../components/layout/PageContainer';
import { 
  FiArrowLeft, 
  FiSend, 
  FiAlertCircle,
  FiCheckCircle,
  FiUsers
} from 'react-icons/fi';
import { ManagerRatingNav } from '../components';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { 
  fetchTemplates,
  createAssignment,
  selectTemplates, 
  selectTemplatesLoading 
} from '../../../store/slices/managerRatingSlice';

interface Department {
  id: number;
  name: string;
  employee_count?: number;
}

/**
 * HR Manager Rating Assign Page
 * Form to assign a template to departments
 */
export const ManagerRatingAssign: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const dispatch = useAppDispatch();

  // Redux selectors - use cached templates
  const templates = useAppSelector(selectTemplates);
  const templatesLoading = useAppSelector(selectTemplatesLoading);
  
  // Local state
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<number[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [sendEmail, setSendEmail] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch templates from Redux (will use cache if available)
      dispatch(fetchTemplates(false));
      
      // Fetch departments
      setDepartmentsLoading(true);
      
      const departmentsRes = await api.get('/departments/list');

      
      setDepartments(departmentsRes.data.data.departments || departmentsRes.data.data || []);
      

      // Set default due date to 30 days from now
      const defaultDueDate = new Date();
      defaultDueDate.setDate(defaultDueDate.getDate() + 30);
      setDueDate(defaultDueDate.toISOString().split('T')[0]);
    } catch (error: any) {
      toast.error('Failed to load data');
    } finally {
      setDepartmentsLoading(false);
    }
  };

  const handleDepartmentToggle = (deptId: number) => {
    setSelectedDepartmentIds(prev => {
      if (prev.includes(deptId)) {
        return prev.filter(id => id !== deptId);
      } else {
        return [...prev, deptId];
      }
    });
  };

  const handleSelectAllDepartments = () => {
    if (selectedDepartmentIds.length === departments.length) {
      setSelectedDepartmentIds([]);
    } else {
      setSelectedDepartmentIds(departments.map(d => d.id));
    }
  };

  const validateForm = (): boolean => {
    if (!selectedTemplateId) {
      toast.error('Please select a template');
      return false;
    }

    if (selectedDepartmentIds.length === 0) {
      toast.error('Please select at least one department');
      return false;
    }

    if (!dueDate) {
      toast.error('Please select a due date');
      return false;
    }

    const selectedDate = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      toast.error('Due date cannot be in the past');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      const assignmentData = {
        template_id: selectedTemplateId,
        department_ids: selectedDepartmentIds,
        due_date: dueDate,
        send_email: sendEmail
      };

      const response = await dispatch(createAssignment(assignmentData)).unwrap();
      
      const { totalCreated, totalSkipped } = response;
      
      if (totalSkipped > 0) {
        toast.warning(`Created ${totalCreated} assignment(s). ${totalSkipped} department(s) were skipped (already assigned to this template)`);
      } else {
        toast.success(`Successfully assigned to ${totalCreated} department${totalCreated > 1 ? 's' : ''}`);
      }
      
      navigate('/hr/manager-rating/assignments');
    } catch (error: any) {
      toast.error(error || 'Failed to create assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate('/hr/manager-rating/assignments');
  };

  const loading = templatesLoading || departmentsLoading;

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </PageContainer>
    );
  }

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
  const totalEmployees = departments
    .filter(d => selectedDepartmentIds.includes(d.id))
    .reduce((sum, d) => sum + (d.employee_count || 0), 0);

  return (
    <PageContainer>
      <ManagerRatingNav />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button onClick={handleBack} variant="ghost" icon={FiArrowLeft} className="p-2" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Assign Manager Rating</h1>
              <p className="text-sm text-gray-600 mt-1">
                Assign a rating template to departments
              </p>
            </div>
          </div>
          <Button 
            onClick={handleSubmit} 
            disabled={submitting || !selectedTemplateId || selectedDepartmentIds.length === 0} 
            variant="primary" 
            icon={FiSend} 
            loading={submitting}
          >
            Assign to Departments
          </Button>
        </div>

        {/* Template Selection */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Template</h2>
            
            {templates.length === 0 ? (
              <div className="text-center py-8">
                <FiAlertCircle className="mx-auto text-gray-400 text-4xl mb-3" />
                <p className="text-gray-600 mb-4">No templates available</p>
                <p className="text-sm text-gray-500">Create a template first before assigning</p>
              </div>
            ) : (
              <div className="space-y-3">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => setSelectedTemplateId(template.id)}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedTemplateId === template.id
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
                        : 'border-gray-300 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-gray-900">{template.template_name}</h3>
                          {selectedTemplateId === template.id && (
                            <FiCheckCircle className="text-blue-500" />
                          )}
                        </div>
                        {template.description && (
                          <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                        )}
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>{template.period === 'quarterly' ? `${template.quarter} ${template.year}` : template.year}</span>
                          <span>•</span>
                          <span>{template.section_count || 0} sections</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Department Selection */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Select Departments</h2>
              <Button 
                onClick={handleSelectAllDepartments}
                variant="outline"
                size="sm"
              >
                {selectedDepartmentIds.length === departments.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>

            {departments.length === 0 ? (
              <div className="text-center py-8">
                <FiUsers className="mx-auto text-gray-400 text-4xl mb-3" />
                <p className="text-gray-600">No departments available</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {departments.map((dept) => (
                  <div
                    key={dept.id}
                    onClick={() => handleDepartmentToggle(dept.id)}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedDepartmentIds.includes(dept.id)
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
                        : 'border-gray-300 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedDepartmentIds.includes(dept.id)}
                          onChange={() => handleDepartmentToggle(dept.id)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div>
                          <p className="font-medium text-gray-900">{dept.name}</p>
                          {dept.employee_count !== undefined && (
                            <p className="text-xs text-gray-500">{dept.employee_count} employees</p>
                          )}
                        </div>
                      </div>
                      {selectedDepartmentIds.includes(dept.id) && (
                        <FiCheckCircle className="text-blue-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Due Date & Settings */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Assignment Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date *
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Employees must submit their ratings by this date
                </p>
              </div>

              <div>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendEmail}
                    onChange={(e) => setSendEmail(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      Send email notifications
                    </span>
                    <p className="text-xs text-gray-600">
                      Notify employees when the assignment is created
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </Card>

        {/* Summary */}
        {selectedTemplateId && selectedDepartmentIds.length > 0 && (
          <Card>
            <div className="p-6">
              <div className="flex items-start space-x-3">
                <FiAlertCircle className="text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Assignment Summary</h3>
                  <div className="text-sm text-gray-600 mt-2 space-y-1">
                    <p>
                      <span className="font-medium">Template:</span> {selectedTemplate?.template_name}
                    </p>
                    <p>
                      <span className="font-medium">Departments:</span> {selectedDepartmentIds.length} department{selectedDepartmentIds.length > 1 ? 's' : ''}
                    </p>
                    {totalEmployees > 0 && (
                      <p>
                        <span className="font-medium">Total Employees:</span> ~{totalEmployees} employees will receive this rating
                      </p>
                    )}
                    <p>
                      <span className="font-medium">Due Date:</span> {new Date(dueDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    💡 All employees in the selected departments will receive an assignment to rate their manager.
                    {sendEmail && ' They will be notified via email.'}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </PageContainer>
  );
};

export default ManagerRatingAssign;
