import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../services/api';
import { useToast } from '../../../context/ToastContext';
import { Button } from '../../../components/common/Button';
import { Card } from '../../../components/common/Card';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { PageContainer } from '../../../components/layout/PageContainer';
import { PageHeader } from '../../../components/layout/PageHeader';
import { ManagerRatingSubmission } from '../../../types';
import { FiCheckCircle, FiClock, FiStar } from 'react-icons/fi';

/**
 * Employee Manager Rating List Page
 * Shows all manager rating assignments for the employee
 */
export const EmployeeManagerRatingList: React.FC = () => {
  const toast = useToast();
  const [assignments, setAssignments] = useState<{
    total: number;
    pending: number;
    submitted: number;
    pendingList: ManagerRatingSubmission[];
    submittedList: ManagerRatingSubmission[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'submitted'>('pending');

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      
      const response = await api.get('/manager-rating/employee/assignments');
      
      setAssignments(response.data.data.assignments);
      
    } catch (error: any) {
      
      
      toast.error(error.response?.data?.error || 'Failed to fetch assignments');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  if (loading) {
    return (
      <PageContainer>
        <LoadingSpinner />
      </PageContainer>
    );
  }

  const pendingAssignments = assignments?.pendingList || [];
  const submittedAssignments = assignments?.submittedList || [];

  return (
    <PageContainer>
      <PageHeader
        title="Manager Rating"
        subtitle="Rate your manager and provide valuable feedback"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-blue-600">Total Assignments</p>
                <p className="text-2xl sm:text-3xl font-bold text-blue-900">{assignments?.total || 0}</p>
              </div>
              <FiStar className="h-10 w-10 sm:h-12 sm:w-12 text-blue-500" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100">
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-yellow-600">Pending</p>
                <p className="text-2xl sm:text-3xl font-bold text-yellow-900">{assignments?.pending || 0}</p>
              </div>
              <FiClock className="h-10 w-10 sm:h-12 sm:w-12 text-yellow-500" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-green-600">Completed</p>
                <p className="text-2xl sm:text-3xl font-bold text-green-900">{assignments?.submitted || 0}</p>
              </div>
              <FiCheckCircle className="h-10 w-10 sm:h-12 sm:w-12 text-green-500" />
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto">
            <button
              onClick={() => setActiveTab('pending')}
              className={`${
                activeTab === 'pending'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-2`}
            >
              <FiClock />
              Pending ({assignments?.pending || 0})
            </button>
            <button
              onClick={() => setActiveTab('submitted')}
              className={`${
                activeTab === 'submitted'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-2`}
            >
              <FiCheckCircle />
              Submitted ({assignments?.submitted || 0})
            </button>
          </nav>
        </div>
      </div>

      {/* Pending Assignments */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {pendingAssignments.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <FiCheckCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Ratings</h3>
                <p className="text-gray-500">You have no pending manager ratings at this time.</p>
              </div>
            </Card>
          ) : (
            pendingAssignments.map((assignment) => (
              <Card key={assignment.id} className="hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {assignment.template_name}
                      </h3>
                      {assignment.template_description && (
                        <p className="text-gray-600 text-sm mb-3">{assignment.template_description}</p>
                      )}

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Department:</span>
                          <span className="ml-2 font-medium">{assignment.department_name}</span>
                        </div>
                        {assignment.manager_name && (
                          <div>
                            <span className="text-gray-500">Manager:</span>
                            <span className="ml-2 font-medium">{assignment.manager_name}</span>
                          </div>
                        )}
                        {assignment.due_date && (
                          <div>
                            <span className="text-gray-500">Due Date:</span>
                            <span className={`ml-2 font-medium ${isOverdue(assignment.due_date) ? 'text-red-600' : ''}`}>
                              {formatDate(assignment.due_date)}
                              {isOverdue(assignment.due_date) && ' (Overdue)'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <Link to={`/employee/manager-rating/${assignment.assignment_id}`}>
                      <Button variant="primary">
                        <FiStar className="mr-2" />
                        Start Rating
                      </Button>
                    </Link>
                  </div>

                  {isOverdue(assignment.due_date) && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-800">
                        This rating is overdue. Please complete it as soon as possible.
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Submitted Assignments */}
      {activeTab === 'submitted' && (
        <div className="space-y-4">
          {submittedAssignments.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <FiStar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Submitted Ratings</h3>
                <p className="text-gray-500">You haven't submitted any manager ratings yet.</p>
              </div>
            </Card>
          ) : (
            submittedAssignments.map((assignment) => (
              <Card key={assignment.id} className="bg-green-50 border-green-200">
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FiCheckCircle className="h-5 w-5 text-green-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          {assignment.template_name}
                        </h3>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-gray-500">Submitted:</span>
                          <span className="ml-2 font-medium">{formatDate(assignment.submitted_at)}</span>
                        </div>
                        {assignment.overall_rating && (
                          <div>
                            <span className="text-gray-500">Overall Rating:</span>
                            <span className="ml-2 font-medium">
                              {Number(assignment.overall_rating).toFixed(2)} / 5.00 ({Number(assignment.overall_percentage || 0).toFixed(1)}%)
                            </span>
                          </div>
                        )}
                      </div>

                      {assignment.employee_comments && (
                        <div className="mt-3 p-3 bg-white rounded-md border border-gray-200">
                          <p className="text-sm text-gray-500 mb-1">Your Comments:</p>
                          <p className="text-sm text-gray-800">{assignment.employee_comments}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </PageContainer>
  );
};

export default EmployeeManagerRatingList;
