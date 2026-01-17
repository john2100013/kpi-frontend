import React from 'react';
import { FiArrowLeft, FiEye, FiInfo } from 'react-icons/fi';
import { useManagerKPIList, getKPIStage } from '../hooks';
import { KPIListItem } from '../components';
import { useCompanyFeatures } from '../../../hooks/useCompanyFeatures';

const ManagerKPIList: React.FC = () => {
  const {
    kpis,
    reviews,
    searchQuery,
    loading,
    setSearchQuery,
    handleKPIClick,
    handleBack,
  } = useManagerKPIList();

  const { features, loading: featuresLoading } = useCompanyFeatures();

  if (loading || featuresLoading) {
    return <div className="p-6">Loading...</div>;
  }

  const isSelfRatingEnabled = features?.enable_employee_self_rating_quarterly !== false;

  return (
    <div className="space-y-6">
      {/* Self-Rating Disabled Notice for Managers */}
      {!isSelfRatingEnabled && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <FiInfo className="text-purple-600 text-lg flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-purple-800">
                <strong>You will be the one to start this review:</strong> Your organization uses a manager-led review process. 
                Initiate reviews for your team members' KPIs.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={handleBack}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <FiArrowLeft className="text-xl" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All KPIs</h1>
          <p className="text-sm text-gray-600 mt-1">View all KPIs assigned to your team members</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="relative">
          <FiEye className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by KPI title, employee name, or department..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* KPI List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Team KPIs ({kpis.length})
          </h2>
        </div>

        <div className="divide-y divide-gray-200">
          {kpis.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No KPIs found
            </div>
          ) : (
            kpis.map((kpi) => (
              <KPIListItem
                key={kpi.id}
                kpi={kpi}
                stageInfo={getKPIStage(kpi, reviews)}
                onClick={() => handleKPIClick(kpi.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagerKPIList;
