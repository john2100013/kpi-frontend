import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { KPI, KPIReview } from '../../types';
import { FiTarget, FiClock, FiCheckCircle, FiEye, FiFileText, FiSearch, FiBell, FiEdit } from 'react-icons/fi';
import PasswordChangeModal from '../../components/PasswordChangeModal';

const EmployeeDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [reviews, setReviews] = useState<KPIReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordChangeRequired, setPasswordChangeRequired] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    fetchData();
    
    // Check if password change is required
    const required = searchParams.get('passwordChangeRequired') === 'true' || 
                     localStorage.getItem('passwordChangeRequired') === 'true';
    if (required) {
      setPasswordChangeRequired(true);
      setShowPasswordModal(true);
    }
  }, [searchParams]);

  const fetchData = async () => {
    try {
      const [kpisRes, reviewsRes] = await Promise.all([
        api.get('/kpis'),
        api.get('/kpi-review'),
      ]);

      setKpis(kpisRes.data.kpis || []);
      setReviews(reviewsRes.data.reviews || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getKPIStage = (kpi: KPI): { stage: string; color: string; icon: React.ReactNode } => {
    const review = reviews.find(r => r.kpi_id === kpi.id);

    if (kpi.status === 'pending') {
      return {
        stage: 'KPI Setting - Awaiting Acknowledgement',
        color: 'bg-orange-100 text-orange-700',
        icon: <FiClock className="inline" />
      };
    }

    if (kpi.status === 'acknowledged' && !review) {
      return {
        stage: 'KPI Acknowledged - Review Pending',
        color: 'bg-blue-100 text-blue-700',
        icon: <FiFileText className="inline" />
      };
    }

    if (review) {
      if (review.review_status === 'awaiting_employee_confirmation') {
        return {
          stage: 'Awaiting Your Confirmation',
          color: 'bg-indigo-100 text-indigo-700',
          icon: <FiBell className="inline" />
        };
      }

      if (review.review_status === 'employee_submitted') {
        return {
          stage: 'Self-Rating Submitted - Awaiting Manager Review',
          color: 'bg-yellow-100 text-yellow-700',
          icon: <FiClock className="inline" />
        };
      }

      if (review.review_status === 'completed') {
        return {
          stage: 'KPI Review Completed',
          color: 'bg-green-100 text-green-700',
          icon: <FiCheckCircle className="inline" />
        };
      }

      if (review.review_status === 'rejected') {
        return {
          stage: 'Review Rejected',
          color: 'bg-red-100 text-red-700',
          icon: <FiEdit className="inline" />
        };
      }

      if (review.review_status === 'pending') {
        return {
          stage: 'KPI Review - Self-Rating Required',
          color: 'bg-purple-100 text-purple-700',
          icon: <FiFileText className="inline" />
        };
      }
    }

    return {
      stage: 'In Progress',
      color: 'bg-gray-100 text-gray-700',
      icon: <FiClock className="inline" />
    };
  };

  // Get unique periods for filter
  const uniquePeriods = Array.from(new Set(kpis.map(kpi => `${kpi.quarter} ${kpi.year}`))).sort();

  // Filter KPIs
  const filteredKpis = kpis.filter(kpi => {
    const matchesSearch = searchTerm === '' || 
      kpi.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPeriod = selectedPeriod === '' || 
      `${kpi.quarter} ${kpi.year}` === selectedPeriod;
    
    const stageInfo = getKPIStage(kpi);
    const matchesStatus = selectedStatus === '' || 
      stageInfo.stage.toLowerCase().includes(selectedStatus.toLowerCase());

    return matchesSearch && matchesPeriod && matchesStatus;
  });

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My KPIs</h1>
        <button
          onClick={() => navigate('/employee/kpi-list')}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          <FiEye className="text-lg" />
          <span>View All KPIs</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total KPIs</p>
              <p className="text-3xl font-bold text-gray-900">{kpis.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiTarget className="text-blue-600 text-2xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">KPI Review Completed</p>
              <p className="text-3xl font-bold text-gray-900">
                {kpis.filter(k => {
                  const review = reviews.find(r => r.kpi_id === k.id);
                  return review && (review.review_status === 'manager_submitted' || review.review_status === 'completed');
                }).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FiCheckCircle className="text-green-600 text-2xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">KPI Setting Completed</p>
              <p className="text-3xl font-bold text-gray-900">
                {kpis.filter(k => k.status === 'acknowledged').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FiFileText className="text-purple-600 text-2xl" />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Status Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">KPI Status Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Awaiting Acknowledgement */}
          <button
            onClick={() => {
              setSelectedStatus('awaiting acknowledgement');
              // Scroll to table
              document.querySelector('.overflow-x-auto')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className="bg-orange-50 border border-orange-200 rounded-lg p-4 hover:shadow-md transition-shadow text-left"
          >
            <div className="flex items-center space-x-2 mb-2">
              <FiClock className="text-orange-600" />
              <p className="text-xs font-medium text-orange-800">Awaiting Acknowledgement</p>
            </div>
            <p className="text-2xl font-bold text-orange-900">
              {kpis.filter(k => k.status === 'pending').length}
            </p>
          </button>

          {/* Review Pending */}
          <button
            onClick={() => {
              setSelectedStatus('review pending');
              document.querySelector('.overflow-x-auto')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-4 hover:shadow-md transition-shadow text-left"
          >
            <div className="flex items-center space-x-2 mb-2">
              <FiFileText className="text-blue-600" />
              <p className="text-xs font-medium text-blue-800">Review Pending</p>
            </div>
            <p className="text-2xl font-bold text-blue-900">
              {kpis.filter(k => {
                const review = reviews.find(r => r.kpi_id === k.id);
                return k.status === 'acknowledged' && !review;
              }).length}
            </p>
          </button>

          {/* Self-Rating Required */}
          <button
            onClick={() => {
              setSelectedStatus('self-rating required');
              document.querySelector('.overflow-x-auto')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className="bg-purple-50 border border-purple-200 rounded-lg p-4 hover:shadow-md transition-shadow text-left"
          >
            <div className="flex items-center space-x-2 mb-2">
              <FiFileText className="text-purple-600" />
              <p className="text-xs font-medium text-purple-800">Self-Rating Required</p>
            </div>
            <p className="text-2xl font-bold text-purple-900">
              {kpis.filter(k => {
                const review = reviews.find(r => r.kpi_id === k.id);
                return review && review.review_status === 'pending';
              }).length}
            </p>
          </button>

          {/* Awaiting Manager Review */}
          <button
            onClick={() => {
              setSelectedStatus('submitted');
              document.querySelector('.overflow-x-auto')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 hover:shadow-md transition-shadow text-left"
          >
            <div className="flex items-center space-x-2 mb-2">
              <FiClock className="text-yellow-600" />
              <p className="text-xs font-medium text-yellow-800">Awaiting Manager Review</p>
            </div>
            <p className="text-2xl font-bold text-yellow-900">
              {kpis.filter(k => {
                const review = reviews.find(r => r.kpi_id === k.id);
                return review && review.review_status === 'employee_submitted';
              }).length}
            </p>
          </button>

          {/* Awaiting Your Confirmation */}
          <button
            onClick={() => {
              setSelectedStatus('awaiting your confirmation');
              document.querySelector('.overflow-x-auto')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 hover:shadow-md transition-shadow text-left"
          >
            <div className="flex items-center space-x-2 mb-2">
              <FiBell className="text-indigo-600" />
              <p className="text-xs font-medium text-indigo-800">Awaiting Your Confirmation</p>
            </div>
            <p className="text-2xl font-bold text-indigo-900">
              {kpis.filter(k => {
                const review = reviews.find(r => r.kpi_id === k.id);
                return review && review.review_status === 'awaiting_employee_confirmation';
              }).length}
            </p>
          </button>

          {/* Review Completed */}
          <button
            onClick={() => {
              setSelectedStatus('completed');
              document.querySelector('.overflow-x-auto')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className="bg-green-50 border border-green-200 rounded-lg p-4 hover:shadow-md transition-shadow text-left"
          >
            <div className="flex items-center space-x-2 mb-2">
              <FiCheckCircle className="text-green-600" />
              <p className="text-xs font-medium text-green-800">Review Completed</p>
            </div>
            <p className="text-2xl font-bold text-green-900">
              {kpis.filter(k => {
                const review = reviews.find(r => r.kpi_id === k.id);
                return review && review.review_status === 'completed';
              }).length}
            </p>
          </button>

          {/* Review Rejected */}
          <button
            onClick={() => {
              setSelectedStatus('rejected');
              document.querySelector('.overflow-x-auto')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className="bg-red-50 border border-red-200 rounded-lg p-4 hover:shadow-md transition-shadow text-left"
          >
            <div className="flex items-center space-x-2 mb-2">
              <FiEdit className="text-red-600" />
              <p className="text-xs font-medium text-red-800">Review Rejected</p>
            </div>
            <p className="text-2xl font-bold text-red-900">
              {kpis.filter(k => {
                const review = reviews.find(r => r.kpi_id === k.id);
                return review && review.review_status === 'rejected';
              }).length}
            </p>
          </button>
        </div>
      </div>

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
                {uniquePeriods.map(period => (
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
                filteredKpis.map((kpi) => {
                  const stageInfo = getKPIStage(kpi);
                  const review = reviews.find(r => r.kpi_id === kpi.id);

                  return (
                    <tr key={kpi.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">{kpi.title}</p>
                          {kpi.items && kpi.items.length > 0 && (
                            <p className="text-xs text-gray-500 mt-1">
                              {kpi.items.length} KPI item{kpi.items.length > 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600">
                          {kpi.quarter} {kpi.year}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 w-fit ${stageInfo.color}`}>
                          {stageInfo.icon}
                          <span>{stageInfo.stage}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          {kpi.status === 'pending' ? (
                            <button
                              onClick={() => navigate(`/employee/kpi-acknowledgement/${kpi.id}`)}
                              className="px-3 py-1 rounded-lg bg-purple-600 text-white text-xs font-medium hover:bg-purple-700"
                            >
                              Acknowledge
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => navigate(`/employee/kpi-details/${kpi.id}`)}
                                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                              >
                                View
                              </button>
                              
                              {/* Show Review button if acknowledged and no review exists or review is pending */}
                              {kpi.status === 'acknowledged' && (!review || review.review_status === 'pending') && (
                                <>
                                  <span className="text-gray-300">|</span>
                                  <button
                                    onClick={() => navigate(`/employee/self-rating/${kpi.id}`)}
                                    className="px-3 py-1 rounded-lg bg-purple-600 text-white text-xs font-medium hover:bg-purple-700"
                                  >
                                    Review
                                  </button>
                                </>
                              )}

                              {/* Show Confirm button if review is awaiting employee confirmation */}
                              {review && review.review_status === 'awaiting_employee_confirmation' && (
                                <>
                                  <span className="text-gray-300">|</span>
                                  <button
                                    onClick={() => navigate(`/employee/kpi-confirmation/${review.id}`)}
                                    className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700"
                                  >
                                    Confirm
                                  </button>
                                </>
                              )}

                              {/* Show Edit button only after review is submitted (but not when awaiting confirmation) */}
                              {review && (review.review_status === 'employee_submitted') && (
                                <>
                                  <span className="text-gray-300">|</span>
                                  <button
                                    onClick={() => navigate(`/employee/self-rating/${kpi.id}`)}
                                    className="text-purple-600 hover:text-purple-700 font-medium text-sm"
                                  >
                                    Edit
                                  </button>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Password Change Modal */}
      <PasswordChangeModal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setPasswordChangeRequired(false);
        }}
        isRequired={passwordChangeRequired}
      />
    </div>
  );
};

export default EmployeeDashboard;

