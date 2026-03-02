import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../../services/api';
import { useToast } from '../../../context/ToastContext';
import { Button } from '../../../components/common/Button';
import { Card } from '../../../components/common/Card';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { PageContainer } from '../../../components/layout/PageContainer';
import { 
  FiArrowLeft, 
  FiMail,
  FiCheckCircle,
  FiClock,
  FiEye,
  FiSearch
} from 'react-icons/fi';
import { ManagerRatingNav } from '../components';

interface Submission {
  id: number;
  employee_id: number;
  employee_name: string;
  employee_email: string;
  status: 'pending' | 'submitted' | 'reviewed';
  submitted_at: string | null;
  overall_rating: number | null;
  overall_percentage: number | null;
}

interface AssignmentDetails {
  id: number;
  template_name: string;
  department_name: string;
  due_date: string;
  total_employees: number;
  submitted_count: number;
  pending_count: number;
}

/**
 * HR Manager Rating Submissions Page
 * View all employee submissions for a specific assignment
 */
export const ManagerRatingSubmissions: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [assignment, setAssignment] = useState<AssignmentDetails | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [assignmentRes, submissionsRes] = await Promise.all([
        api.get(`/manager-rating/assignments/${id}`),
        api.get(`/manager-rating/assignments/${id}/submissions`)
      ]);

      
      setAssignment(assignmentRes.data.data.assignment);
      
      // Backend returns { total, submitted, pending, submittedList, pendingList }
      // We need to combine both lists into a single array
      const submissionsData = submissionsRes.data.data;
      const allSubmissions = [
        ...(submissionsData.submittedList || []),
        ...(submissionsData.pendingList || [])
      ];
      
      
      
      setSubmissions(allSubmissions);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Unable to load manager rating submissions. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminders = async () => {
    const pendingSubmissions = submissions.filter(s => s.status === 'pending');
    
    if (pendingSubmissions.length === 0) {
      toast.error('No pending submissions to send reminders to');
      return;
    }

    if (!window.confirm(`Send reminder emails to ${pendingSubmissions.length} employee${pendingSubmissions.length > 1 ? 's' : ''}?`)) {
      return;
    }

    try {
      setSendingReminder(true);
      await api.post(`/manager-rating/assignments/${id}/send-reminders`);
      toast.success(`Reminder emails sent to ${pendingSubmissions.length} employee${pendingSubmissions.length > 1 ? 's' : ''}`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to send reminders');
    } finally {
      setSendingReminder(false);
    }
  };

  const handleBack = () => {
    navigate('/hr/manager-rating/assignments');
  };

  const getFilteredSubmissions = () => {
    let filtered = submissions;

    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(s => s.status === filter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.employee_name.toLowerCase().includes(query) ||
        s.employee_email.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  const filteredSubmissions = getFilteredSubmissions();

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </PageContainer>
    );
  }

  if (!assignment) {
    return (
      <PageContainer>
        <Card>
          <div className="p-12 text-center">
            <p className="text-gray-600">Assignment not found</p>
            <Button onClick={handleBack} variant="secondary" className="mt-4">
              Go Back
            </Button>
          </div>
        </Card>
      </PageContainer>
    );
  }

  const isOverdue = new Date(assignment.due_date) < new Date();
  const completionPercentage = assignment.total_employees > 0
    ? Math.round((assignment.submitted_count / assignment.total_employees) * 100)
    : 0;

  return (
    <PageContainer>
      <ManagerRatingNav />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button onClick={handleBack} variant="ghost" icon={FiArrowLeft} className="p-2" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Submission Details</h1>
              <p className="text-sm text-gray-600 mt-1">
                {assignment.template_name} - {assignment.department_name}
              </p>
            </div>
          </div>
          {assignment.pending_count > 0 && (
            <Button 
              onClick={handleSendReminders} 
              variant="secondary" 
              icon={FiMail}
              loading={sendingReminder}
              disabled={sendingReminder}
            >
              Send Reminders ({assignment.pending_count})
            </Button>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="p-4">
              <p className="text-sm text-gray-600">Total Employees</p>
              <p className="text-2xl font-bold text-gray-900">{assignment.total_employees}</p>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <p className="text-sm text-gray-600">Submitted</p>
              <p className="text-2xl font-bold text-green-600">{assignment.submitted_count}</p>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{assignment.pending_count}</p>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <p className="text-sm text-gray-600">Completion</p>
              <p className="text-2xl font-bold text-blue-600">{completionPercentage}%</p>
            </div>
          </Card>
        </div>

        {/* Progress Bar */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">Overall Progress</h3>
              <span className="text-sm font-medium text-gray-900">{completionPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  completionPercentage === 100
                    ? 'bg-green-500'
                    : completionPercentage > 50
                    ? 'bg-blue-500'
                    : 'bg-yellow-500'
                }`}
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-600">
              <span>Due: {new Date(assignment.due_date).toLocaleDateString()}</span>
              {isOverdue && assignment.pending_count > 0 && (
                <span className="text-red-600 font-medium">Overdue</span>
              )}
            </div>
          </div>
        </Card>

        {/* Filters */}
        <Card>
          <div className="p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'all'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All ({submissions.length})
                </button>
                <button
                  onClick={() => setFilter('submitted')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'submitted'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Submitted ({submissions.filter(s => s.status === 'submitted').length})
                </button>
                <button
                  onClick={() => setFilter('pending')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'pending'
                      ? 'bg-yellow-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Pending ({submissions.filter(s => s.status === 'pending').length})
                </button>
              </div>

              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or email..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full md:w-64"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Submissions Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      {searchQuery ? 'No matching submissions found' : 'No submissions yet'}
                    </td>
                  </tr>
                ) : (
                  filteredSubmissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {submission.employee_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {submission.employee_email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {submission.status === 'submitted' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <FiCheckCircle className="mr-1" size={12} />
                            Submitted
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <FiClock className="mr-1" size={12} />
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {submission.submitted_at
                          ? new Date(submission.submitted_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {submission.overall_rating !== null && submission.overall_rating !== undefined ? (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900">
                              {Number(submission.overall_rating).toFixed(2)} / 5.00
                            </span>
                            <span className="text-xs text-gray-500">
                              ({Number(submission.overall_percentage || 0).toFixed(0)}%)
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {submission.status === 'submitted' ? (
                          <Link to={`/hr/manager-rating/results/${submission.id}`}>
                            <Button variant="ghost" icon={FiEye} size="sm">
                              View Details
                            </Button>
                          </Link>
                        ) : (
                          <span className="text-gray-400 text-xs">No data</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
};

export default ManagerRatingSubmissions;
