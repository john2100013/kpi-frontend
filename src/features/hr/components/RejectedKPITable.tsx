/**
 * Rejected KPI Table Component
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { KPIReview } from '../../../types';
import { Button } from '../../../components/common';
import { FiEye, FiClock } from 'react-icons/fi';
import { getKPIStatusBadge } from '../hooks/rejectedKPIUtils';

interface RejectedKPITableProps {
  kpis: KPIReview[];
  getReviewForKPI: (kpiId: number) => KPIReview | undefined;
}

export const RejectedKPITable: React.FC<RejectedKPITableProps> = ({ kpis, getReviewForKPI }) => {
  const navigate = useNavigate();

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
              Employee
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
              Department
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
              KPI Title
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
              Period
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
              Manager
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
              Rejection Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {kpis.map((kpi) => {
            const review = getReviewForKPI(kpi.id);
            return (
              <tr key={kpi.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-semibold text-gray-900">{kpi.employee_name}</p>
                    <p className="text-sm text-gray-500">{kpi.employee_payroll || 'N/A'}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-900">{kpi.employee_department}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-900">{kpi.kpi_title}</p>
                  <p className="text-xs text-gray-500">{kpi.kpi_description?.substring(0, 50)}...</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-900">
                    {kpi.review_quarter} {kpi.review_year}
                  </p>
                  <p className="text-xs text-gray-500">{kpi.review_period === 'quarterly' ? 'Quarterly' : 'Annual'}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-900">{kpi.manager_name}</p>
                </td>
                <td className="px-6 py-4">
                  {review && getKPIStatusBadge({} as any, review)}
                </td>
                <td className="px-6 py-4">
                  {review?.employee_confirmation_signed_at ? (
                    <div>
                      <p className="text-sm text-gray-900">
                        {new Date(review.employee_confirmation_signed_at).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        <FiClock className="inline mr-1" />
                        {new Date(review.employee_confirmation_signed_at).toLocaleTimeString()}
                      </p>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">N/A</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <Button
                    onClick={() => navigate(`/hr/kpi-details/${kpi.id}`)}
                    variant="primary"
                    icon={FiEye}
                  >
                    View Details
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
