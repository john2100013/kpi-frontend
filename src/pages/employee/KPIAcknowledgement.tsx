import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { KPI } from '../../types';
import SignatureField from '../../components/SignatureField';
import DatePicker from '../../components/DatePicker';
import { FiCheckCircle, FiClock } from 'react-icons/fi';

const KPIAcknowledgement: React.FC = () => {
  const { kpiId } = useParams<{ kpiId: string }>();
  const navigate = useNavigate();
  const [kpi, setKpi] = useState<KPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [employeeSignature, setEmployeeSignature] = useState('');
  const [acknowledgementDate, setAcknowledgementDate] = useState<Date | null>(new Date());

  useEffect(() => {
    if (kpiId) {
      fetchKPI();
    }
  }, [kpiId]);

  const fetchKPI = async () => {
    try {
      const response = await api.get(`/kpis/${kpiId}`);
      setKpi(response.data.kpi);
    } catch (error) {
      console.error('Error fetching KPI:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!employeeSignature) {
      alert('Please provide your digital signature');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/kpi-acknowledgement/${kpiId}`, {
        employee_signature: employeeSignature,
      });

      navigate('/employee/my-kpis');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to acknowledge KPI');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !kpi) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">KPI Acknowledgement</h1>
        <p className="text-sm text-gray-600 mt-1">
          Review and acknowledge your assigned KPIs
        </p>
      </div>

      {/* KPI Details Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Assigned KPIs</h2>
        </div>

        {/* KPI Form Info */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Period</p>
              <p className="font-semibold text-gray-900">{kpi.quarter} {kpi.year}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Type</p>
              <p className="font-semibold text-gray-900 capitalize">{kpi.period}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">KPI Items</p>
              <p className="font-semibold text-gray-900">{kpi.items?.length || kpi.item_count || 1}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Meeting Date</p>
              <p className="font-semibold text-gray-900">
                {kpi.meeting_date ? new Date(kpi.meeting_date).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">#</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">KPI TITLE</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">DESCRIPTION</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">TARGET VALUE</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">MEASURE UNIT</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">MEASURE CRITERIA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {kpi.items && kpi.items.length > 0 ? (
                kpi.items.map((item, index) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-900">{index + 1}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">{item.title}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700">{item.description || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{item.target_value || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700">{item.measure_unit || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700">{item.measure_criteria || 'N/A'}</p>
                    </td>
                  </tr>
                ))
              ) : (
                // Fallback for legacy single KPI format
                <tr>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-gray-900">1</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-900">{kpi.title}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-700">{kpi.description || 'N/A'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900">{kpi.target_value || 'N/A'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-700">{kpi.measure_unit || 'N/A'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-700">{kpi.measure_criteria || 'N/A'}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Status Section */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-2">Status</p>
              <span className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${
                kpi.status === 'completed'
                  ? 'bg-green-100 text-green-700'
                  : kpi.status === 'acknowledged'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-orange-100 text-orange-700'
              }`}>
                {kpi.status === 'completed' ? (
                  <span className="flex items-center space-x-1">
                    <FiCheckCircle className="inline" />
                    <span>Completed</span>
                  </span>
                ) : kpi.status === 'acknowledged' ? (
                  <span className="flex items-center space-x-1">
                    <FiCheckCircle className="inline" />
                    <span>Acknowledged</span>
                  </span>
                ) : (
                  <span className="flex items-center space-x-1">
                    <FiClock className="inline" />
                    <span>Pending</span>
                  </span>
                )}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Last Updated</p>
              <p className="text-sm text-gray-900">
                {new Date(kpi.updated_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Details */}
      {kpi.status === 'pending' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">KPI Details</h2>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">KPI Title</p>
              <p className="font-semibold text-gray-900">{kpi.title}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Description</p>
              <p className="text-gray-700">{kpi.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Target Value</p>
                <p className="font-semibold text-gray-900">{kpi.target_value} {kpi.measure_unit}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Measure Criteria</p>
                <p className="text-gray-700">{kpi.measure_criteria}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Period</p>
              <p className="font-semibold text-gray-900">
                {kpi.period === 'quarterly' ? 'Quarterly' : 'Yearly'} - {kpi.quarter} {kpi.year}
              </p>
            </div>
          </div>

          {/* Employee Signature */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Employee Confirmation</h3>
            <p className="text-sm text-gray-600 mb-4">
              By signing below, I acknowledge that I have reviewed and understood the assigned KPI objectives.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <SignatureField
                  label="Digital Signature *"
                  value={employeeSignature}
                  onChange={setEmployeeSignature}
                  required
                  placeholder="Click and drag to sign"
                />
              </div>

              <div className="space-y-4">
                <DatePicker
                  label="Acknowledgement Date *"
                  value={acknowledgementDate}
                  onChange={setAcknowledgementDate}
                  required
                />
                <div>
                  <p className="text-sm text-gray-600 mb-1">Employee Name</p>
                  <p className="font-semibold text-gray-900">Sarah Williams</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Payroll Number</p>
                  <p className="font-semibold text-gray-900">EMP-2024-0145</p>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Acknowledgement'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default KPIAcknowledgement;

