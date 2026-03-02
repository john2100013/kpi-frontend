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
  FiStar,
  FiUser,
  FiCalendar,
  FiDownload,
  FiMessageSquare
} from 'react-icons/fi';
import { ManagerRatingNav } from '../components';

interface SectionResult {
  section_id: number;
  section_name: string;
  section_order: number;
  average_rating: number;
  total_questions: number;
  answered_questions: number;
}

interface QuestionResponse {
  question_id: number;
  question_text: string;
  question_order: number;
  rating_value: number;
  rating_label: string;
  response_text: string | null;
}

interface SectionWithResponses {
  section_id: number;
  section_name: string;
  section_order: number;
  average_rating: number;
  responses: QuestionResponse[];
}

interface SubmissionResult {
  submission_id: number;
  employee_name: string;
  employee_email: string;
  template_name: string;
  department_name: string;
  submitted_at: string;
  overall_rating: number;
  overall_percentage: number;
  employee_comments: string | null;
  section_results: SectionResult[];
  sections: SectionWithResponses[];
}

/**
 * HR Manager Rating Results Page
 * View detailed results for an individual submission
 */
export const ManagerRatingResults: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<SubmissionResult | null>(null);

  useEffect(() => {
    if (id) {
      fetchResult();
    }
  }, [id]);

  const fetchResult = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/manager-rating/results/submission/${id}`);
      setResult(response.data.data.result);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to fetch submission results');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleExport = async () => {
    toast.info('Export feature coming soon');
    // TODO: Implement export to PDF/CSV
  };

  const getRatingColor = (rating: number): string => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 3.5) return 'text-blue-600';
    if (rating >= 2.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRatingBgColor = (rating: number): string => {
    if (rating >= 4.5) return 'bg-green-100';
    if (rating >= 3.5) return 'bg-blue-100';
    if (rating >= 2.5) return 'bg-yellow-100';
    return 'bg-red-100';
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

  if (!result) {
    return (
      <PageContainer>
        <Card>
          <div className="p-12 text-center">
            <p className="text-gray-600">Submission not found</p>
            <Button onClick={handleBack} variant="secondary" className="mt-4">
              Go Back
            </Button>
          </div>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <ManagerRatingNav />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button onClick={handleBack} variant="ghost" icon={FiArrowLeft} className="p-2" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Rating Details</h1>
              <p className="text-sm text-gray-600 mt-1">
                {result.template_name}
              </p>
            </div>
          </div>
          <Button 
            onClick={handleExport} 
            variant="secondary" 
            icon={FiDownload}
          >
            Export Report
          </Button>
        </div>

        {/* Submission Info */}
        <Card>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start space-x-3">
                <FiUser className="text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Employee</p>
                  <p className="font-medium text-gray-900">{result.employee_name}</p>
                  <p className="text-xs text-gray-500">{result.employee_email}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <FiStar className="text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Department</p>
                  <p className="font-medium text-gray-900">{result.department_name}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <FiCalendar className="text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Submitted At</p>
                  <p className="font-medium text-gray-900">
                    {new Date(result.submitted_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Overall Score */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Overall Rating</h2>
            <div className="flex items-center justify-center space-x-8">
              <div className="text-center">
                <div className={`text-6xl font-bold ${getRatingColor(result.overall_rating)}`}>
                  {Number(result.overall_rating).toFixed(2)}
                </div>
                <p className="text-sm text-gray-600 mt-2">out of 5.00</p>
              </div>
              <div className="text-center">
                <div className={`text-6xl font-bold ${getRatingColor(result.overall_rating)}`}>
                  {Number(result.overall_percentage).toFixed(0)}%
                </div>
                <p className="text-sm text-gray-600 mt-2">Overall Score</p>
              </div>
            </div>

            {/* Rating Scale Reference */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center mb-3">Rating Scale Reference</p>
              <div className="flex items-center justify-center space-x-4 text-xs">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-gray-600">4.5-5.0 Excellent</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-gray-600">3.5-4.4 Good</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-gray-600">2.5-3.4 Fair</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-gray-600">1.0-2.4 Needs Improvement</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Section Results */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Section Breakdown</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {result.section_results
                .sort((a, b) => a.section_order - b.section_order)
                .map((section) => (
                  <div
                    key={section.section_id}
                    className={`p-4 rounded-lg border-2 ${getRatingBgColor(section.average_rating)} border-transparent`}
                  >
                    <h3 className="font-medium text-gray-900 mb-2">{section.section_name}</h3>
                    <div className={`text-3xl font-bold ${getRatingColor(section.average_rating)}`}>
                      {Number(section.average_rating).toFixed(2)}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {section.answered_questions}/{section.total_questions} questions answered
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </Card>

        {/* Detailed Responses */}
        <div className="space-y-4">
          {result.sections
            .sort((a, b) => a.section_order - b.section_order)
            .map((section, sectionIndex) => (
              <Card key={section.section_id}>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {sectionIndex + 1}. {section.section_name}
                    </h2>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Section Average:</span>
                      <span className={`text-lg font-bold ${getRatingColor(section.average_rating)}`}>
                        {Number(section.average_rating).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {section.responses
                      .sort((a, b) => a.question_order - b.question_order)
                      .map((response, responseIndex) => (
                        <div
                          key={response.question_id}
                          className="border-l-4 border-gray-300 pl-4 py-2"
                        >
                          <div className="flex items-start justify-between">
                            <p className="text-sm text-gray-900 flex-1">
                              <span className="font-medium text-gray-500">Q{responseIndex + 1}:</span>{' '}
                              {response.question_text}
                            </p>
                            <div className="ml-4 flex items-center space-x-2">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRatingBgColor(response.rating_value)} ${getRatingColor(response.rating_value)}`}>
                                {response.rating_value} - {response.rating_label}
                              </span>
                            </div>
                          </div>
                          {response.response_text && (
                            <div className="mt-2 pl-12">
                              <p className="text-xs text-gray-500 mb-1">Comment:</p>
                              <p className="text-sm text-gray-700 italic bg-gray-50 p-2 rounded">
                                "{response.response_text}"
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              </Card>
            ))}
        </div>

        {/* Overall Comments */}
        {result.employee_comments && (
          <Card>
            <div className="p-6">
              <div className="flex items-start space-x-3">
                <FiMessageSquare className="text-blue-500 mt-1" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Overall Feedback</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{result.employee_comments}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Confidentiality Notice */}
        <Card>
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800">
              <strong>Confidential:</strong> This information is intended for HR use only. 
              Employee responses are confidential and should not be shared with the manager being rated.
            </p>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
};

export default ManagerRatingResults;
