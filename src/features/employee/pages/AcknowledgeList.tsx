import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmployeeData } from '../../../context/EmployeeDataContext';
import { KPI } from '../../../types';
import { FiClock, FiEye, FiCheckCircle } from 'react-icons/fi';
import { Button } from '../../../components/common';

interface AcknowledgeListProps {
  sharedKpis?: KPI[];
}

const AcknowledgeList: React.FC<AcknowledgeListProps> = ({ sharedKpis }) => {
  const navigate = useNavigate();
  const { sharedKpis: contextKpis, isLoading: contextLoading } = useEmployeeData();
  const [kpis, setKpis] = useState<KPI[]>([]);
  
  // Use shared KPIs from context (via props or directly from context)
  const sourceKpis = sharedKpis || contextKpis;
  const loading = contextLoading;

  console.log('[AcknowledgeList] Render - sharedKpis prop:', sharedKpis?.length, 'contextKpis:', contextKpis.length, 'loading:', loading);

  useEffect(() => {
    console.log('[AcknowledgeList] Processing KPIs from shared data...');
    
    if (!sourceKpis || !Array.isArray(sourceKpis)) {
      console.warn('[AcknowledgeList] Invalid KPI data');
      setKpis([]);
      return;
    }
    
    // Filter for pending KPIs only
    const pendingKPIs = sourceKpis.filter(
      (kpi: KPI) => kpi.status === 'pending'
    );
    
    console.log('[AcknowledgeList] Filtered pending KPIs:', pendingKPIs.length, 'out of', sourceKpis.length);
    setKpis(pendingKPIs);
  }, [sourceKpis]);

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">KPIs Awaiting Acknowledgement</h1>
        <p className="text-sm text-gray-600 mt-1">
          Review and acknowledge your assigned KPIs
        </p>
      </div>

      {/* KPI Cards */}
      {kpis.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <FiCheckCircle className="mx-auto text-5xl text-green-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">All Caught Up!</h3>
          <p className="text-gray-600">You have no KPIs pending acknowledgement at this time.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {kpis.map((kpi) => (
            <div key={kpi.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{kpi.title}</h3>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 flex items-center space-x-1">
                      <FiClock className="inline" />
                      <span>Pending Acknowledgement</span>
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{kpi.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Period</p>
                      <p className="font-medium text-gray-900">{kpi.quarter || kpi.year}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Type</p>
                      <p className="font-medium text-gray-900 capitalize">{kpi.period}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">KPI Items</p>
                      <p className="font-medium text-gray-900">{kpi.items?.length || kpi.item_count || 0}</p>
                    </div>
                    {kpi.meeting_date && (
                      <div>
                        <p className="text-gray-500">Meeting Date</p>
                        <p className="font-medium text-gray-900">
                          {new Date(kpi.meeting_date).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="ml-4 flex flex-col space-y-2">
                  <Button
                    onClick={() => navigate(`/employee/kpi-details/${kpi.id}`)}
                    variant="link"
                    icon={FiEye}
                    size="sm"
                  >
                    View
                  </Button>
                  <Button
                    onClick={() => navigate(`/employee/kpi-acknowledgement/${kpi.id}`)}
                    variant="primary"
                    size="sm"
                  >
                    Acknowledge Now
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AcknowledgeList;