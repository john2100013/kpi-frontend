import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { User, KPI } from '../../types';
import SignatureField from '../../components/SignatureField';
import DatePicker from '../../components/DatePicker';
import { FiArrowLeft, FiSave, FiSend, FiEye } from 'react-icons/fi';

const KPISetting: React.FC = () => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [kpiRows, setKpiRows] = useState([
    { title: '', description: '', target_value: '', measure_unit: '', measure_criteria: '' },
    { title: '', description: '', target_value: '', measure_unit: '', measure_criteria: '' },
    { title: '', description: '', target_value: '', measure_unit: '', measure_criteria: '' },
  ]);
  const [period, setPeriod] = useState<'quarterly' | 'yearly'>('quarterly');
  const [quarter, setQuarter] = useState('Q1');
  const [year, setYear] = useState(new Date().getFullYear());
  const [meetingDate, setMeetingDate] = useState<Date | null>(new Date());
  const [managerSignature, setManagerSignature] = useState('');

  useEffect(() => {
    if (employeeId) {
      fetchEmployee();
    }
  }, [employeeId]);

  const fetchEmployee = async () => {
    try {
      const response = await api.get(`/employees/${employeeId}`);
      setEmployee(response.data.employee);
    } catch (error) {
      console.error('Error fetching employee:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKpiChange = (index: number, field: string, value: string) => {
    const updated = [...kpiRows];
    updated[index] = { ...updated[index], [field]: value };
    setKpiRows(updated);
  };

  const handleSaveDraft = async () => {
    // Save draft logic (can be implemented later)
    alert('Draft saved');
  };

  const handleSubmit = async () => {
    if (!managerSignature) {
      alert('Please provide your digital signature');
      return;
    }

    // Filter out empty rows
    const validKpiRows = kpiRows.filter(
      kpi => kpi.title && kpi.title.trim() !== '' && kpi.description && kpi.description.trim() !== ''
    );

    if (validKpiRows.length === 0) {
      alert('Please fill in at least one KPI row');
      return;
    }

    setSaving(true);
    try {
      // Submit as a single KPI form with multiple items
      await api.post('/kpis', {
        employee_id: parseInt(employeeId!),
        period,
        quarter: period === 'quarterly' ? quarter : undefined,
        year,
        meeting_date: meetingDate?.toISOString().split('T')[0],
        manager_signature: managerSignature,
        kpi_items: validKpiRows.map(kpi => ({
          title: kpi.title,
          description: kpi.description,
          target_value: kpi.target_value,
          measure_unit: kpi.measure_unit,
          measure_criteria: kpi.measure_criteria,
        })),
      });

      navigate('/manager/dashboard');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to submit KPI form');
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
            <h1 className="text-2xl font-bold text-gray-900">Set KPI for Employee</h1>
            <p className="text-sm text-gray-600 mt-1">
              Create new performance objective • {quarter} {year}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleSaveDraft}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <FiSave className="text-lg" />
            <span>Save as Draft</span>
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            <FiSend className="text-lg" />
            <span>Submit KPI</span>
          </button>
        </div>
      </div>

      {/* Employee Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Employee Information</h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(`/manager/employee-kpis/${employeeId}`)}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
            >
              <FiEye className="text-lg" />
              <span>View KPIs</span>
            </button>
            <button className="text-sm text-purple-600 hover:text-purple-700">
              Change Employee
            </button>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
            <span className="text-2xl font-semibold text-purple-600">
              {employee?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Full Name</p>
                <p className="font-semibold text-gray-900">{employee?.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Position</p>
                <p className="font-semibold text-gray-900">{employee?.position}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Payroll Number</p>
                <p className="font-semibold text-gray-900">{employee?.payroll_number}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Employment Date</p>
                <p className="font-semibold text-gray-900">
                  {employee?.employment_date
                    ? new Date(employee.employment_date).toLocaleDateString()
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Department</p>
                <p className="font-semibold text-gray-900">{employee?.department}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Current KPIs</p>
                <p className="font-semibold text-gray-900">4 Active</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Details */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">KPI Details</h2>
          <span className="text-sm text-gray-500">Required fields *</span>
        </div>

        <div className="space-y-6">
          {/* Period Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                KPI Type *
              </label>
              <select
                value={period}
                onChange={(e) => {
                  setPeriod(e.target.value as 'quarterly' | 'yearly');
                  if (e.target.value === 'quarterly') {
                    setKpiRows([
                      { title: '', description: '', target_value: '', measure_unit: '', measure_criteria: '' },
                      { title: '', description: '', target_value: '', measure_unit: '', measure_criteria: '' },
                      { title: '', description: '', target_value: '', measure_unit: '', measure_criteria: '' },
                    ]);
                  } else {
                    setKpiRows([
                      { title: '', description: '', target_value: '', measure_unit: '', measure_criteria: '' },
                      { title: '', description: '', target_value: '', measure_unit: '', measure_criteria: '' },
                      { title: '', description: '', target_value: '', measure_unit: '', measure_criteria: '' },
                      { title: '', description: '', target_value: '', measure_unit: '', measure_criteria: '' },
                      { title: '', description: '', target_value: '', measure_unit: '', measure_criteria: '' },
                    ]);
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Select the evaluation period for this KPI</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review Quarter *
              </label>
              <select
                value={quarter}
                onChange={(e) => setQuarter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="Q1">Q1 2024 (Jan - Mar)</option>
                <option value="Q2">Q2 2024 (Apr - Jun)</option>
                <option value="Q3">Q3 2024 (Jul - Sep)</option>
                <option value="Q4">Q4 2024 (Oct - Dec)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Choose the review period</p>
            </div>
            <div>
              <DatePicker
                label="Meeting Date *"
                value={meetingDate || undefined}
                onChange={setMeetingDate}
                required
              />
            </div>
          </div>

          {/* KPI Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase border border-gray-200">
                    KPI Title / Name *
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase border border-gray-200">
                    KPI Description *
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase border border-gray-200">
                    Target Value *
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase border border-gray-200">
                    Measure Unit *
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase border border-gray-200">
                    Measure Criteria *
                  </th>
                </tr>
              </thead>
              <tbody>
                {kpiRows.map((kpi, index) => (
                  <tr key={index}>
                    <td className="border border-gray-200 p-2">
                      <input
                        type="text"
                        value={kpi.title}
                        onChange={(e) => handleKpiChange(index, 'title', e.target.value)}
                        placeholder="e.g., Increase Monthly Sales Revenue"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                      />
                    </td>
                    <td className="border border-gray-200 p-2">
                      <textarea
                        value={kpi.description}
                        onChange={(e) => handleKpiChange(index, 'description', e.target.value)}
                        placeholder="Provide detailed description..."
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                      />
                    </td>
                    <td className="border border-gray-200 p-2">
                      <input
                        type="text"
                        value={kpi.target_value}
                        onChange={(e) => handleKpiChange(index, 'target_value', e.target.value)}
                        placeholder="e.g., 150,000 or 95%"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                      />
                    </td>
                    <td className="border border-gray-200 p-2">
                      <select
                        value={kpi.measure_unit}
                        onChange={(e) => handleKpiChange(index, 'measure_unit', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">Select unit</option>
                        <option value="Percentage">Percentage</option>
                        <option value="Number">Number</option>
                        <option value="Currency">Currency</option>
                        <option value="Days">Days</option>
                      </select>
                    </td>
                    <td className="border border-gray-200 p-2">
                      <input
                        type="text"
                        value={kpi.measure_criteria}
                        onChange={(e) => handleKpiChange(index, 'measure_criteria', e.target.value)}
                        placeholder="e.g., Resolution within SLA"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Manager Signature */}
          <div className="mt-6">
            <SignatureField
              label="Manager Digital Signature *"
              value={managerSignature}
              onChange={setManagerSignature}
              required
              placeholder="Click and drag to sign"
            />
            <p className="text-sm text-gray-600 mt-2">
              By signing below, you confirm that the KPI details are accurate and agree to submit this to the employee.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KPISetting;

