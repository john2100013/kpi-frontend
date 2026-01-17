import React from 'react';
import { FiArrowLeft, FiInfo } from 'react-icons/fi';
import { Button } from '../../../components/common';
import { useEmployeeKPIList } from '../hooks';
import { KPIListRow } from '../components';
import { useCompanyFeatures } from '../../../hooks/useCompanyFeatures';

const KPIList: React.FC = () => {
  const {
    kpis,
    reviews,
    loading,
    handleViewKPI,
    handleEditReview,
    handleBack,
    getKPIStage,
    getPrimaryAction,
    canEditReview,
    navigate,
  } = useEmployeeKPIList();

  const { features, loading: featuresLoading } = useCompanyFeatures();

  if (loading || featuresLoading) {
    return <div className="p-6">Loading...</div>;
  }

  const isSelfRatingEnabled = features?.enable_employee_self_rating_quarterly !== false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          onClick={handleBack}
          variant="ghost"
          icon={FiArrowLeft}
          className="p-2"
        />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My KPIs</h1>
          <p className="text-sm text-gray-600 mt-1">View all your KPIs and their current status</p>
        </div>
      </div>

      {/* Self-Rating Disabled Notice */}
      {!isSelfRatingEnabled && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <FiInfo className="text-blue-600 text-lg flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-800">
                <strong>Manager-Led Review:</strong> Your organization uses a manager-led review process. 
                You can view your KPIs, but reviews will be initiated by your manager.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* KPI Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            All KPIs ({kpis.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">KPI TITLE</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">PERIOD</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">STATUS</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {kpis.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No KPIs assigned yet
                  </td>
                </tr>
              ) : (
                kpis.map((kpi) => {
                  const review = reviews.find(r => r.kpi_id === kpi.id);
                  const stageInfo = getKPIStage(kpi, reviews);
                  const primaryAction = getPrimaryAction(kpi, review, navigate);
                  const showEditButton = canEditReview(review);

                  return (
                    <KPIListRow
                      key={kpi.id}
                      kpi={kpi}
                      stageInfo={stageInfo}
                      primaryAction={primaryAction}
                      showEditButton={showEditButton}
                      onView={handleViewKPI}
                      onEdit={handleEditReview}
                    />
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default KPIList;

