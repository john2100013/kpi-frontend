import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../../services/api';
import { FiArrowLeft, FiUser, FiTrendingUp, FiCalendar, FiCheckCircle, FiFilter, FiAlertCircle } from 'react-icons/fi';
import { useCompanyFeatures } from '../../../hooks/useCompanyFeatures';

interface PerformanceData {
  id: number;
  employee_name: string;
  employee_department: string;
  employee_payroll_number: string;
  manager_name: string;
  period: 'quarterly' | 'yearly';
  quarter?: string;
  year: number;
  review_id: number;
  average_rating: number; // Precise weighted calculation
  final_rating: number; // Rounded to company rating options
  total_weight: number;
  manager_signed_at: string;
  review_quarter?: string;
  review_year?: number;
  item_calculations: Array<{
    item_id: number;
    title: string;
    manager_rating: number;
    goal_weight: number;
    contribution: number;
  }>;
}

interface PeriodSetting {
  id: number;
  period_type: 'quarterly' | 'yearly';
  quarter?: string;
  year: number;
  is_active: boolean;
}

const EmployeePerformance: React.FC = () => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [employeeInfo, setEmployeeInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState<'all' | 'quarterly' | 'yearly'>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [quarterlyPeriods, setQuarterlyPeriods] = useState<PeriodSetting[]>([]);
  const [yearlyPeriods, setYearlyPeriods] = useState<PeriodSetting[]>([]);

  // Get company features for conditional display - use first KPI's review_id
  const firstKpiReviewId = performanceData.length > 0 ? performanceData[0].review_id : undefined;
  const { getCalculationMethodName, isEmployeeSelfRatingEnabled } = useCompanyFeatures(firstKpiReviewId);

  useEffect(() => {
    if (employeeId) {
      fetchPerformanceData();
      fetchAvailablePeriods();
    }
  }, [employeeId]);

  const fetchAvailablePeriods = async () => {
    try {
      // Fetch both quarterly and yearly periods from settings
      const [quarterlyRes, yearlyRes] = await Promise.all([
        api.get('/settings/available-periods', { params: { period_type: 'quarterly' } }),
        api.get('/settings/available-periods', { params: { period_type: 'yearly' } })
      ]);

      // API returns { success: true, periods: [...] }
      const quarterly = Array.isArray(quarterlyRes.data?.periods) ? quarterlyRes.data.periods : [];
      const yearly = Array.isArray(yearlyRes.data?.periods) ? yearlyRes.data.periods : [];

      setQuarterlyPeriods(quarterly);
      setYearlyPeriods(yearly);
    } catch (error) {
      console.error('Error fetching available periods:', error);
    }
  };

  const fetchPerformanceData = async () => {
    try {
      
      const response = await api.get(`/kpis/employee-performance/${employeeId}`);
      
      const data = response.data.performance || response.data.data?.performance || [];
      
      if (!Array.isArray(data)) {
        setPerformanceData([]);
        setLoading(false);
        return;
      }
      
      
      // Ensure all rating values are numbers
      const normalizedData = data.map((period: any) => {
        // Parse ratings - handle both numbers and string numbers
        const parseRating = (value: any): number => {
          if (value == null) return 0;
          const parsed = typeof value === 'string' ? parseFloat(value) : value;
          return !isNaN(parsed) ? parsed : 0;
        };

        const normalized = {
          ...period,
          average_rating: parseRating(period.average_rating),
          final_rating: parseRating(period.final_rating),
          total_weight: parseRating(period.total_weight),
          item_calculations: period.item_calculations || [],
        };
        
        
        return normalized;
      });
      
      setPerformanceData(normalizedData);
      
      if (normalizedData.length > 0) {
        const empInfo = {
          name: normalizedData[0].employee_name,
          department: normalizedData[0].employee_department,
          payroll_number: normalizedData[0].employee_payroll_number,
        };
        setEmployeeInfo(empInfo);
      } 
    } catch (error: any) {
      console.error('❌ [EmployeePerformance] Error fetching performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRatingLabel = (rating: number): { label: string; color: string } => {
    if (rating >= 1.40) return { label: 'Exceeds Expectation', color: 'text-green-700 bg-green-100' };
    if (rating >= 1.15) return { label: 'Meets Expectation', color: 'text-blue-700 bg-blue-100' };
    return { label: 'Below Expectation', color: 'text-orange-700 bg-orange-100' };
  };

  // Get available years from data
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    performanceData.forEach(p => {
      const year = p.year || p.review_year;
      if (year) years.add(year);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [performanceData]);

  // Filter data based on selected filters
  const filteredData = useMemo(() => {
    let filtered = [...performanceData];
    
    // Filter by period type
    if (periodFilter === 'quarterly') {
      filtered = filtered.filter(p => p.period === 'quarterly');
    } else if (periodFilter === 'yearly') {
      filtered = filtered.filter(p => p.period === 'yearly');
    }
    
    // Filter by year - applies to BOTH quarterly and yearly
    if (yearFilter !== 'all') {
      const selectedYear = parseInt(yearFilter);
      filtered = filtered.filter(p => (p.year || p.review_year) === selectedYear);
    }
    
    return filtered;
  }, [performanceData, periodFilter, yearFilter]);

  // Separate quarterly and yearly data
  const quarterlyData = useMemo(() => {
    // Always get quarterly data from performanceData, respecting year filter
    let quarterly = performanceData.filter(p => p.period === 'quarterly');
    
    // Apply year filter if selected
    if (yearFilter !== 'all') {
      const selectedYear = parseInt(yearFilter);
      quarterly = quarterly.filter(p => (p.year || p.review_year) === selectedYear);
    }
    
    return quarterly;
  }, [performanceData, yearFilter]);

  const yearlyData = useMemo(() => {
    return filteredData.filter(p => p.period === 'yearly');
  }, [filteredData]);

  // Calculate quarterly totals by year
  const quarterlyTotalsByYear = useMemo(() => {
    const totals: { [year: number]: { count: number; totalRating: number; averageRating: number } } = {};
    
    quarterlyData.forEach(period => {
      const year = period.year || period.review_year || 0;
      if (!totals[year]) {
        totals[year] = { count: 0, totalRating: 0, averageRating: 0 };
      }
      totals[year].count++;
      // Parse final_rating to ensure it's a number
      const finalRating = typeof period.final_rating === 'string' ? parseFloat(period.final_rating) : period.final_rating;
      totals[year].totalRating += finalRating || 0;
    });
    
    // Calculate averages
    Object.keys(totals).forEach(year => {
      const yearNum = parseInt(year);
      if (totals[yearNum].count > 0) {
        totals[yearNum].averageRating = totals[yearNum].totalRating / totals[yearNum].count;
      }
    });
    
    return totals;
  }, [quarterlyData]);

  // Calculate average rating for filtered data
  const calculateAverageRating = (data: PerformanceData[]): number => {
    if (data.length === 0) return 0;
    const validRatings = data.filter(p => {
      const finalRating = typeof p.final_rating === 'string' ? parseFloat(p.final_rating) : p.final_rating;
      return finalRating != null && !isNaN(finalRating);
    });
    if (validRatings.length === 0) return 0;
    const sum = validRatings.reduce((acc, p) => {
      const finalRating = typeof p.final_rating === 'string' ? parseFloat(p.final_rating) : p.final_rating;
      return acc + (finalRating || 0);
    }, 0);
    return sum / validRatings.length;
  };

  // Calculate average rating for Quarterly based on selected year
  const calculateQuarterlyAverageForYear = (): number => {
    if (yearFilter === 'all') {
      return calculateAverageRating(quarterlyData);
    }
    const selectedYear = parseInt(yearFilter);
    const yearData = quarterlyData.filter(p => (p.year || p.review_year) === selectedYear);
    return calculateAverageRating(yearData);
  };

  // Calculate average rating for Yearly - selected year or most current year
  const calculateYearlyAverage = (): number => {
    if (yearFilter !== 'all') {
      const selectedYear = parseInt(yearFilter);
      const yearData = yearlyData.filter(p => (p.year || p.review_year) === selectedYear);
      return calculateAverageRating(yearData);
    }
    // If no year selected, use most current year
    if (availableYears.length > 0) {
      const mostCurrentYear = availableYears[0];
      const yearData = yearlyData.filter(p => (p.year || p.review_year) === mostCurrentYear);
      return calculateAverageRating(yearData);
    }
    return calculateAverageRating(yearlyData);
  };

  // Get the appropriate average rating based on filter
  const getFilteredAverageRating = (): number => {
    if (periodFilter === 'quarterly') {
      return calculateQuarterlyAverageForYear();
    } else if (periodFilter === 'yearly') {
      return calculateYearlyAverage();
    }
    return 0;
  };

  // Get calculation method helper for a specific period
  const getCalculationMethod = (period: 'quarterly' | 'yearly'): string => {
    return getCalculationMethodName ? getCalculationMethodName(period) : 'Normal Calculation';
  };

  // Check if self-rating is enabled for a period
  const isSelfRatingEnabled = (period: 'quarterly' | 'yearly'): boolean => {
    return isEmployeeSelfRatingEnabled ? isEmployeeSelfRatingEnabled(period) : false;
  };

  // Convert rating (out of 1.5) to percentage
  const ratingToPercent = (rating: number): number => {
    if (!rating || isNaN(rating)) return 0;
    const pct = (rating / 1.25) * 100;
    return Math.max(0, Math.min(100, pct));
  };

  // Prepare data for line graph (quarterly only, by year)
  const graphData = useMemo(() => {
    const data: { year: number; quarters: { [quarter: string]: number } }[] = [];
    const yearMap: { [year: number]: { [quarter: string]: number } } = {};
    
    quarterlyData.forEach(period => {
      const year = period.year || period.review_year || 0;
      const quarter = period.quarter || period.review_quarter || '';
      const finalRating = typeof period.final_rating === 'string' ? parseFloat(period.final_rating) : period.final_rating;
      
      if (!yearMap[year]) {
        yearMap[year] = {};
      }
      yearMap[year][quarter] = finalRating || 0;
    });
    
    Object.keys(yearMap).sort((a, b) => parseInt(b) - parseInt(a)).forEach(yearStr => {
      const year = parseInt(yearStr);
      data.push({
        year,
        quarters: yearMap[year]
      });
    });
    
    return data;
  }, [quarterlyData]);

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  const averageRating = calculateAverageRating(filteredData);
  const avgRatingInfo = getRatingLabel(averageRating);
  const filteredAverageRating = getFilteredAverageRating();
  const filteredAvgRatingInfo = getRatingLabel(filteredAverageRating);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <FiArrowLeft className="text-xl" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Employee Performance</h1>
          <p className="text-sm text-gray-600 mt-1">
            Performance ratings across all KPI periods
          </p>
        </div>
      </div>

      {/* Employee Information */}
      {employeeInfo && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
              <FiUser className="text-purple-600 text-2xl" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">{employeeInfo.name}</h2>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                <span>Department: {employeeInfo.department}</span>
                <span>Payroll: {employeeInfo.payroll_number}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Overall Average</p>
              <p className="text-3xl font-bold text-purple-600">{averageRating.toFixed(2)}</p>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${avgRatingInfo.color}`}>
                {avgRatingInfo.label}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <FiFilter className="text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Period Type</label>
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value as 'all' | 'quarterly' | 'yearly')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Periods (Quarterly & Yearly)</option>
              {quarterlyPeriods.length > 0 && <option value="quarterly">Quarterly Only</option>}
              {yearlyPeriods.length > 0 && <option value="yearly">Yearly Only</option>}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Year</label>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Years</option>
              {availableYears.map(year => (
                <option key={year} value={year.toString()}>{year}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Applies to both quarterly and yearly KPIs</p>
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <FiCalendar className="text-blue-600 text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Periods</p>
              <p className="text-2xl font-bold text-gray-900">{filteredData.length}</p>
              <p className="text-xs text-gray-500 mt-1">
                {periodFilter === 'all' ? `Quarterly: ${quarterlyData.length} | Yearly: ${yearlyData.length}` : 
                 periodFilter === 'quarterly' ? `${quarterlyData.length} Quarterly` : `${yearlyData.length} Yearly`}
              </p>
            </div>
          </div>
        </div>
        {filteredData.length > 0 && (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <FiTrendingUp className="text-green-600 text-xl" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Average Rating</p>
                  <p className="text-2xl font-bold text-gray-900">{getFilteredAverageRating().toFixed(2)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {yearFilter === 'all' ? 'All Years' : `Year ${yearFilter}`} • {ratingToPercent(getFilteredAverageRating()).toFixed(0)}%
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <FiCheckCircle className="text-purple-600 text-xl" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Performance Level</p>
                  <p className="text-lg font-semibold text-gray-900">{filteredAvgRatingInfo.label}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {ratingToPercent(getFilteredAverageRating()).toFixed(0)}%
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Quarterly Totals by Year */}
      {periodFilter !== 'yearly' && Object.keys(quarterlyTotalsByYear).length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quarterly Totals by Year</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.keys(quarterlyTotalsByYear)
              .sort((a, b) => parseInt(b) - parseInt(a))
              .map(yearStr => {
                const year = parseInt(yearStr);
                const total = quarterlyTotalsByYear[year];
                const ratingInfo = getRatingLabel(total.averageRating);
                return (
                  <div key={year} className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <p className="text-sm text-gray-600 mb-1">{year}</p>
                    <p className="text-2xl font-bold text-blue-600">{total.averageRating.toFixed(2)}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {total.count} Quarter{total.count !== 1 ? 's' : ''}
                    </p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium mt-2 inline-block ${ratingInfo.color}`}>
                      {ratingInfo.label}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Line Graph for Quarterly Performance (with X & Y axes) */}
      {periodFilter !== 'yearly' && quarterlyData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quarterly Performance Trend</h2>
          {graphData.length > 0 ? (
            <div className="relative">
              {graphData.map((yearData) => {
                const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
                const values = quarters.map(q => yearData.quarters[q] ?? null);
                const maxValue = Math.max(1.25, ...values.filter(v => v !== null).map(v => v || 0));
                const minValue = 0;
                const range = maxValue - minValue;
                const graphHeight = 300;
                const graphWidth = 600;
                const padding = { top: 20, right: 40, bottom: 40, left: 60 };
                const chartWidth = graphWidth - padding.left - padding.right;
                const chartHeight = graphHeight - padding.top - padding.bottom;
                
                // Calculate points for the line
                const points = values.map((value, index) => {
                  if (value === null) return null;
                  const x = padding.left + (index / (quarters.length - 1)) * chartWidth;
                  const y = padding.top + chartHeight - ((value - minValue) / range) * chartHeight;
                  return { x, y, value, quarter: quarters[index] };
                }).filter(p => p !== null) as Array<{ x: number; y: number; value: number; quarter: string }>;
                
                // Create path for line
                const pathData = points.length > 0 
                  ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
                  : '';
                
                return (
                  <div key={`year-${yearData.year}`} className="mb-8">
                    <div className="text-center mb-2">
                      <span className="text-sm font-semibold text-gray-900">{yearData.year}</span>
                    </div>
                    <div className="relative overflow-x-auto">
                      <svg width={graphWidth} height={graphHeight} className="border-b border-l border-gray-300">
                        {/* Y-axis grid lines and labels */}
                        {[0, 0.5, 1.0, 1.5].map((tick) => {
                          const y = padding.top + chartHeight - ((tick - minValue) / range) * chartHeight;
                          return (
                            <g key={`y-grid-${tick}`}>
                              <line
                                x1={padding.left}
                                y1={y}
                                x2={padding.left + chartWidth}
                                y2={y}
                                stroke="#e5e7eb"
                                strokeWidth="1"
                                strokeDasharray="2,2"
                              />
                              <text
                                x={padding.left - 10}
                                y={y + 4}
                                textAnchor="end"
                                fontSize="12"
                                fill="#6b7280"
                              >
                                {tick.toFixed(2)}
                              </text>
                            </g>
                          );
                        })}
                        
                        {/* Y-axis label */}
                        <text
                          x={15}
                          y={graphHeight / 2}
                          textAnchor="middle"
                          fontSize="11"
                          fill="#9ca3af"
                          transform={`rotate(-90, 15, ${graphHeight / 2})`}
                        >
                          Rating
                        </text>
                        
                        {/* X-axis labels */}
                        {quarters.map((quarter, index) => {
                          const x = padding.left + (index / (quarters.length - 1)) * chartWidth;
                          const value = values[index];
                          return (
                            <g key={`x-label-${quarter}`}>
                              <text
                                x={x}
                                y={graphHeight - padding.bottom + 20}
                                textAnchor="middle"
                                fontSize="12"
                                fill="#374151"
                                fontWeight="500"
                              >
                                {quarter}
                              </text>
                              {value !== null && (
                                <text
                                  x={x}
                                  y={graphHeight - padding.bottom + 35}
                                  textAnchor="middle"
                                  fontSize="10"
                                  fill="#6b7280"
                                >
                                  {value.toFixed(2)}
                                </text>
                              )}
                            </g>
                          );
                        })}
                        
                        {/* Line */}
                        {pathData && (
                          <path
                            d={pathData}
                            fill="none"
                            stroke="#8b5cf6"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        )}
                        
                        {/* Data points */}
                        {points.map((point, index) => (
                          <g key={`point-${index}`}>
                            <circle
                              cx={point.x}
                              cy={point.y}
                              r="6"
                              fill="#8b5cf6"
                              stroke="#fff"
                              strokeWidth="2"
                            />
                            <title>{`${point.quarter} ${yearData.year}: ${point.value.toFixed(2)}`}</title>
                          </g>
                        ))}
                      </svg>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <p className="text-gray-500">No quarterly data available for graph</p>
            </div>
          )}
        </div>
      )}

      {/* Quarterly Performance */}
      {periodFilter !== 'yearly' && quarterlyData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Quarterly Performance</h2>
            <p className="text-sm text-gray-600 mt-1">
              Detailed ratings for each quarterly KPI period
            </p>
          </div>

          <div className="divide-y divide-gray-200">
            {quarterlyData.map((period, periodIdx) => {
              const averageRating = period.average_rating || 0;
              const finalRating = period.final_rating || 0;
              const ratingInfo = getRatingLabel(finalRating);
              
              // Get calculation method for this period
              const calculationMethodName = getCalculationMethod(period.period);
              const isActualValueMethod = calculationMethodName.includes('Actual vs Target');
              const selfRatingEnabled = isSelfRatingEnabled(period.period);
              
              return (
                <div key={`quarterly-${period.id}-${period.review_id}-${periodIdx}`} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {period.quarter || period.review_quarter} {period.year || period.review_year} - Quarterly
                        </h3>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          Quarterly
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>Manager: {period.manager_name}</span>
                        {period.manager_signed_at && (
                          <span>Completed: {new Date(period.manager_signed_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-1">Average Rating</p>
                        <p className="text-lg font-semibold text-gray-700">{averageRating.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Final Rating</p>
                        <p className="text-3xl font-bold text-purple-600">{finalRating.toFixed(2)}</p>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium mt-2 inline-block ${ratingInfo.color}`}>
                          {ratingInfo.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Calculation Method Info Card */}
                  <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <FiAlertCircle className="text-blue-600 text-xl mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-blue-900 mb-1">Review Configuration</h3>
                        <p className="text-sm text-blue-800 mb-1">
                          <span className="font-medium">Calculation Method:</span>{' '}
                          <span className="font-semibold">{calculationMethodName}</span>
                        </p>
                        <p className="text-sm text-blue-700">
                          <span className="font-medium">Employee Self-Rating:</span>{' '}
                          {selfRatingEnabled ? '✅ Enabled' : '❌ Disabled'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Calculation Breakdown */}
                  <div className="mt-4 bg-gray-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-700 mb-3">Rating Calculation:</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-300">
                            <th className="text-left py-2 px-3">KPI Item</th>
                            <th className="text-right py-2 px-3">Manager Rating</th>
                            <th className="text-right py-2 px-3">Goal Weight</th>
                            <th className="text-right py-2 px-3">Contribution</th>
                          </tr>
                        </thead>
                        <tbody>
                          {period.item_calculations && period.item_calculations.length > 0 ? (
                            period.item_calculations.map((calc, calcIdx) => (
                              <tr key={`quarterly-calc-${period.id}-${calc.item_id}-${calcIdx}`} className="border-b border-gray-200">
                                <td className="py-2 px-3 text-gray-700">{calc.title || `Item ${calc.item_id}`}</td>
                                {!isActualValueMethod && (
                                  <td className="py-2 px-3 text-right font-semibold">{(calc.manager_rating || 0).toFixed(2)}</td>
                                )}
                                <td className="py-2 px-3 text-right">{((calc.goal_weight || 0) * 100).toFixed(0)}%</td>
                                <td className="py-2 px-3 text-right font-semibold text-purple-600">{(calc.contribution || 0).toFixed(2)}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={isActualValueMethod ? 3 : 4} className="py-4 px-3 text-center text-gray-500 text-sm">
                                No calculation data available
                              </td>
                            </tr>
                          )}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 border-gray-400 font-semibold">
                            <td className="py-2 px-3">Total</td>
                            {!isActualValueMethod && (
                              <td className="py-2 px-3 text-right">-</td>
                            )}
                            <td className="py-2 px-3 text-right">{((period.total_weight || 0) * 100).toFixed(0)}%</td>
                            <td className="py-2 px-3 text-right">
                              <div className="text-gray-600 text-xs">Avg: {averageRating.toFixed(2)}</div>
                              <div className="text-purple-600 font-bold">Final: {finalRating.toFixed(2)} ({ratingToPercent(finalRating).toFixed(0)}%)</div>
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => navigate(`/hr/kpi-details/${period.id}`)}
                      className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                    >
                      View Full Details →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Yearly Performance */}
      {periodFilter !== 'quarterly' && yearlyData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Yearly Performance</h2>
            <p className="text-sm text-gray-600 mt-1">
              Yearly KPI periods (not aggregated with quarterly)
            </p>
          </div>

          <div className="divide-y divide-gray-200">
            {yearlyData.map((period, periodIdx) => {
              const averageRating = period.average_rating || 0;
              const finalRating = period.final_rating || 0;
              const ratingInfo = getRatingLabel(finalRating);
              
              // Get calculation method for this period
              const calculationMethodName = getCalculationMethod(period.period);
              const isActualValueMethod = calculationMethodName.includes('Actual vs Target');
              const selfRatingEnabled = isSelfRatingEnabled(period.period);
              
              return (
                <div key={`yearly-${period.id}-${period.review_id}-${periodIdx}`} className="p-6 hover:bg-gray-50 border-l-4 border-red-500">\n                  <div className="flex items-start justify-between mb-4">\n                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {period.year || period.review_year} - Yearly
                        </h3>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          Yearly
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>Manager: {period.manager_name}</span>
                        {period.manager_signed_at && (
                          <span>Completed: {new Date(period.manager_signed_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-1">Average Rating</p>
                        <p className="text-lg font-semibold text-gray-700">{averageRating.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Final Rating</p>
                        <p className="text-3xl font-bold text-red-600">{finalRating.toFixed(2)}</p>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium mt-2 inline-block ${ratingInfo.color}`}>
                          {ratingInfo.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Calculation Method Info Card */}
                  <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <FiAlertCircle className="text-green-600 text-xl mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-green-900 mb-1">Review Configuration</h3>
                        <p className="text-sm text-green-800 mb-1">
                          <span className="font-medium">Calculation Method:</span>{' '}
                          <span className="font-semibold">{calculationMethodName}</span>
                        </p>
                        <p className="text-sm text-green-700">
                          <span className="font-medium">Employee Self-Rating:</span>{' '}
                          {selfRatingEnabled ? '✅ Enabled' : '❌ Disabled'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Calculation Breakdown */}
                  <div className="mt-4 bg-gray-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-700 mb-3">Rating Calculation:</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-300">
                            <th className="text-left py-2 px-3">KPI Item</th>
                            {!isActualValueMethod && (
                              <th className="text-right py-2 px-3">Manager Rating</th>
                            )}
                            <th className="text-right py-2 px-3">Goal Weight</th>
                            <th className="text-right py-2 px-3">Contribution</th>
                          </tr>
                        </thead>
                        <tbody>
                          {period.item_calculations && period.item_calculations.length > 0 ? (
                            period.item_calculations.map((calc, calcIdx) => (
                              <tr key={`yearly-calc-${period.id}-${calc.item_id}-${calcIdx}`} className="border-b border-gray-200">
                                <td className="py-2 px-3 text-gray-700">{calc.title || `Item ${calc.item_id}`}</td>
                                {!isActualValueMethod && (
                                  <td className="py-2 px-3 text-right font-semibold">{(calc.manager_rating || 0).toFixed(2)}</td>
                                )}
                                <td className="py-2 px-3 text-right">{((calc.goal_weight || 0) * 100).toFixed(0)}%</td>
                                <td className="py-2 px-3 text-right font-semibold text-red-600">{(calc.contribution || 0).toFixed(2)}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={isActualValueMethod ? 3 : 4} className="py-4 px-3 text-center text-gray-500 text-sm">
                                No calculation data available
                              </td>
                            </tr>
                          )}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 border-gray-400 font-semibold">
                            <td className="py-2 px-3">Total</td>
                            {!isActualValueMethod && (
                              <td className="py-2 px-3 text-right">-</td>
                            )}
                            <td className="py-2 px-3 text-right">{((period.total_weight || 0) * 100).toFixed(0)}%</td>
                            <td className="py-2 px-3 text-right">
                              <div className="text-gray-600 text-xs">Avg: {averageRating.toFixed(2)}</div>
                              <div className="text-red-600 font-bold">Final: {finalRating.toFixed(2)} ({ratingToPercent(finalRating).toFixed(0)}%)</div>
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => navigate(`/hr/kpi-details/${period.id}`)}
                      className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                    >
                      View Full Details →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No Data Message */}
      {filteredData.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-500">
          <p>No performance data available for the selected filters</p>
        </div>
      )}
    </div>
  );
};

export default EmployeePerformance;

