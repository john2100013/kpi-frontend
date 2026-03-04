import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { useToast } from '../../../context/ToastContext';
import { Button } from '../../../components/common/Button';
import { Card } from '../../../components/common/Card';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { PageContainer } from '../../../components/layout/PageContainer';
import { PageHeader } from '../../../components/layout/PageHeader';
import { ManagerRatingSection, ManagerRatingQuestion, ManagerRatingOption } from '../../../types';
import { FiStar, FiSend } from 'react-icons/fi';

/**
 * Employee Manager Rating Form
 * Employee completes rating for their manager
 */
export const EmployeeManagerRating: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [assignmentData, setAssignmentData] = useState<any>(null);
  const [sections, setSections] = useState<ManagerRatingSection[]>([]);
  const [responses, setResponses] = useState<{ [questionId: number]: { rating: number; text: string } }>({});
  const [ratingOptions, setRatingOptions] = useState<{ [scaleName: string]: ManagerRatingOption[] }>({});
  const [employeeComments, setEmployeeComments] = useState('');

  useEffect(() => {
    fetchAssignmentDetails();
    fetchRatingOptions();
  }, [id]);

  const fetchAssignmentDetails = async () => {
    try {
      setLoading(true);
      
      const response = await api.get(`/manager-rating/employee/assignments/${id}`);
      
      const data = response.data.data;
      setAssignmentData(data.submission);
      setSections(data.sections || []);
      

      // Pre-populate existing responses
      const existingResponses: any = {};
      data.sections?.forEach((section: ManagerRatingSection) => {
        section.questions?.forEach((question) => {
          if (question.response) {
            existingResponses[question.id!] = {
              rating: question.response.rating_value,
              text: question.response.response_text || ''
            };
          }
        });
      });
      setResponses(existingResponses);
      setEmployeeComments(data.submission?.employee_comments || '');
      
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Unable to load manager rating assignment. Please try again later.');
      navigate('/employee/manager-rating');
    } finally {
      setLoading(false);
    }
  };

  const fetchRatingOptions = async () => {
    try {
      const response = await api.get('/manager-rating/rating-options');
      
      setRatingOptions(response.data.data.options || {});
    } catch (error: any) {
      toast.error('Unable to load rating options. Please refresh the page.');
    }
  };

  const handleRatingChange = (questionId: number, rating: number) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        rating
      }
    }));
  };

  const handleTextChange = (questionId: number, text: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        text
      }
    }));
  };

  const validateResponses = (): boolean => {
    const allQuestions: ManagerRatingQuestion[] = [];
    sections.forEach(section => {
      section.questions?.forEach(question => allQuestions.push(question));
    });

    for (const question of allQuestions) {
      if (question.is_required && !responses[question.id!]?.rating) {
        toast.error(`Please answer: ${question.question_text}`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateResponses()) {
      return;
    }

    if (!window.confirm('Are you sure you want to submit this rating? You cannot change your responses after submission.')) {
      return;
    }

    try {
      setSubmitting(true);

      // Format responses for submission
      const formattedResponses: any[] = [];
      sections.forEach(section => {
        section.questions?.forEach(question => {
          if (responses[question.id!]) {
            formattedResponses.push({
              question_id: question.id,
              section_id: section.id,
              rating_value: responses[question.id!].rating,
              response_text: responses[question.id!].text || null
            });
          }
        });
      });

      await api.post('/manager-rating/employee/submit', {
        assignment_id: parseInt(id!),
        responses: formattedResponses,
        employee_comments: employeeComments
      });

      toast.success('Manager rating submitted successfully!');
      navigate('/employee/manager-rating');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  const calculateProgress = (): number => {
    const allQuestions: ManagerRatingQuestion[] = [];
    sections.forEach(section => {
      section.questions?.forEach(question => allQuestions.push(question));
    });

    const answered = Object.keys(responses).filter(qId => responses[parseInt(qId)]?.rating).length;
    return allQuestions.length > 0 ? (answered / allQuestions.length) * 100 : 0;
  };

  if (loading) {
    return (
      <PageContainer>
        <LoadingSpinner />
      </PageContainer>
    );
  }

  const progress = calculateProgress();
  const isCompleted = assignmentData?.status === 'submitted';

  return (
    <PageContainer>
      <PageHeader
        title={assignmentData?.template_name || 'Manager Rating'}
        subtitle={`Rating for: ${assignmentData?.manager_name || 'Your Manager'}`}
      />

      {/* Info Card */}
      <Card className="mb-6">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Department</p>
              <p className="font-medium">{assignmentData?.department_name}</p>
            </div>
            {assignmentData?.due_date && (
              <div>
                <p className="text-sm text-gray-500">Due Date</p>
                <p className="font-medium">{new Date(assignmentData.due_date).toLocaleDateString()}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500">Progress</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-indigo-600 h-2 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{Math.round(progress)}%</span>
              </div>
            </div>
          </div>

          {assignmentData?.template_description && (
            <div className="mt-4 p-4 bg-blue-50 rounded-md">
              <p className="text-sm text-gray-700">{assignmentData.template_description}</p>
            </div>
          )}

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              <strong>Confidential:</strong> Your responses are confidential and will only be visible to HR. 
              Your manager will not see individual responses.
            </p>
          </div>
        </div>
      </Card>

      {/* Rating Sections */}
      {sections.map((section, sectionIndex) => (
        <Card key={section.id} className="mb-6">
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 text-sm font-medium">
                  {sectionIndex + 1}
                </span>
                {section.section_name}
              </h3>
              {section.description && (
                <p className="mt-2 text-sm text-gray-600">{section.description}</p>
              )}
            </div>

            <div className="space-y-6">
              {section.questions?.map((question, questionIndex) => {
                const options = ratingOptions[question.rating_scale_name] || [];
                const currentResponse = responses[question.id!];

                return (
                  <div key={question.id} className="border-b border-gray-200 pb-6 last:border-0">
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {questionIndex + 1}. {question.question_text}
                        {question.is_required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {question.description && (
                        <p className="text-sm text-gray-500 mb-3">{question.description}</p>
                      )}
                    </div>

                    {/* Rating Scale */}
                    <div className="mb-3">
                      <div className="flex flex-wrap gap-3">
                        {options.sort((a, b) => b.rating_value - a.rating_value).map((option) => (
                          <label
                            key={option.id}
                            className={`flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer transition-all ${
                              currentResponse?.rating === option.rating_value
                                ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                                : 'border-gray-300 hover:border-indigo-300'
                            } ${isCompleted ? 'opacity-60 cursor-not-allowed' : ''}`}
                          >
                            <input
                              type="radio"
                              name={`question-${question.id}`}
                              value={option.rating_value}
                              checked={currentResponse?.rating === option.rating_value}
                              onChange={() => handleRatingChange(question.id!, option.rating_value)}
                              disabled={isCompleted}
                              className="h-4 w-4 text-indigo-600"
                            />
                            <span className="text-sm font-medium">
                              {option.label} ({option.rating_value})
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Optional Comments */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Additional Comments (Optional)
                      </label>
                      <textarea
                        value={currentResponse?.text || ''}
                        onChange={(e) => handleTextChange(question.id!, e.target.value)}
                        disabled={isCompleted}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="Add any additional comments about this question..."
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      ))}

      {/* Overall Comments */}
      <Card className="mb-6">
        <div className="p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Overall Comments
          </label>
          <p className="text-sm text-gray-500 mb-3">
            Share any additional feedback or suggestions for your manager
          </p>
          <textarea
            value={employeeComments}
            onChange={(e) => setEmployeeComments(e.target.value)}
            disabled={isCompleted}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="Enter your overall comments here..."
          />
        </div>
      </Card>

      {/* Action Buttons */}
      {!isCompleted && (
        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/employee/manager-rating')}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={submitting || progress < 100}
          >
            {submitting ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="ml-2">Submitting...</span>
              </>
            ) : (
              <>
                <FiSend className="mr-2" />
                Submit Rating
              </>
            )}
          </Button>
        </div>
      )}

      {isCompleted && (
        <Card className="bg-green-50 border-green-200">
          <div className="p-6 text-center">
            <FiStar className="mx-auto h-12 w-12 text-green-600 mb-4" />
            <h3 className="text-lg font-medium text-green-900 mb-2">Rating Submitted</h3>
            <p className="text-green-700">
              Thank you for submitting your manager rating. Your feedback is valuable.
            </p>
            <Button
              variant="outline"
              onClick={() => navigate('/employee/manager-rating')}
              className="mt-4"
            >
              Back to Ratings
            </Button>
          </div>
        </Card>
      )}
    </PageContainer>
  );
};

export default EmployeeManagerRating;
