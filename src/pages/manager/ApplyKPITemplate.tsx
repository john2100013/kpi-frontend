import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { User } from '../../types';
import SignatureField from '../../components/SignatureField';
import DatePicker from '../../components/DatePicker';
import { FiArrowLeft, FiSend, FiCheck, FiUsers, FiFileText } from 'react-icons/fi';

interface KPITemplate {
  id: number;
  template_name: string;
  description: string;
  period: string;
  items: any[];
}

const ApplyKPITemplate: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [template, setTemplate] = useState<KPITemplate | null>(null);
  const [employees, setEmployees] = useState<User[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  
  const [quarter, setQuarter] = useState('Q1');
  const [year, setYear] = useState(new Date().getFullYear());
  const [meetingDate, setMeetingDate] = useState<Date | null>(new Date());
  const [managerSignature, setManagerSignature] = useState('');
  const [availablePeriods, setAvailablePeriods] = useState<any[]>([]);
  const [selectedPeriodSetting, setSelectedPeriodSetting] = useState<any>(null);

  useEffect(() => {
    fetchTemplate();
    fetchEmployees();
    fetchAvailablePeriods();
  }, [id]);

  const fetchTemplate = async () => {
    try {
      const response = await api.get(`/kpi-templates/${id}`);
      setTemplate(response.data.template);
    } catch (error) {
      console.error('Error fetching template:', error);
      alert('Failed to load template');
      navigate('/manager/kpi-templates');
    }
  };

  const fetchEmployees = async () => {
    try {
      // Fetch current user info to get manager ID
      const userResponse = await api.get('/auth/me');
      const managerId = userResponse.data.user.id;
      
      const response = await api.get('/employees', {
        params: { managerId }
      });
      const employeeList = response.data.employees.filter((emp: User) => emp.role === 'employee');
      setEmployees(employeeList);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailablePeriods = async () => {
    try {
      const response = await api.get('/settings/period-settings');
      setAvailablePeriods(response.data.settings || []);
    } catch (error) {
      console.error('Error fetching periods:', error);
    }
  };

  const handleEmployeeToggle = (employeeId: number) => {
    setSelectedEmployees(prev =>
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleSelectAll = () => {
    if (selectedEmployees.length === employees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(employees.map(emp => emp.id));
    }
  };

  const handlePeriodChange = (settingId: string) => {
    const setting = availablePeriods.find(s => s.id === parseInt(settingId));
    if (setting) {
      setSelectedPeriodSetting(setting);
      if (setting.period_type === 'quarterly') {
        setQuarter(setting.quarter);
      }
      setYear(setting.year);
    }
  };

  const handleSubmit = async () => {
    if (selectedEmployees.length === 0) {
      alert('Please select at least one employee');
      return;
    }

    if (!managerSignature) {
      alert('Please provide your digital signature');
      return;
    }

    if (!selectedPeriodSetting) {
      alert('Please select a KPI period');
      return;
    }

    setSending(true);

    try {
      const response = await api.post(`/kpi-templates/${id}/apply`, {
        employee_ids: selectedEmployees,
        quarter: template?.period === 'quarterly' ? quarter : undefined,
        year,
        meeting_date: meetingDate?.toISOString().split('T')[0],
        manager_signature: managerSignature,
      });

      alert(response.data.message || 'KPIs created successfully!');
      navigate('/manager/dashboard');
    } catch (error: any) {
      console.error('Error applying template:', error);
      alert(error.response?.data?.error || 'Failed to apply template');
    } finally {
      setSending(false);
    }
  };

  if (loading || !template) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/manager/kpi-templates')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
          >
            <FiArrowLeft className="text-xl" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Apply KPI Template</h1>
            <p className="text-sm text-gray-600 mt-1">
              Select employees and assign KPIs from template: {template.template_name}
            </p>
          </div>
        </div>
        <button
          onClick={handleSubmit}
          disabled={sending || selectedEmployees.length === 0}
          className="flex items-center space-x-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          <FiSend className="text-lg" />
          <span>{sending ? 'Sending...' : `Send to ${selectedEmployees.length} Employee(s)`}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Template Preview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Template Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FiFileText className="mr-2" />
              Template: {template.template_name}
            </h2>
            
            {template.description && (
              <p className="text-gray-600 mb-4">{template.description}</p>
            )}

            <div className="bg-purple-50 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Period Type:</span>
                  <p className="font-medium text-gray-900 capitalize">{template.period}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Number of KPI Items:</span>
                  <p className="font-medium text-gray-900">{template.items.length} items</p>
                </div>
              </div>
            </div>

            {/* KPI Items Preview */}
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900">KPI Items Preview:</h3>
              {template.items.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">{item.title}</h4>
                      {item.description && (
                        <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                      )}
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                        {item.target_value && (
                          <div>
                            <span className="font-medium">Target:</span> {item.target_value}
                          </div>
                        )}
                        {item.measure_unit && (
                          <div>
                            <span className="font-medium">Unit:</span> {item.measure_unit}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Period and Meeting Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Period and Meeting Settings</h2>
            
            <div className="space-y-4">
              {/* Period Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select KPI Period *
                </label>
                <select
                  value={selectedPeriodSetting?.id || ''}
                  onChange={(e) => handlePeriodChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="">Select a period...</option>
                  {availablePeriods
                    .filter(setting => setting.period_type === template.period && setting.is_active)
                    .map(setting => (
                      <option key={setting.id} value={setting.id}>
                        {setting.period_type === 'quarterly'
                          ? `${setting.quarter} ${setting.year}`
                          : `${setting.year}`}
                        {' - '}
                        {new Date(setting.start_date).toLocaleDateString()} to{' '}
                        {new Date(setting.end_date).toLocaleDateString()}
                      </option>
                    ))}
                </select>
              </div>

              {/* Meeting Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meeting Date (Optional)
                </label>
                <DatePicker
                  value={meetingDate}
                  onChange={(date) => setMeetingDate(date)}
                  placeholder="Select meeting date"
                />
              </div>

              {/* Manager Signature */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Manager Signature *
                </label>
                <SignatureField
                  value={managerSignature}
                  onChange={setManagerSignature}
                  placeholder="Sign here"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Employee Selection */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <FiUsers className="mr-2" />
                Select Employees
              </h2>
              <button
                onClick={handleSelectAll}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                {selectedEmployees.length === employees.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            {/* Department Filter */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Department
              </label>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">All Departments</option>
                {Array.from(new Set(employees.map(e => e.department).filter(Boolean))).sort().map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {employees.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No employees found</p>
            ) : (
              <>
                {Array.from(new Set(employees.map(e => e.department).filter(Boolean))).sort()
                  .filter(dept => departmentFilter === 'all' || dept === departmentFilter)
                  .map(department => {
                    const deptEmployees = employees.filter(emp => emp.department === department);
                    return (
                      <div key={department} className="mb-6">
                        <h3 className="text-md font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200">
                          {department} ({deptEmployees.length})
                        </h3>
                        <div className="space-y-2">
                          {deptEmployees.map((employee) => (
                            <label
                              key={employee.id}
                              className={`flex items-start p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                                selectedEmployees.includes(employee.id)
                                  ? 'border-purple-500 bg-purple-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={selectedEmployees.includes(employee.id)}
                                onChange={() => handleEmployeeToggle(employee.id)}
                                className="mt-1 mr-3 h-5 w-5 text-purple-600 rounded focus:ring-purple-500"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center">
                                  <span className="font-medium text-gray-900">{employee.name}</span>
                                  {selectedEmployees.includes(employee.id) && (
                                    <FiCheck className="ml-2 text-purple-600" />
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{employee.email}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {employee.payroll_number}
                                </p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })
                }
              </>
            )}

            {selectedEmployees.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="bg-purple-50 rounded-lg p-3">
                  <p className="text-sm text-purple-900 font-medium">
                    {selectedEmployees.length} employee{selectedEmployees.length !== 1 ? 's' : ''} selected
                  </p>
                  <p className="text-xs text-purple-700 mt-1">
                    Each will receive their own KPI form with notifications
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyKPITemplate;
