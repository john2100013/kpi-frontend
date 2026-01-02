import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { KPI } from '../../types';
import { FiTarget, FiClock, FiCheckCircle, FiEye } from 'react-icons/fi';

const EmployeeDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKPIs();
  }, []);

  const fetchKPIs = async () => {
    try {
      const response = await api.get('/kpis');
      setKpis(response.data.kpis || []);
    } catch (error) {
      console.error('Error fetching KPIs:', error);
    } finally {
      setLoading(false);
    }
  };

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
              <p className="text-sm text-gray-600 mb-1">Pending</p>
              <p className="text-3xl font-bold text-gray-900">
                {kpis.filter(k => k.status === 'pending').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <FiClock className="text-orange-600 text-2xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Completed</p>
              <p className="text-3xl font-bold text-gray-900">
                {kpis.filter(k => k.status === 'completed' || k.status === 'acknowledged').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FiCheckCircle className="text-green-600 text-2xl" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">My KPIs</h2>
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
              {kpis.map((kpi) => (
                <tr key={kpi.id}>
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
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      kpi.status === 'completed' || kpi.status === 'acknowledged'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {kpi.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {kpi.status === 'pending' ? (
                      <button
                        onClick={() => navigate(`/employee/kpi-acknowledgement/${kpi.id}`)}
                        className="text-purple-600 hover:text-purple-700 font-medium text-sm"
                      >
                        Acknowledge
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate(`/employee/self-rating/${kpi.id}`)}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                      >
                        Review
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;

