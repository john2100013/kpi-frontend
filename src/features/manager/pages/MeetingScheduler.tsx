import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../../services/api';
import { useToast } from '../../../context/ToastContext';
import { User, KPI, KPIReview } from '../../../types';
import DatePicker from '../../../components/DatePicker';
import { FiArrowLeft, FiCalendar, FiSave, FiClock, FiMapPin, FiFileText } from 'react-icons/fi';

const MeetingScheduler: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { kpiId, reviewId } = useParams<{ kpiId?: string; reviewId?: string }>();
  const [employees, setEmployees] = useState<User[]>([]);
  // const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null); // Unused - keeping for potential future use
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [reviews, setReviews] = useState<KPIReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [meetingType, setMeetingType] = useState<'kpi_setting' | 'kpi_review'>('kpi_setting');
  const [selectedKpiId, setSelectedKpiId] = useState<number | null>(kpiId ? parseInt(kpiId) : null);
  const [selectedReviewId, setSelectedReviewId] = useState<number | null>(reviewId ? parseInt(reviewId) : null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [scheduledDate, setScheduledDate] = useState<Date | null>(new Date());
  const [scheduledTime, setScheduledTime] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedKpiId && meetingType === 'kpi_setting') {
      const kpi = kpis.find(k => k.id === selectedKpiId);
      if (kpi) {
        setSelectedEmployeeId(kpi.employee_id);
      }
    } else if (selectedReviewId && meetingType === 'kpi_review') {
      const review = reviews.find(r => r.id === selectedReviewId);
      if (review) {
        setSelectedEmployeeId(review.employee_id);
      }
    }
  }, [selectedKpiId, selectedReviewId, meetingType, kpis, reviews]);

  const fetchData = async () => {
    try {
      const [kpisRes, reviewsRes] = await Promise.all([
        // api.get('/employees').catch(() => ({ data: { employees: [] } })),
        api.get('/kpis').catch(() => ({ data: { kpis: [] } })),
        api.get('/kpi-review').catch(() => ({ data: { reviews: [] } })),
      ]);

      // setEmployees(employeesRes.data.employees || []);
      setKpis(kpisRes.data.kpis || []);
      setReviews(reviewsRes.data.reviews || []);

      // Pre-select if kpiId or reviewId is provided
      if (kpiId) {
        const kpi = (kpisRes.data.kpis || []).find((k: KPI) => k.id === parseInt(kpiId));
        if (kpi) {
          setMeetingType('kpi_setting');
          setSelectedKpiId(parseInt(kpiId));
        }
      } else if (reviewId) {
        const review = (reviewsRes.data.reviews || []).find((r: KPIReview) => r.id === parseInt(reviewId));
        if (review) {
          setMeetingType('kpi_review');
          setSelectedReviewId(parseInt(reviewId));
        }
      }
    } catch (error) {
      toast.error('Could not fetch meeting data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEmployeeId || !scheduledDate) {
      toast.warning('Please select an employee and meeting date');
      return;
    }

    setSaving(true);
    try {
      const meetingData: any = {
        employee_id: selectedEmployeeId,
        meeting_type: meetingType,
        scheduled_date: scheduledDate.toISOString().split('T')[0],
        scheduled_time: scheduledTime || null,
        location: location || null,
        notes: notes || null,
      };

      if (meetingType === 'kpi_setting' && selectedKpiId) {
        meetingData.kpi_id = selectedKpiId;
      } else if (meetingType === 'kpi_review' && selectedReviewId) {
        meetingData.review_id = selectedReviewId;
      }

      await api.post('/meetings', meetingData);
      toast.success('Meeting scheduled successfully! Email notifications have been sent.');
      navigate('/manager/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to schedule meeting');
    } finally {
      setSaving(false);
    }
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Schedule Meeting</h1>
          <p className="text-sm text-gray-600 mt-1">Schedule a KPI setting or review meeting</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        {/* Meeting Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Meeting Type *
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => {
                setMeetingType('kpi_setting');
                setSelectedReviewId(null);
              }}
              className={`p-4 border-2 rounded-lg text-left transition-colors ${
                meetingType === 'kpi_setting'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <FiCalendar className="text-2xl mb-2 text-purple-600" />
              <p className="font-semibold text-gray-900">KPI Setting Meeting</p>
              <p className="text-sm text-gray-500">Schedule a meeting to set KPIs with an employee</p>
            </button>
            <button
              type="button"
              onClick={() => {
                setMeetingType('kpi_review');
                setSelectedKpiId(null);
              }}
              className={`p-4 border-2 rounded-lg text-left transition-colors ${
                meetingType === 'kpi_review'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <FiFileText className="text-2xl mb-2 text-purple-600" />
              <p className="font-semibold text-gray-900">KPI Review Meeting</p>
              <p className="text-sm text-gray-500">Schedule a meeting to review employee KPIs</p>
            </button>
          </div>
        </div>

        {/* Employee Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Employee *
          </label>
          <select
            value={selectedEmployeeId || ''}
            onChange={(e) => {
              const empId = parseInt(e.target.value);
              setSelectedEmployeeId(empId);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            required
          >
            <option value="">Select Employee</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} - {emp.department} ({emp.payroll_number})
              </option>
            ))}
          </select>
        </div>

        {/* KPI Selection (for KPI Setting meetings) */}
        {meetingType === 'kpi_setting' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Related KPI (Optional)
            </label>
            <select
              value={selectedKpiId || ''}
              onChange={(e) => setSelectedKpiId(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="">No specific KPI</option>
              {kpis
                .filter(k => !selectedEmployeeId || k.employee_id === selectedEmployeeId)
                .map((kpi) => (
                  <option key={kpi.id} value={kpi.id}>
                    {kpi.title} - {kpi.quarter} {kpi.year}
                  </option>
                ))}
            </select>
          </div>
        )}

        {/* Review Selection (for KPI Review meetings) */}
        {meetingType === 'kpi_review' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Related Review (Optional)
            </label>
            <select
              value={selectedReviewId || ''}
              onChange={(e) => setSelectedReviewId(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="">No specific review</option>
              {reviews
                .filter(r => !selectedEmployeeId || r.employee_id === selectedEmployeeId)
                .map((review) => (
                  <option key={review.id} value={review.id}>
                    Review #{review.id} - {review.review_quarter} {review.review_year}
                  </option>
                ))}
            </select>
          </div>
        )}

        {/* Date and Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <DatePicker
              label="Meeting Date *"
              value={scheduledDate || undefined}
              onChange={setScheduledDate}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FiClock className="inline mr-2" />
              Meeting Time (Optional)
            </label>
            <input
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FiMapPin className="inline mr-2" />
            Location (Optional)
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., Conference Room A, Teams Meeting Link"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FiFileText className="inline mr-2" />
            Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional notes or agenda items..."
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center space-x-2"
          >
            <FiSave className="text-lg" />
            <span>{saving ? 'Saving...' : 'Schedule Meeting'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default MeetingScheduler;

