import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { KPI, KPIReview } from '../../types';
import { FiArrowLeft, FiCheckCircle, FiClock, FiFileText, FiEye, FiUser } from 'react-icons/fi';

const ManagerKPIList: React.FC = () => {
  const navigate = useNavigate();
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [reviews, setReviews] = useState<KPIReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

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
    // Find review for this KPI
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
      if (review.review_status === 'employee_submitted') {
        return {
          stage: 'Self-Rating Submitted - Awaiting Manager Review',
          color: 'bg-yellow-100 text-yellow-700',
          icon: <FiClock className="inline" />
        };
      }

      if (review.review_status === 'manager_submitted' || review.review_status === 'completed') {
        return {
          stage: 'KPI Review Completed',
          color: 'bg-green-100 text-green-700',
          icon: <FiCheckCircle className="inline" />
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

  const filteredKPIs = kpis.filter((kpi) =>
    kpi.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    kpi.employee_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    kpi.employee_department?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

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
            Team KPIs ({filteredKPIs.length})
          </h2>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredKPIs.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No KPIs found
            </div>
          ) : (
            filteredKPIs.map((kpi) => {
              const stageInfo = getKPIStage(kpi);
              return (
                <button
                  key={kpi.id}
                  onClick={() => navigate(`/manager/kpi-details/${kpi.id}`)}
                  className="w-full p-6 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-gray-900 text-lg">{kpi.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${stageInfo.color}`}>
                          {stageInfo.icon}
                          <span>{stageInfo.stage}</span>
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 mb-2">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <FiUser className="text-gray-400" />
                          <span>{kpi.employee_name}</span>
                        </div>
                        <span className="text-sm text-gray-500">{kpi.employee_department}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{kpi.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Period: {kpi.quarter} {kpi.year}</span>
                        <span>Target: {kpi.target_value} {kpi.measure_unit}</span>
                        {kpi.meeting_date && (
                          <span>Meeting: {new Date(kpi.meeting_date).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      <FiEye className="text-gray-400 text-xl" />
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagerKPIList;

