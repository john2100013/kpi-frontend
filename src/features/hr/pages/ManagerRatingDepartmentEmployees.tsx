import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { useToast } from '../../../context/ToastContext';
import { Button } from '../../../components/common/Button';
import { Card } from '../../../components/common/Card';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { PageContainer } from '../../../components/layout/PageContainer';
import { 
  FiArrowLeft, 
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiSearch,
  FiUsers,
  FiStar
} from 'react-icons/fi';
import { ManagerRatingNav } from '../components';

interface Employee {
  id: number;
  name: string;
  email: string;
  payroll_number: string;
  manager_name: string;
  submission_id: number | null;
  status: 'submitted' | 'pending' | 'not_assigned';
  submitted_at: string | null;
  overall_rating: number | null;
  overall_percentage: number | null;
}

interface AssignmentInfo {
  id: number;
  template_name: string;
  department_name: string;
  department_id: number;
  due_date: string;
  department_manager_name: string | null;
}

interface Stats {
  total: number;
  submitted: number;
  pending: number;
  not_assigned: number;
}

/**
 * HR Manager Rating Department Employees Page
 * View ALL employees in a department with their submission status for a specific assignment
 */
export const ManagerRatingDepartmentEmployees: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [assignment, setAssignment] = useState<AssignmentInfo | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, submitted: 0, pending: 0, not_assigned: 0 });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const response = await api.get(`/manager-rating/assignments/${id}/department-employees`);
      
      const data = response.data.data;
      setAssignment(data.assignment);
      setEmployees(data.employees);
      setStats(data.stats);
      
     
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Unable to load department employees. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/hr/manager-rating/assignments');
  };

  const getFilteredEmployees = () => {
    if (!searchQuery.trim()) return employees;

    const query = searchQuery.toLowerCase();
    return employees.filter(emp => 
      emp.name.toLowerCase().includes(query) ||
      emp.email.toLowerCase().includes(query) ||
      emp.payroll_number?.toLowerCase().includes(query)
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <FiCheckCircle className="mr-1" size={14} />
            Submitted
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <FiClock className="mr-1" size={14} />
            Pending
          </span>
        );
      case 'not_assigned':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            <FiAlertCircle className="mr-1" size={14} />
            Not Assigned
          </span>
        );
      default:
        return null;
    }
  };

  const filteredEmployees = getFilteredEmployees();

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

  const completionPercentage = stats.total > 0
    ? Math.round(((stats.submitted + stats.pending) / stats.total) * 100)
    : 0;

  // Calculate average rating from submitted ratings
  const submittedEmployees = employees.filter(emp => emp.status === 'submitted' && emp.overall_rating !== null);
  
 
  
  const averageRating = submittedEmployees.length > 0
    ? submittedEmployees.reduce((sum, emp) => sum + (emp.overall_rating || 0), 0) / submittedEmployees.length
    : 0;
  

  const submissionPercentage = stats.total > 0
    ? Math.round((stats.submitted / stats.total) * 100)
    : 0;

  return (
    <PageContainer>
      <ManagerRatingNav />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button onClick={handleBack} variant="ghost" icon={FiArrowLeft} className="p-2" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {assignment.department_name} - All Employees
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {assignment.template_name} {assignment.due_date && `• Due: ${new Date(assignment.due_date).toLocaleDateString()}`}
              {assignment.department_manager_name && (
                <>
                  {' • '}
                  <span className="font-medium text-blue-600">Manager: {assignment.department_manager_name}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Employees</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <FiUsers className="text-gray-400 text-2xl" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Submitted</p>
                  <p className="text-2xl font-bold text-green-600">{stats.submitted}</p>
                </div>
                <FiCheckCircle className="text-green-400 text-2xl" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <FiClock className="text-yellow-400 text-2xl" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Not Assigned</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.not_assigned}</p>
                </div>
                <FiAlertCircle className="text-gray-400 text-2xl" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Average Rating</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {averageRating > 0 ? averageRating.toFixed(2) : 'N/A'}
                  </p>
                </div>
                <FiStar className="text-blue-400 text-2xl" />
              </div>
            </div>
          </Card>
        </div>

        {/* Progress Bar */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">Assignment Coverage</h3>
              <span className="text-sm font-medium text-gray-900">
                {stats.submitted + stats.pending}/{stats.total} employees ({completionPercentage}%)
              </span>
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
          </div>
        </Card>

        {/* Submission Coverage */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">Submission Coverage</h3>
              <span className="text-sm font-medium text-gray-900">
                {stats.submitted}/{stats.total} submitted ({submissionPercentage}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  submissionPercentage === 100
                    ? 'bg-green-500'
                    : submissionPercentage > 50
                    ? 'bg-blue-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${submissionPercentage}%` }}
              />
            </div>
          </div>
        </Card>

        {/* Search */}
        <Card>
          <div className="p-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, or payroll number..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
              />
            </div>
          </div>
        </Card>

        {/* Employees Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Manager
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      {searchQuery ? 'No matching employees found' : 'No employees in this department'}
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {employee.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {employee.email}
                          </div>
                          {employee.payroll_number && (
                            <div className="text-xs text-gray-400">
                              ID: {employee.payroll_number}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {employee.manager_name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(employee.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {employee.submitted_at
                          ? new Date(employee.submitted_at).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {employee.overall_rating !== null && employee.overall_rating !== undefined ? (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900">
                              {Number(employee.overall_rating).toFixed(2)} / 5.00
                            </span>
                            <span className="text-xs text-gray-500">
                              ({Number(employee.overall_percentage || 0).toFixed(0)}%)
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Summary footer */}
        <Card>
          <div className="p-4 bg-gray-50">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                Showing {filteredEmployees.length} of {employees.length} employees
              </span>
              <div className="flex items-center space-x-4">
                <span className="flex items-center text-green-600">
                  <FiCheckCircle className="mr-1" size={14} />
                  {stats.submitted} Submitted
                </span>
                <span className="flex items-center text-yellow-600">
                  <FiClock className="mr-1" size={14} />
                  {stats.pending} Pending
                </span>
                <span className="flex items-center text-gray-600">
                  <FiAlertCircle className="mr-1" size={14} />
                  {stats.not_assigned} Not Assigned
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
};

export default ManagerRatingDepartmentEmployees;
