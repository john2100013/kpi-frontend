import React, { useState, useEffect } from 'react';
import { FiUsers, FiTrendingUp, FiDollarSign, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '../../../components/common';
import { useToast } from '../../../context/ToastContext';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  fetchEmployeeBonuses,
  updateBonusStatus,
  setCurrentBonus,
} from '../../../store/slices/bonusSlice';
import type { EmployeeBonus } from '../../../services/bonusApi';
import { BonusAdjustmentModal } from '../components';
import { BonusMultipliers } from '../BonusMultipliers';
import api from '../../../services/api';

interface PeriodSetting {
  id: number;
  period_type: 'quarterly' | 'yearly';
  quarter?: string;
  year: number;
  is_active: boolean;
}

const BonusManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const { employeeBonuses, loading } = useAppSelector((state) => state.bonus);

  const [activeTab, setActiveTab] = useState<'bonuses' | 'multipliers' | 'rating-options'>('bonuses');
  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);
  const [selectedBonus, setSelectedBonus] = useState<EmployeeBonus | null>(null);
  
  // Period filtering
  const [periodType, setPeriodType] = useState<'quarterly' | 'yearly'>('quarterly');
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);
  const [quarterlyPeriods, setQuarterlyPeriods] = useState<PeriodSetting[]>([]);
  const [yearlyPeriods, setYearlyPeriods] = useState<PeriodSetting[]>([]);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  // Bulk selection
  const [selectedBonusIds, setSelectedBonusIds] = useState<number[]>([]);
  const [bulkAdjustmentMode, setBulkAdjustmentMode] = useState(false);

  useEffect(() => {
    // Load initial data
    fetchAvailablePeriods();
  }, []);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, activeTab, selectedPeriodId, periodType]);

 

  // Fetch available periods
  const fetchAvailablePeriods = async () => {
    try {
      const [quarterlyRes, yearlyRes] = await Promise.all([
        api.get('/settings/available-periods', { params: { period_type: 'quarterly' } }),
        api.get('/settings/available-periods', { params: { period_type: 'yearly' } })
      ]);

      const quarterlyData = quarterlyRes.data.periods || [];
      const yearlyData = yearlyRes.data.periods || [];

      setQuarterlyPeriods(quarterlyData);
      setYearlyPeriods(yearlyData);

      // Set default selected period to the first available one
      if (periodType === 'quarterly' && quarterlyData.length > 0 && !selectedPeriodId) {
        setSelectedPeriodId(quarterlyData[0].id);
      } else if (periodType === 'yearly' && yearlyData.length > 0 && !selectedPeriodId) {
        setSelectedPeriodId(yearlyData[0].id);
      }
    } catch (error) {
      toast.error('Unable to load bonus periods. Please refresh the page.');
    }
  };

  const handlePeriodTypeChange = (type: 'quarterly' | 'yearly') => {
    setPeriodType(type);
    // Reset to first period of selected type
    const periods = type === 'quarterly' ? quarterlyPeriods : yearlyPeriods;
    if (periods.length > 0) {
      setSelectedPeriodId(periods[0].id);
    }
  };

  const handlePeriodChange = (periodId: number) => {
    setSelectedPeriodId(periodId);
  };

  // Get period info for filtering bonuses
  const getSelectedPeriodInfo = () => {
    const periods = periodType === 'quarterly' ? quarterlyPeriods : yearlyPeriods;
    return periods.find(p => p.id === selectedPeriodId);
  };

  const loadData = () => {
    if (activeTab === 'bonuses') {
      const periodInfo = getSelectedPeriodInfo();
      const filters: any = {};
      
      if (periodInfo) {
        filters.year = periodInfo.year;
        if (periodType === 'quarterly' && periodInfo.quarter) {
          filters.quarter = periodInfo.quarter;
        }
      }
      
      if (statusFilter) filters.paymentStatus = statusFilter;
      dispatch(fetchEmployeeBonuses(filters));
    }
  };

  const handleStatusChange = async (bonusId: number, status: any) => {
    try {
      await dispatch(updateBonusStatus({ bonusId, status })).unwrap();
      toast.success('Bonus status updated successfully');
      // Reload data to refresh employee information
      loadData();
    } catch (error: any) {
      toast.error(error || 'Failed to update bonus status');
    }
  };

  const handleBulkStatusChange = async (status: 'pending' | 'paid' | 'rejected') => {
    if (selectedBonusIds.length === 0) {
      toast.error('Please select at least one bonus');
      return;
    }
    
    try {
      // Update all selected bonuses
      await Promise.all(
        selectedBonusIds.map(bonusId => 
          dispatch(updateBonusStatus({ bonusId, status })).unwrap()
        )
      );
      toast.success(`${selectedBonusIds.length} bonus(es) status updated successfully`);
      setSelectedBonusIds([]);
      loadData();
    } catch (error: any) {
      toast.error(error || 'Failed to update bonus statuses');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedBonusIds(employeeBonuses.map(b => b.id));
    } else {
      setSelectedBonusIds([]);
    }
  };

  const handleSelectBonus = (bonusId: number, checked: boolean) => {
    if (checked) {
      setSelectedBonusIds(prev => [...prev, bonusId]);
    } else {
      setSelectedBonusIds(prev => prev.filter(id => id !== bonusId));
    }
  };

  const handleBulkAdjust = () => {
    if (selectedBonusIds.length === 0) {
      toast.error('Please select at least one bonus');
      return;
    }
    setBulkAdjustmentMode(true);
    setAdjustmentModalOpen(true);
  };

  const handleAdjustBonus = (bonus: EmployeeBonus) => {
    setSelectedBonus(bonus);
    dispatch(setCurrentBonus(bonus));
    setAdjustmentModalOpen(true);
  };

  const handleAdjustmentModalClose = () => {
    setAdjustmentModalOpen(false);
    setSelectedBonus(null);
    setBulkAdjustmentMode(false);
    setSelectedBonusIds([]);
    dispatch(setCurrentBonus(null));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-blue-600 bg-blue-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-yellow-600 bg-yellow-100'; // pending
    }
  };

  const formatCurrency = (amount: number | string | null | undefined, currency: string = 'KES') => {
    if (amount == null) return 'N/A';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return 'N/A';
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: currency
    }).format(numAmount);
  };

  if (loading && employeeBonuses.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading bonus data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bonus Management</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage employee bonuses and multipliers
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-600 truncate">Total Employees</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{employeeBonuses.length}</p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg ml-2">
              <FiUsers className="w-4 h-4 text-purple-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-600 truncate">Pending Bonuses</p>
              <p className="text-xl font-bold text-gray-900 mt-1">
                {employeeBonuses.filter(b => b.payment_status === 'pending').length}
              </p>
            </div>
            <div className="p-2 bg-yellow-100 rounded-lg ml-2">
              <FiUsers className="w-4 h-4 text-yellow-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-600 truncate">Total Pending Amount</p>
              <p className="text-lg font-bold text-gray-900 mt-1 truncate">
                {formatCurrency(
                  employeeBonuses
                    .filter(b => b.payment_status === 'pending')
                    .reduce((sum, b) => sum + parseFloat(String(b.final_bonus_amount || b.calculated_bonus_amount || 0)), 0)
                )}
              </p>
            </div>
            <div className="p-2 bg-orange-100 rounded-lg ml-2">
              <FiDollarSign className="w-4 h-4 text-orange-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-600 truncate">Employees Paid</p>
              <p className="text-xl font-bold text-gray-900 mt-1">
                {employeeBonuses.filter(b => b.payment_status === 'paid').length}
              </p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg ml-2">
              <FiCheckCircle className="w-4 h-4 text-blue-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-600 truncate">Total Paid Amount</p>
              <p className="text-lg font-bold text-gray-900 mt-1 truncate">
                {formatCurrency(
                  employeeBonuses
                    .filter(b => b.payment_status === 'paid')
                    .reduce((sum, b) => sum + parseFloat(String(b.final_bonus_amount || b.calculated_bonus_amount || 0)), 0)
                )}
              </p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg ml-2">
              <FiTrendingUp className="w-4 h-4 text-green-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-600 truncate">Rejected Bonuses</p>
              <p className="text-xl font-bold text-gray-900 mt-1">
                {employeeBonuses.filter(b => b.payment_status === 'rejected').length}
              </p>
            </div>
            <div className="p-2 bg-red-100 rounded-lg ml-2">
              <FiXCircle className="w-4 h-4 text-red-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('bonuses')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'bonuses'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Employee Bonuses
        </button>
        <button
          onClick={() => setActiveTab('multipliers')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'multipliers'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Multipliers
        </button>
        <button
          onClick={() => setActiveTab('rating-options')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'rating-options'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Rating Options
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        {activeTab === 'bonuses' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Period Type</label>
              <select
                value={periodType}
                onChange={(e) => handlePeriodTypeChange(e.target.value as 'quarterly' | 'yearly')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {periodType === 'quarterly' ? 'Select Quarter' : 'Select Year'}
              </label>
              <select
                value={selectedPeriodId || ''}
                onChange={(e) => handlePeriodChange(parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                disabled={(periodType === 'quarterly' ? quarterlyPeriods : yearlyPeriods).length === 0}
              >
                {periodType === 'quarterly' ? (
                  quarterlyPeriods.length > 0 ? (
                    quarterlyPeriods.map((period) => (
                      <option key={period.id} value={period.id}>
                        {period.quarter} {period.year}
                      </option>
                    ))
                  ) : (
                    <option value="">No quarterly periods available</option>
                  )
                ) : (
                  yearlyPeriods.length > 0 ? (
                    yearlyPeriods.map((period) => (
                      <option key={period.id} value={period.id}>
                        {period.year}
                      </option>
                    ))
                  ) : (
                    <option value="">No yearly periods available</option>
                  )
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </>
        )}
      </div>

      {/* Content */}
      {activeTab === 'bonuses' && (
        <Card className="overflow-hidden">
          {/* Bulk Actions Bar */}
          {selectedBonusIds.length > 0 && (
            <div className="bg-purple-50 border-b border-purple-200 px-6 py-3 flex items-center justify-between">
              <span className="text-sm font-medium text-purple-900">
                {selectedBonusIds.length} selected
              </span>
              <div className="flex items-center space-x-3">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleBulkStatusChange(e.target.value as 'pending' | 'paid' | 'rejected');
                      e.target.value = '';
                    }
                  }}
                  className="px-3 py-1.5 text-sm border border-purple-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Update Status...</option>
                  <option value="pending">Set to Pending</option>
                  <option value="paid">Set to Paid</option>
                  <option value="rejected">Set to Rejected</option>
                </select>
                <Button
                  onClick={handleBulkAdjust}
                  variant="secondary"
                  size="sm"
                >
                  Bulk Adjust
                </Button>
                <button
                  onClick={() => setSelectedBonusIds([])}
                  className="text-sm text-purple-600 hover:text-purple-800"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedBonusIds.length === employeeBonuses.length && employeeBonuses.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Performance Details</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Sales Bonus</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">KPI Bonus</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Total Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {employeeBonuses.map((bonus) => (
                  <tr key={bonus.id} className={`hover:bg-gray-50 ${selectedBonusIds.includes(bonus.id) ? 'bg-purple-50' : ''}`}>
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedBonusIds.includes(bonus.id)}
                        onChange={(e) => handleSelectBonus(bonus.id, e.target.checked)}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{bonus.employee_name}</div>
                      <div className="text-sm text-gray-600">{bonus.department_name}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {bonus.has_sales_component ? 
                          'Sales + KPI Employee' : 
                          'KPI Only Employee'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-600">
                        {bonus.has_sales_component ? 'Sales + KPI' : 'KPI Only'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {bonus.sales_percentage != null && !isNaN(parseFloat(String(bonus.sales_percentage))) && (
                          <div className="text-xs text-gray-700">
                            <span className="font-medium">Sales:</span> {parseFloat(String(bonus.sales_percentage)).toFixed(2)}%
                            {bonus.sales_multiplier != null && !isNaN(parseFloat(String(bonus.sales_multiplier))) && (
                              <span className="text-gray-500"> (×{parseFloat(String(bonus.sales_multiplier)).toFixed(4)})</span>
                            )}
                          </div>
                        )}
                        {bonus.average_non_sales_rating !== null && bonus.average_non_sales_rating !== undefined && !isNaN(parseFloat(String(bonus.average_non_sales_rating))) && (
                          <div className="text-xs text-gray-700">
                            <span className="font-medium">Avg KPI Rating:</span> {parseFloat(String(bonus.average_non_sales_rating)).toFixed(3)}
                            <span className="text-gray-500"> (max: 1.25)</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {bonus.sales_bonus_amount != null && parseFloat(String(bonus.sales_bonus_amount)) > 0 ? (
                        <div className="font-medium text-gray-900">{formatCurrency(bonus.sales_bonus_amount)}</div>
                      ) : (
                        <div className="text-sm text-gray-400">-</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {bonus.kpi_bonus_amount != null && parseFloat(String(bonus.kpi_bonus_amount)) > 0 ? (
                        <div className="font-medium text-gray-900">{formatCurrency(bonus.kpi_bonus_amount)}</div>
                      ) : bonus.calculated_bonus_amount != null ? (
                        <div className="font-medium text-gray-900">{formatCurrency(bonus.calculated_bonus_amount)}</div>
                      ) : (
                        <div className="text-sm text-gray-400">-</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {formatCurrency(bonus.final_bonus_amount || bonus.calculated_bonus_amount)}
                      </div>
                      {bonus.adjustment_reason && (
                        <div className="text-xs text-orange-600 mt-1">Adjusted</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={bonus.payment_status}
                        onChange={(e) => handleStatusChange(bonus.id, e.target.value)}
                        className={`px-2 py-1 text-xs font-medium rounded-full border-0 ${getStatusColor(bonus.payment_status)}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <Button
                        onClick={() => handleAdjustBonus(bonus)}
                        variant="outline"
                        size="sm"
                      >
                        Adjust
                      </Button>
                    </td>
                  </tr>
                ))}
                {employeeBonuses.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center">
                      <div className="space-y-3">
                        <p className="text-gray-500">No bonuses found for the selected filters.</p>
                        <p className="text-sm text-gray-400">
                          Bonuses are automatically calculated when KPI reviews are completed and approved.
                          <br />
                          Make sure you have:
                        </p>
                        <ul className="text-sm text-gray-400 list-disc list-inside">
                          <li>Configured employee variable amounts in User Management</li>
                          <li>Completed KPI reviews for employees</li>
                          <li>Configured bonus multipliers in the Multipliers tab</li>
                        </ul>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Multipliers Tab */}
      {activeTab === 'multipliers' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Achievement Multipliers</h2>
              <p className="text-sm text-gray-600 mt-1">
                Define multipliers for different achievement percentage ranges
              </p>
            </div>
          </div>
          <BonusMultipliers />
        </div>
      )}

      {/* Rating Options Tab */}
      {activeTab === 'rating-options' && (
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">KPI Rating Options</h2>
              <p className="text-sm text-gray-600 mt-1">
                Configure rating options for KPI evaluations (e.g., 0, 1, 1.25)
              </p>
            </div>
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">
                Rating options are managed in the HR Settings page under the "Rating Options" tab.
                These options are used for bonus calculations based on manager ratings.
              </p>
              <Button 
                onClick={() => navigate('/hr/settings#rating-options')}
                variant="primary"
              >
                Go to Settings - Rating Options
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Modals */}
      {adjustmentModalOpen && !bulkAdjustmentMode && selectedBonus && (
        <BonusAdjustmentModal
          isOpen={adjustmentModalOpen}
          onClose={handleAdjustmentModalClose}
          bonus={selectedBonus}
          onSuccess={loadData}
        />
      )}
      
      {adjustmentModalOpen && bulkAdjustmentMode && selectedBonusIds.length > 0 && (
        <BonusAdjustmentModal
          isOpen={adjustmentModalOpen}
          onClose={handleAdjustmentModalClose}
          bonus={employeeBonuses.find(b => b.id === selectedBonusIds[0])!}
          onSuccess={() => {
            loadData();
            setSelectedBonusIds([]);
          }}
          isBulk={true}
          selectedBonusIds={selectedBonusIds}
        />
      )}
    </div>
  );
};

export default BonusManagement;
