import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../../../context/ToastContext';
import { Button } from '../../../components/common/Button';
import { Card } from '../../../components/common/Card';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { PageContainer } from '../../../components/layout/PageContainer';
import { PageHeader } from '../../../components/layout/PageHeader';
import { ManagerRatingNav } from '../components';
import { 
  FiPlus, 
  FiUsers, 
  FiCalendar, 
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiEye,
  FiMail,
  FiTrash2,
  FiFileText,
  FiSettings
} from 'react-icons/fi';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { 
  fetchAssignments, 
  deleteAssignment,
  setAssignmentsFilter,
  selectAssignments, 
  selectAssignmentsLoading, 
  selectAssignmentsError,
  selectAssignmentsFilter,
  type Assignment
} from '../../../store/slices/managerRatingSlice';

/**
 * HR Manager Rating Assignments Page
 * Lists all manager rating assignments with stats
 */
export const ManagerRatingAssignments: React.FC = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  
  // Redux selectors
  const assignments = useAppSelector(selectAssignments);
  const loading = useAppSelector(selectAssignmentsLoading);
  const error = useAppSelector(selectAssignmentsError);
  const filter = useAppSelector(selectAssignmentsFilter);

  useEffect(() => {
    dispatch(fetchAssignments(false));
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error, toast]);

  const handleDelete = async (assignmentId: number) => {
    if (!window.confirm('Are you sure you want to delete this assignment? This will remove all associated submissions.')) {
      return;
    }

    try {
      await dispatch(deleteAssignment(assignmentId)).unwrap();
      toast.success('Assignment deleted successfully');
    } catch (error: any) {
      toast.error(error || 'Failed to delete assignment');
    }
  };

  const getStatusInfo = (assignment: Assignment) => {
    const now = new Date();
    const dueDate = assignment.due_date ? new Date(assignment.due_date) : null;
    const isOverdue = dueDate && dueDate < now && (assignment.pending_count || 0) > 0;
    const isCompleted = (assignment.submitted_count || 0) === (assignment.total_employees || 0);

    if (isCompleted) {
      return {
        status: 'completed',
        label: 'Completed',
        icon: FiCheckCircle,
        color: 'text-green-600 bg-green-100'
      };
    } else if (isOverdue) {
      return {
        status: 'overdue',
        label: 'Overdue',
        icon: FiAlertCircle,
        color: 'text-red-600 bg-red-100'
      };
    } else {
      return {
        status: 'active',
        label: 'In Progress',
        icon: FiClock,
        color: 'text-blue-600 bg-blue-100'
      };
    }
  };

  const getFilteredAssignments = () => {
    if (filter === 'all') return assignments;
    
    return assignments.filter(assignment => {
      const statusInfo = getStatusInfo(assignment);
      return statusInfo.status === filter;
    });
  };

  const filteredAssignments = getFilteredAssignments();

  const stats = {
    total: assignments.length,
    active: assignments.filter(a => getStatusInfo(a).status === 'active').length,
    completed: assignments.filter(a => getStatusInfo(a).status === 'completed').length,
    overdue: assignments.filter(a => getStatusInfo(a).status === 'overdue').length,
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Manager Rating"
        subtitle="Manage and track manager rating assignments across departments"
        actions={
          <Link to="/hr/manager-rating/assignments/create">
            <Button variant="primary" icon={FiPlus}>
              New Assignment
            </Button>
          </Link>
        }
      />

      <ManagerRatingNav />

      {/* Quick Actions */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FiFileText className="text-blue-600 text-xl" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Create Template</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Design a new manager rating template with custom sections and questions
                  </p>
                  <Link to="/hr/manager-rating/templates/create">
                    <Button variant="primary" icon={FiPlus} size="sm">
                      Create New Template
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <FiUsers className="text-purple-600 text-xl" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Assign to Departments</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Assign rating templates to departments for employee feedback
                  </p>
                  <Link to="/hr/manager-rating/assignments/create">
                    <Button variant="primary" icon={FiPlus} size="sm">
                      Create Assignment
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <FiSettings className="text-indigo-600 text-xl" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Rating Options</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Manage rating scales (1-5) and customize evaluation criteria
                  </p>
                  <Link to="/hr/manager-rating/options">
                    <Button variant="primary" icon={FiSettings} size="sm">
                      Manage Options
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className={filter === 'all' ? 'ring-2 ring-blue-500' : ''}>
          <button
            onClick={() => dispatch(setAssignmentsFilter('all'))}
            className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Assignments</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <FiUsers className="text-gray-400 text-2xl" />
            </div>
          </button>
        </Card>

        <Card className={filter === 'active' ? 'ring-2 ring-blue-500' : ''}>
          <button
            onClick={() => dispatch(setAssignmentsFilter('active'))}
            className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{stats.active}</p>
              </div>
              <FiClock className="text-blue-400 text-2xl" />
            </div>
          </button>
        </Card>

        <Card className={filter === 'completed' ? 'ring-2 ring-blue-500' : ''}>
          <button
            onClick={() => dispatch(setAssignmentsFilter('completed'))}
            className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <FiCheckCircle className="text-green-400 text-2xl" />
            </div>
          </button>
        </Card>

        <Card className={filter === 'overdue' ? 'ring-2 ring-blue-500' : ''}>
          <button
            onClick={() => dispatch(setAssignmentsFilter('overdue'))}
            className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
              </div>
              <FiAlertCircle className="text-red-400 text-2xl" />
            </div>
          </button>
        </Card>
      </div>

      {/* Assignments List */}
      <div className="space-y-4">
        {filteredAssignments.length === 0 ? (
          <Card>
            <div className="p-12 text-center">
              <FiUsers className="mx-auto text-gray-400 text-5xl mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filter === 'all' ? 'No assignments yet' : `No ${filter} assignments`}
              </h3>
              <p className="text-gray-600 mb-6">
                {filter === 'all' 
                  ? 'Create your first assignment to start collecting manager ratings from employees.'
                  : 'Try selecting a different filter to view other assignments.'
                }
              </p>
              {filter === 'all' && (
                <Link to="/hr/manager-rating/assignments/create">
                  <Button variant="primary" icon={FiPlus}>
                    Create Assignment
                  </Button>
                </Link>
              )}
            </div>
          </Card>
        ) : (
          filteredAssignments.map((assignment) => {
            const statusInfo = getStatusInfo(assignment);
            const StatusIcon = statusInfo.icon;
            const completionPercentage = (assignment.total_employees || 0) > 0
              ? Math.round(((assignment.submitted_count || 0) / (assignment.total_employees || 0)) * 100)
              : 0;

            return (
              <Card key={assignment.id}>
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start space-x-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {assignment.template_name || `Assignment #${assignment.id}`}
                            </h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                              <StatusIcon className="mr-1" size={12} />
                              {statusInfo.label}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="flex items-center space-x-2 text-sm">
                              <FiUsers className="text-gray-400" />
                              <span className="text-gray-600">
                                Department: 
                                <Link 
                                  to={`/hr/manager-rating/assignments/${assignment.id}/department-employees`}
                                  className="ml-1 font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors"
                                  title="Click to view all employees in this department"
                                >
                                  {assignment.department_name}
                                </Link>
                              </span>
                            </div>

                            <div className="flex items-center space-x-2 text-sm">
                              <FiCalendar className="text-gray-400" />
                              <span className="text-gray-600">
                                Due: <span className="font-medium text-gray-900">{assignment.due_date ? formatDate(assignment.due_date) : 'No due date'}</span>
                              </span>
                            </div>

                            <div className="flex items-center space-x-2 text-sm">
                              <FiCheckCircle className="text-gray-400" />
                              <span className="text-gray-600">
                                Progress: <span className="font-medium text-gray-900">
                                  {assignment.submitted_count}/{assignment.total_employees} ({completionPercentage}%)
                                </span>
                              </span>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="mb-4">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  completionPercentage === 100
                                    ? 'bg-green-500'
                                    : completionPercentage > 50
                                    ? 'bg-blue-500'
                                    : 'bg-yellow-500'
                                }`}
                                style={{ width: `${completionPercentage}%` }}
                              />
                            </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            <Link to={`/hr/manager-rating/assignments/${assignment.id}/department-employees`}>
                              <Button variant="secondary" icon={FiEye} size="sm">
                                View Submissions
                              </Button>
                            </Link>

                            {(assignment.pending_count || 0) > 0 && (
                              <Link to={`/hr/manager-rating/assignments/${assignment.id}/department-employees`}>
                                <Button variant="outline" icon={FiMail} size="sm">
                                  Send Reminder ({assignment.pending_count})
                                </Button>
                              </Link>
                            )}

                            <Button
                              variant="ghost"
                              icon={FiTrash2}
                              size="sm"
                              onClick={() => handleDelete(assignment.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </PageContainer>
  );
};

export default ManagerRatingAssignments;
