import React, { useState, useEffect } from 'react';
import { FiArrowLeft, FiInfo } from 'react-icons/fi';
import { Button } from '../../../components/common';
import { useEmployeeKPIList } from '../hooks';
import { KPIListRow } from '../components';
import { DepartmentFeatures } from '../../../hooks/useDepartmentFeatures';
import api from '../../../services/api';
import { KPI } from '../../../types';

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

  // Store department features (single API call for all KPIs since they belong to same department)
  const [departmentFeatures, setDepartmentFeatures] = useState<DepartmentFeatures | null>(null);
  const [featuresLoading, setFeaturesLoading] = useState(true);

  // Fetch department features once for the employee's department (applies to all their KPIs)
  useEffect(() => {
    const fetchDepartmentFeatures = async () => {
      if (kpis.length === 0) {
        setFeaturesLoading(false);
        return;
      }

      try {
        // Single API call - all employee KPIs belong to the same department
        const response = await api.get('/department-features/my-department');
        if (response.data) {
          setDepartmentFeatures(response.data);
        }
      } catch (err) {
        // Fallback to default features if API fails
        setDepartmentFeatures({
          department_id: 0,
          company_id: 0,
          use_goal_weight_yearly: false,
          use_goal_weight_quarterly: false,
          use_actual_values_yearly: false,
          use_actual_values_quarterly: false,
          use_normal_calculation: true,
          enable_employee_self_rating_quarterly: true,
          enable_employee_self_rating_yearly: true,
          is_default: true,
        });
      } finally {
        setFeaturesLoading(false);
      }
    };

    fetchDepartmentFeatures();
  }, [kpis.length]);

  // Helper: Check if self-rating is enabled for a specific KPI
  const isSelfRatingEnabledForKPI = (kpi: KPI): boolean => {
    if (!departmentFeatures) return true;

    const kpiPeriod = kpi.period?.toLowerCase() === 'yearly' ? 'yearly' : 'quarterly';

    if (kpiPeriod === 'yearly') {
      return departmentFeatures.enable_employee_self_rating_yearly !== false;
    } else {
      return departmentFeatures.enable_employee_self_rating_quarterly !== false;
    }
  };

  // Helper: Get calculation method for a specific KPI
  const getCalculationMethod = (kpi: KPI): string => {
    if (!departmentFeatures) return 'Normal Calculation';

    const kpiPeriod = kpi.period?.toLowerCase() === 'yearly' ? 'yearly' : 'quarterly';

    if (kpiPeriod === 'yearly') {
      if (departmentFeatures.use_actual_values_yearly) return 'Actual vs Target Values';
      if (departmentFeatures.use_goal_weight_yearly) return 'Goal Weight Calculation';
    } else {
      if (departmentFeatures.use_actual_values_quarterly) return 'Actual vs Target Values';
      if (departmentFeatures.use_goal_weight_quarterly) return 'Goal Weight Calculation';
    }

    return 'Normal Calculation';
  };

  if (loading || featuresLoading) {
    return <div className="p-6">Loading...</div>;
  }

  // Check if any KPIs have self-rating disabled
  const kpisWithDisabledSelfRating = kpis.filter(kpi => !isSelfRatingEnabledForKPI(kpi));
  const allDisabled = kpisWithDisabledSelfRating.length === kpis.length && kpis.length > 0;
  const someDisabled = kpisWithDisabledSelfRating.length > 0 && kpisWithDisabledSelfRating.length < kpis.length;

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
      {allDisabled && (
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
      {someDisabled && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <FiInfo className="text-purple-600 text-lg flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-purple-800">
                <strong>Mixed Review Process:</strong> Some KPIs have self-rating disabled and will be manager-led.
                Check individual KPI badges for details.
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
                  const isSelfRatingEnabled = isSelfRatingEnabledForKPI(kpi);
                  const calculationMethod = getCalculationMethod(kpi);
                  const stageInfo = getKPIStage(kpi, reviews, isSelfRatingEnabled);
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
                      isSelfRatingEnabled={isSelfRatingEnabled}
                      calculationMethod={calculationMethod}
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

