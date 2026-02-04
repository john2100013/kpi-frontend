import React, { useState, useEffect } from 'react';
import { FiTarget, FiClock, FiCheckCircle, FiEye, FiFileText, FiSearch, FiBell, FiEdit, FiInfo } from 'react-icons/fi';
import PasswordChangeModal from '../../../components/PasswordChangeModal';
import { StatsCard, StatusCard, Button } from '../../../components/common';
import { useEmployeeDashboard } from '../hooks';
import { DashboardKPIRow } from '../components';
import { KPI, KPIReview } from '../../../types';
import { DepartmentFeatures } from '../../../hooks/useDepartmentFeatures';
import api from '../../../services/api';

interface EmployeeDashboardProps {
  sharedKpis?: KPI[];
  sharedReviews?: KPIReview[];
}

const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ sharedKpis, sharedReviews }) => {

  const {
    filteredKpis,
    reviews,
    stats,
    uniquePeriods,
    loading,
    showPasswordModal,
    passwordChangeRequired,
    handleClosePasswordModal,
    searchTerm,
    setSearchTerm,
    selectedPeriod,
    setSelectedPeriod,
    selectedStatus,
    setSelectedStatus,
    handleStatusFilterClick,
    handleViewKPI,
    handleAcknowledgeKPI,
    handleReviewKPI,
    handleConfirmReview,
    handleEditReview,
    getDashboardKPIStage,
    navigate,
  } = useEmployeeDashboard({
    initialKpis: sharedKpis,
    initialReviews: sharedReviews,
  });

  // Store department features (single API call for all KPIs since they belong to same department)
  const [departmentFeatures, setDepartmentFeatures] = useState<DepartmentFeatures | null>(null);
  const [featuresLoading, setFeaturesLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch department features once for the employee's department (applies to all their KPIs)
  useEffect(() => {
    const fetchDepartmentFeatures = async () => {
      if (filteredKpis.length === 0) {
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
  }, [filteredKpis.length]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedPeriod, selectedStatus]);

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

  // Pagination calculations
  const totalPages = Math.ceil(filteredKpis.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedKpis = filteredKpis.slice(startIndex, endIndex);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handlePageClick = (page: number) => {
    setCurrentPage(page);
  };


  if (loading || featuresLoading) {
    return <div className="p-6">Loading...</div>;
  }

  // Check if any KPIs have self-rating disabled
  const kpisWithDisabledSelfRating = filteredKpis.filter(kpi => !isSelfRatingEnabledForKPI(kpi));
  const allDisabled = kpisWithDisabledSelfRating.length === filteredKpis.length && filteredKpis.length > 0;
  const someDisabled = kpisWithDisabledSelfRating.length > 0 && kpisWithDisabledSelfRating.length < filteredKpis.length;


  return (
    <div className="space-y-6">
      {/* Self-Rating Status Notice */}
      {allDisabled && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <FiInfo className="text-blue-600 text-lg flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-800">
                <strong>Manager-Led Review Process:</strong> Your manager will initiate and conduct all KPI reviews.
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

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My KPIs</h1>
        <Button
          variant="primary"
          icon={FiEye}
          onClick={() => navigate('/employee/kpi-list')}
        >
          View All KPIs
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Total KPIs"
          value={stats.totalKpis}
          icon={<FiTarget />}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
        />

        <StatsCard
          title="KPI Review Completed"
          value={stats.reviewCompleted}
          icon={<FiCheckCircle />}
          iconBgColor="bg-green-100"
          iconColor="text-green-600"
        />

        <StatsCard
          title="KPI Setting Completed"
          value={stats.settingCompleted}
          icon={<FiFileText />}
          iconBgColor="bg-purple-100"
          iconColor="text-purple-600"
        />
      </div>

      {/* KPI Status Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">KPI Status Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Awaiting Acknowledgement */}
          <StatusCard
            title="Awaiting Acknowledgement"
            count={stats.awaitingAcknowledgement}
            icon={<FiClock />}
            bgColor="bg-orange-50"
            borderColor="border-orange-200"
            iconColor="text-orange-600"
            titleColor="text-orange-800"
            countColor="text-orange-900"
            onClick={() => handleStatusFilterClick('awaiting acknowledgement')}
          />

          {/* Review Pending */}
          <StatusCard
            title="Review Pending"
            count={stats.reviewPending}
            icon={<FiFileText />}
            bgColor="bg-blue-50"
            borderColor="border-blue-200"
            iconColor="text-blue-600"
            titleColor="text-blue-800"
            countColor="text-blue-900"
            onClick={() => handleStatusFilterClick('review pending')}
          />

          {/* Self-Rating Required */}
          <StatusCard
            title="Self-Rating Required"
            count={stats.selfRatingRequired}
            icon={<FiFileText />}
            bgColor="bg-purple-50"
            borderColor="border-purple-200"
            iconColor="text-purple-600"
            titleColor="text-purple-800"
            countColor="text-purple-900"
            onClick={() => handleStatusFilterClick('self-rating required')}
          />

          {/* Awaiting Manager Review */}
          <StatusCard
            title="Awaiting Manager Review"
            count={stats.awaitingManagerReview}
            icon={<FiClock />}
            bgColor="bg-yellow-50"
            borderColor="border-yellow-200"
            iconColor="text-yellow-600"
            titleColor="text-yellow-800"
            countColor="text-yellow-900"
            onClick={() => handleStatusFilterClick('submitted')}
          />

          {/* Awaiting Your Confirmation */}
          <StatusCard
            title="Awaiting Your Confirmation"
            count={stats.awaitingConfirmation}
            icon={<FiBell />}
            bgColor="bg-indigo-50"
            borderColor="border-indigo-200"
            iconColor="text-indigo-600"
            titleColor="text-indigo-800"
            countColor="text-indigo-900"
            onClick={() => handleStatusFilterClick('awaiting your confirmation')}
          />

          {/* Review Completed */}
          <StatusCard
            title="Review Completed"
            count={stats.completed}
            icon={<FiCheckCircle />}
            bgColor="bg-green-50"
            borderColor="border-green-200"
            iconColor="text-green-600"
            titleColor="text-green-800"
            countColor="text-green-900"
            onClick={() => handleStatusFilterClick('completed')}
          />

          {/* Review Rejected */}
          <StatusCard
            title="Review Rejected"
            count={stats.rejected}
            icon={<FiEdit />}
            bgColor="bg-red-50"
            borderColor="border-red-200"
            iconColor="text-red-600"
            titleColor="text-red-800"
            countColor="text-red-900"
            onClick={() => handleStatusFilterClick('rejected')}
          />
        </div>
      </div>

      {/* KPI Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">My KPIs</h2>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search KPIs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Period Filter */}
            <div>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">All Periods</option>
                {uniquePeriods.map((period: string) => (
                  <option key={period} value={period}>{period}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="awaiting acknowledgement">Awaiting Acknowledgement</option>
                <option value="review pending">Review Pending</option>
                <option value="self-rating required">Self-Rating Required</option>
                <option value="submitted">Self-Rating Submitted</option>
                <option value="awaiting your confirmation">Awaiting Your Confirmation</option>
                <option value="completed">Review Completed</option>
                <option value="rejected">Review Rejected</option>
              </select>
            </div>
          </div>
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
              {filteredKpis.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No KPIs found
                  </td>
                </tr>
              ) : (
                paginatedKpis.map((kpi: KPI) => {
                  const review = reviews.find((r: KPIReview) => r.kpi_id === kpi.id);
                  const stageInfo = getDashboardKPIStage(kpi, reviews);
                  const selfRatingEnabled = isSelfRatingEnabledForKPI(kpi);
                  const calcMethod = getCalculationMethod(kpi);

                  return (
                    <DashboardKPIRow
                      key={kpi.id}
                      kpi={kpi}
                      review={review}
                      stageInfo={stageInfo}
                      onView={handleViewKPI}
                      onAcknowledge={handleAcknowledgeKPI}
                      onReview={handleReviewKPI}
                      onConfirm={handleConfirmReview}
                      onEdit={handleEditReview}
                      isSelfRatingEnabled={selfRatingEnabled}
                      calculationMethod={calcMethod}
                    />
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredKpis.length > itemsPerPage && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                <span className="font-medium">{Math.min(endIndex, filteredKpis.length)}</span> of{' '}
                <span className="font-medium">{filteredKpis.length}</span> KPIs
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <div className="flex space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageClick(page)}
                      className={`px-3 py-1 text-sm rounded-md ${
                        currentPage === page
                          ? 'bg-purple-600 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Password Change Modal */}
      <PasswordChangeModal
        isOpen={showPasswordModal}
        onClose={handleClosePasswordModal}
        isRequired={passwordChangeRequired}
      />
    </div>
  );
};

export default EmployeeDashboard;

