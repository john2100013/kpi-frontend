import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../../services/api';
import { KPI } from '../../../types';
import SignatureField from '../../../components/SignatureField';
import DatePicker from '../../../components/DatePicker';
import TextModal from '../../../components/TextModal';
import { useToast } from '../../../context/ToastContext';
import { FiCheckCircle, FiClock } from 'react-icons/fi';
import { Button } from '../../../components/common';

const KPIAcknowledgement: React.FC = () => {
  const { kpiId } = useParams<{ kpiId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [kpi, setKpi] = useState<KPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [employeeSignature, setEmployeeSignature] = useState('');
  const [acknowledgementDate, setAcknowledgementDate] = useState<Date | null>(new Date());
  const [textModal, setTextModal] = useState<{ isOpen: boolean; title: string; value: string }>({
    isOpen: false,
    title: '',
    value: '',
  });

  console.log('📄 [KPIAcknowledgement] Component mounted/rendered');
  console.log('📄 [KPIAcknowledgement] kpiId from URL params:', kpiId);
  console.log('📄 [KPIAcknowledgement] Current state:', { loading, kpiExists: !!kpi, kpiId: kpi?.id });

  useEffect(() => {
    console.log('🔄 [KPIAcknowledgement] useEffect triggered with kpiId:', kpiId);
    if (kpiId) {
      fetchKPI();
    } else {
      console.error('❌ [KPIAcknowledgement] No kpiId found in URL params!');
    }
  }, [kpiId]);

  const fetchKPI = async () => {
    console.log('🔍 [KPIAcknowledgement] fetchKPI started for kpiId:', kpiId);
    try {
      const url = `/kpis/${kpiId}`;
      console.log('🔍 [KPIAcknowledgement] Making API call to:', url);
      
      const response = await api.get(url);
      
      console.log('✅ [KPIAcknowledgement] Raw API response:', response.data);
      console.log('✅ [KPIAcknowledgement] Response structure:', {
        success: response.data.success,
        hasKpi: !!response.data.kpi,
        hasData: !!response.data.data,
        dataKeys: Object.keys(response.data)
      });
      
      // Check if data is in response.data.data (nested) or response.data.kpi
      const kpiData = response.data.data || response.data.kpi || response.data;
      
      console.log('✅ [KPIAcknowledgement] Extracted KPI data:', {
        id: kpiData.id,
        title: kpiData.title,
        status: kpiData.status,
        employee_id: kpiData.employee_id,
        itemsCount: kpiData.items?.length
      });
      
      setKpi(kpiData);
      console.log('✅ [KPIAcknowledgement] KPI state set successfully');
    } catch (error: any) {
      console.error('❌ [KPIAcknowledgement] Error fetching KPI:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      toast.error(error.response?.data?.error || 'Failed to load KPI');
    } finally {
      console.log('🏁 [KPIAcknowledgement] fetchKPI completed, setting loading to false');
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    console.log('🚀 [KPIAcknowledgement] handleSubmit started');
    console.log('🚀 [KPIAcknowledgement] Submission data:', {
      kpiId,
      hasSignature: !!employeeSignature,
      signatureLength: employeeSignature?.length,
      acknowledgementDate
    });

    if (!employeeSignature) {
      console.log('❌ [KPIAcknowledgement] Validation failed: No signature');
      toast.error('Please provide your digital signature');
      return;
    }

    setSubmitting(true);
    try {
      // CORRECT ENDPOINT: /kpis/:kpiId/acknowledge (not /kpi-acknowledgement/:kpiId)
      const url = `/kpis/${kpiId}/acknowledge`;
      console.log('📤 [KPIAcknowledgement] Sending POST request to:', url);
      console.log('📤 [KPIAcknowledgement] Request payload:', {
        employee_signature: employeeSignature.substring(0, 50) + '...'
      });

      const response = await api.post(url, {
        employee_signature: employeeSignature,
      });

      console.log('✅ [KPIAcknowledgement] Acknowledgement successful:', response.data);
      toast.success(response.data.message || 'KPI acknowledged successfully');
      
      console.log('🔄 [KPIAcknowledgement] Navigating to employee dashboard');
      navigate('/employee/dashboard');
    } catch (error: any) {
      console.error('❌ [KPIAcknowledgement] Submission error:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url
      });
      toast.error(error.response?.data?.error || 'Failed to acknowledge KPI');
    } finally {
      console.log('🏁 [KPIAcknowledgement] handleSubmit completed, setting submitting to false');
      setSubmitting(false);
    }
  };

  console.log('🎨 [KPIAcknowledgement] Rendering check:', { loading, kpiExists: !!kpi });
  
  if (loading) {
    console.log('⏳ [KPIAcknowledgement] Showing loading state');
    return <div className="p-6">Loading KPI data...</div>;
  }
  
  if (!kpi) {
    console.log('❌ [KPIAcknowledgement] No KPI data - showing error state');
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-800">Failed to load KPI. Please try again.</p>
          <button 
            onClick={() => navigate('/employee/dashboard')}
            className="mt-4 text-red-600 underline"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  console.log('✅ [KPIAcknowledgement] Rendering main content for KPI:', kpi.id);

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
          <table className="w-full" style={{ minWidth: '1600px' }}>
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap" style={{ minWidth: '50px' }}>#</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap" style={{ minWidth: '200px' }}>KPI TITLE</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap" style={{ minWidth: '250px' }}>DESCRIPTION</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap" style={{ minWidth: '150px' }}>TARGET VALUE</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap" style={{ minWidth: '120px' }}>MEASURE UNIT</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap" style={{ minWidth: '150px' }}>EXPECTED COMPLETION DATE</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap" style={{ minWidth: '120px' }}>GOAL WEIGHT</th>
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
                      <Button
                        onClick={() => setTextModal({ isOpen: true, title: 'KPI Title', value: item.title || 'N/A' })}
                        variant="link"
                        className="text-left font-semibold"
                      >
                        <p className="truncate max-w-[200px]" title={item.title}>{item.title}</p>
                      </Button>
                    </td>
                    <td className="px-6 py-4">
                      <Button
                        onClick={() => setTextModal({ isOpen: true, title: 'KPI Description', value: item.description || 'N/A' })}
                        variant="link"
                        className="text-left"
                      >
                        <p className="truncate max-w-[250px]" title={item.description || 'N/A'}>{item.description || 'N/A'}</p>
                      </Button>
                    </td>
                    <td className="px-6 py-4">
                      <Button
                        onClick={() => setTextModal({ isOpen: true, title: 'Target Value', value: item.target_value || 'N/A' })}
                        variant="link"
                        className="text-left"
                      >
                        <p className="truncate max-w-[150px]" title={item.target_value || 'N/A'}>{item.target_value || 'N/A'}</p>
                      </Button>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700 whitespace-nowrap">{item.measure_unit || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700 whitespace-nowrap">
                        {item.expected_completion_date 
                          ? new Date(item.expected_completion_date).toLocaleDateString() 
                          : 'N/A'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700 whitespace-nowrap">{item.goal_weight || 'N/A'}</p>
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
                    <Button
                      onClick={() => setTextModal({ isOpen: true, title: 'KPI Title', value: kpi.title || 'N/A' })}
                      variant="link"
                      className="text-left font-semibold"
                    >
                      <p className="truncate max-w-[200px]" title={kpi.title}>{kpi.title}</p>
                    </Button>
                  </td>
                  <td className="px-6 py-4">
                    <Button
                      onClick={() => setTextModal({ isOpen: true, title: 'KPI Description', value: kpi.description || 'N/A' })}
                      variant="link"
                      className="text-left"
                    >
                      <p className="truncate max-w-[250px]" title={kpi.description || 'N/A'}>{kpi.description || 'N/A'}</p>
                    </Button>
                  </td>
                  <td className="px-6 py-4">
                    <Button
                      onClick={() => setTextModal({ isOpen: true, title: 'Target Value', value: kpi.target_value || 'N/A' })}
                      variant="link"
                      className="text-left"
                    >
                      <p className="truncate max-w-[150px]" title={kpi.target_value || 'N/A'}>{kpi.target_value || 'N/A'}</p>
                    </Button>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-700 whitespace-nowrap">{kpi.measure_unit || 'N/A'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-700 whitespace-nowrap">N/A</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-700 whitespace-nowrap">{kpi.measure_criteria || 'N/A'}</p>
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
                  <p className="font-semibold text-gray-900">{kpi.employee_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Payroll Number</p>
                  <p className="font-semibold text-gray-900">{kpi.employee_payroll_number || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              variant="primary"
              loading={submitting}
              size="lg"
            >
              Submit Acknowledgement
            </Button>
          </div>
        </div>
      )}

      {/* Text Modal */}
      <TextModal
        isOpen={textModal.isOpen}
        onClose={() => setTextModal({ isOpen: false, title: '', value: '' })}
        title={textModal.title}
        value={textModal.value}
        readOnly={true}
      />
    </div>
  );
};

export default KPIAcknowledgement;

