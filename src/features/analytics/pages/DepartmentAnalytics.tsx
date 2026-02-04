/**
 * Department Analytics Page for HR
 * Shows comprehensive analytics including status distribution, performance metrics, and period comparisons
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  fetchDepartmentStatusDistribution,
  fetchDepartmentPerformanceMetrics,
  fetchDepartmentPeriodComparisons,
} from '../../../store/slices/departmentAnalyticsSlice';
import { fetchDepartments } from '../../../store/slices/departmentSlice';
import { Button } from '../../../components/common';
import { FiArrowLeft, FiTrendingUp, FiTrendingDown, FiMinus } from 'react-icons/fi';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line
} from 'recharts';

const COLORS = {
  pending: '#F59E0B',
  acknowledged_review_pending: '#3B82F6',
  self_rating_submitted: '#8B5CF6',
  awaiting_employee_confirmation: '#EC4899',
  review_completed: '#10B981',
  review_rejected: '#EF4444',
  no_kpi: '#6B7280',
};

const STATUS_LABELS = {
  pending: 'Pending Acknowledgement',
  acknowledged_review_pending: 'Acknowledged - Review Pending',
  self_rating_submitted: 'Self-Rating Submitted',
  awaiting_employee_confirmation: 'Awaiting Confirmation',
  review_completed: 'Review Completed',
  review_rejected: 'Review Rejected',
  no_kpi: 'No KPI Assigned',
};

const DepartmentAnalytics: React.FC = () => {
  const { departmentId } = useParams<{ departmentId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const [periodType, setPeriodType] = useState<'quarterly' | 'yearly'>('quarterly');
  
  const { departments } = useAppSelector((state) => state.departments);
  const { statusDistribution, performanceMetrics, periodComparisons, loading } = useAppSelector(
    (state) => state.departmentAnalytics
  );

  const deptId = parseInt(departmentId || '0', 10);
  const department = departments.find((d) => d.id === deptId);
  
  const statusData = statusDistribution[deptId];
  const metricsData = performanceMetrics[deptId] || [];
  const comparisonData = periodComparisons[deptId] || [];



  useEffect(() => {
    dispatch(fetchDepartments());
  }, [dispatch]);

  useEffect(() => {
    if (deptId) {
      dispatch(fetchDepartmentStatusDistribution(deptId));
      dispatch(fetchDepartmentPerformanceMetrics(deptId));
      dispatch(fetchDepartmentPeriodComparisons({ departmentId: deptId, periodType }));
    }
  }, [dispatch, deptId, periodType]);

  // Transform status data for pie chart
  const pieChartData = statusData ? Object.entries(statusData)
    .filter(([_, value]) => value > 0)
    .map(([key, value]) => ({
      name: STATUS_LABELS[key as keyof typeof STATUS_LABELS] || key,
      value,
      color: COLORS[key as keyof typeof COLORS]
    })) : [];

  // Calculate overall department performance
  const overallMetrics = metricsData.length > 0 ? {
    avgRating: metricsData.reduce((sum, m) => sum + (m.average_rating || 0), 0) / metricsData.filter(m => m.average_rating).length,
    totalKPIs: metricsData.reduce((sum, m) => sum + m.total_kpis, 0),
    completedKPIs: metricsData.reduce((sum, m) => sum + m.completed_kpis, 0),
    totalReviews: metricsData.reduce((sum, m) => sum + m.total_reviews, 0)
  } : null;

  if (loading && !statusData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading department analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            icon={FiArrowLeft}
            onClick={() => navigate('/hr/departments')}
          >
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {department?.name || 'Department'} Analytics
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Comprehensive performance metrics and KPI status distribution
            </p>
          </div>
        </div>
      </div>

      {/* Overall Summary Cards */}
      {overallMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Average Rating</p>
            <p className="text-3xl font-bold text-gray-900">
              {overallMetrics.avgRating.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Out of 5.00</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Total KPIs</p>
            <p className="text-3xl font-bold text-gray-900">{overallMetrics.totalKPIs}</p>
            <p className="text-xs text-gray-500 mt-1">All periods</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Completed KPIs</p>
            <p className="text-3xl font-bold text-green-600">{overallMetrics.completedKPIs}</p>
            <p className="text-xs text-gray-500 mt-1">
              {overallMetrics.totalKPIs > 0 
                ? `${((overallMetrics.completedKPIs / overallMetrics.totalKPIs) * 100).toFixed(1)}% completion`
                : '0% completion'}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Total Reviews</p>
            <p className="text-3xl font-bold text-purple-600">{overallMetrics.totalReviews}</p>
            <p className="text-xs text-gray-500 mt-1">Completed reviews</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* KPI Status Distribution Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">KPI Status Distribution</h2>
          {pieChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-500">No KPI data available</div>
          )}
        </div>

        {/* Department Performance Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Summary</h2>
          <div className="space-y-4">
            {pieChartData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-gray-700">{item.name}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Metrics by Period - Bar Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance by Period</h2>
        {metricsData.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={metricsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period_label" />
              <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
              <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="average_rating" fill="#8B5CF6" name="Avg Rating" />
              <Bar yAxisId="right" dataKey="completed_kpis" fill="#10B981" name="Completed KPIs" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-12 text-gray-500">No performance data available</div>
        )}
      </div>

      {/* Period Comparisons - Line Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Period-to-Period Comparison</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPeriodType('quarterly')}
              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                periodType === 'quarterly'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Quarterly
            </button>
            <button
              onClick={() => setPeriodType('yearly')}
              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                periodType === 'yearly'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Yearly
            </button>
          </div>
        </div>
        
        {comparisonData.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={[...comparisonData].reverse()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period_label" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="average_rating" 
                  stroke="#8B5CF6" 
                  strokeWidth={2}
                  name="Average Rating"
                />
                <Line 
                  type="monotone" 
                  dataKey="completion_rate" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  name="Completion Rate (%)"
                />
              </LineChart>
            </ResponsiveContainer>

            {/* Trend Indicators */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              {comparisonData.slice(0, 3).map((period) => (
                <div key={period.period_label} className="border border-gray-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700">{period.period_label}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-2xl font-bold text-gray-900">
                      {period.average_rating?.toFixed(2) || 'N/A'}
                    </span>
                    {period.trend !== 'stable' && period.trend_percentage !== 0 && (
                      <div className={`flex items-center space-x-1 ${
                        period.trend === 'improving' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {period.trend === 'improving' ? (
                          <FiTrendingUp className="w-5 h-5" />
                        ) : (
                          <FiTrendingDown className="w-5 h-5" />
                        )}
                        <span className="text-sm font-medium">
                          {Math.abs(period.trend_percentage).toFixed(1)}%
                        </span>
                      </div>
                    )}
                    {period.trend === 'stable' && (
                      <div className="flex items-center space-x-1 text-gray-600">
                        <FiMinus className="w-5 h-5" />
                        <span className="text-sm font-medium">Stable</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {period.completed_kpis}/{period.total_kpis} KPIs completed
                  </p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-gray-500">No comparison data available</div>
        )}
      </div>
    </div>
  );
};

export default DepartmentAnalytics;
