import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import SignatureField from '../../components/SignatureField';
import { FiCheckCircle, FiX, FiAlertCircle } from 'react-icons/fi';
import { KPI } from '../../types';
import TextModal from '../../components/TextModal';

interface KPIReview {
  id: number;
  kpi_id: number;
  employee_id: number;
  manager_id: number;
  employee_rating: number;
  employee_comment: string;
  manager_rating: number;
  manager_comment: string;
  overall_manager_comment: string;
  review_status: string;
  kpi_title: string;
  kpi_description: string;
  manager_name: string;
}

const KPIConfirmation: React.FC = () => {
  const { reviewId } = useParams<{ reviewId: string }>();
  const navigate = useNavigate();
  
  const [review, setReview] = useState<KPIReview | null>(null);
  const [kpi, setKpi] = useState<KPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [rejectionNote, setRejectionNote] = useState('');
  const [signature, setSignature] = useState('');
  const [error, setError] = useState('');
  const [textModal, setTextModal] = useState<{ isOpen: boolean; title: string; value: string }>({
    isOpen: false,
    title: '',
    value: '',
  });

  useEffect(() => {
    fetchReview();
  }, [reviewId]);

  const fetchReview = async () => {
    try {
      const response = await api.get(`/kpi-review/${reviewId}`);
      setReview(response.data.review);
      
      // Fetch the full KPI details with items
      if (response.data.review?.kpi_id) {
        const kpiResponse = await api.get(`/kpis/${response.data.review.kpi_id}`);
        setKpi(kpiResponse.data.kpi);
      }
    } catch (error: any) {
      console.error('Error fetching review:', error);
      setError('Failed to load review');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!action) {
      setError('Please select whether to approve or reject this review');
      return;
    }

    if (action === 'reject' && !rejectionNote.trim()) {
      setError('Please provide a reason for rejecting this review');
      return;
    }

    if (action === 'approve' && !signature) {
      setError('Please provide your signature to approve this review');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await api.post(`/kpi-review/${reviewId}/employee-confirmation`, {
        confirmation_status: action === 'approve' ? 'approved' : 'rejected',
        rejection_note: action === 'reject' ? rejectionNote : null,
        signature: action === 'approve' ? signature : null,
      });

      alert(
        action === 'approve'
          ? 'Review approved successfully!'
          : 'Review rejected successfully. Your manager and HR have been notified.'
      );
      
      navigate('/employee/dashboard');
    } catch (error: any) {
      console.error('Error confirming review:', error);
      setError(error.response?.data?.error || 'Failed to confirm review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <p className="text-red-600">Review not found</p>
      </div>
    );
  }

  if (review.review_status !== 'awaiting_employee_confirmation') {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <p className="text-orange-600">This review is not awaiting confirmation</p>
        <button
          onClick={() => navigate('/employee/dashboard')}
          className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Confirm KPI Review</h1>
        <button
          onClick={() => navigate('/employee/dashboard')}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          Back to Dashboard
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <FiAlertCircle className="text-blue-600 text-xl mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900">Action Required</h3>
            <p className="text-sm text-blue-800 mt-1">
              Your manager <span className="font-semibold">{review.manager_name}</span> has completed your KPI review. 
              Please review the rating and comments below and confirm whether you agree with the assessment.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">KPI Review Details</h2>
        <div className="space-y-2 text-sm text-gray-600 mb-6">
          <p><span className="font-medium text-gray-900">KPI Title:</span> {review.kpi_title}</p>
          <p><span className="font-medium text-gray-900">Manager:</span> {review.manager_name}</p>
          {kpi && (
            <>
              <p><span className="font-medium text-gray-900">Period:</span> {kpi.quarter} {kpi.year}</p>
              <p><span className="font-medium text-gray-900">Total Items:</span> {kpi.items?.length || 1}</p>
            </>
          )}
        </div>

        {/* KPI Items Table */}
        {(() => {
          let employeeItemRatings: { [key: number]: number } = {};
          let employeeItemComments: { [key: number]: string } = {};
          let managerItemRatings: { [key: number]: number } = {};
          let managerItemComments: { [key: number]: string } = {};

          if (review) {
            // Parse employee ratings/comments
            try {
              const empData = JSON.parse(review.employee_comment || '{}');
              if (empData.items && Array.isArray(empData.items)) {
                empData.items.forEach((item: any) => {
                  if (item.item_id) {
                    employeeItemRatings[item.item_id] = item.rating || 0;
                    employeeItemComments[item.item_id] = item.comment || '';
                  }
                });
              }
            } catch {
              // Not JSON, use legacy format
            }

            // Parse manager ratings/comments
            try {
              const mgrData = JSON.parse(review.manager_comment || '{}');
              if (mgrData.items && Array.isArray(mgrData.items)) {
                mgrData.items.forEach((item: any) => {
                  if (item.item_id) {
                    managerItemRatings[item.item_id] = item.rating || 0;
                    managerItemComments[item.item_id] = item.comment || '';
                  }
                });
              }
            } catch {
              // Not JSON, use legacy format
            }
          }

          return (
            <div className="overflow-x-auto">
              <table className="w-full" style={{ minWidth: '1800px' }}>
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase sticky left-0 bg-gray-50 z-10" style={{ minWidth: '50px' }}>#</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase" style={{ minWidth: '200px' }}>KPI TITLE</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase" style={{ minWidth: '250px' }}>DESCRIPTION</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase" style={{ minWidth: '150px' }}>TARGET VALUE</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase" style={{ minWidth: '120px' }}>MEASURE UNIT</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase" style={{ minWidth: '120px' }}>GOAL WEIGHT</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase" style={{ minWidth: '150px' }}>EMPLOYEE RATING</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase" style={{ minWidth: '200px' }}>EMPLOYEE COMMENT</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase" style={{ minWidth: '150px' }}>MANAGER RATING</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase" style={{ minWidth: '200px' }}>MANAGER COMMENT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {kpi && kpi.items && kpi.items.length > 0 ? (
                    kpi.items.map((item, index) => {
                      const empRating = employeeItemRatings[item.id] || 0;
                      const empComment = employeeItemComments[item.id] || '';
                      const mgrRating = managerItemRatings[item.id] || 0;
                      const mgrComment = managerItemComments[item.id] || '';
                      
                      return (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 sticky left-0 bg-white z-10">
                            <span className="font-semibold text-gray-900">{index + 1}</span>
                          </td>
                          <td className="px-4 py-4">
                            <button
                              onClick={() => setTextModal({ isOpen: true, title: 'KPI Title', value: item.title || 'N/A' })}
                              className="text-left font-semibold text-gray-900 hover:text-purple-600 transition-colors"
                            >
                              <p className="truncate max-w-[200px]" title={item.title}>{item.title}</p>
                            </button>
                          </td>
                          <td className="px-4 py-4">
                            <button
                              onClick={() => setTextModal({ isOpen: true, title: 'Description', value: item.description || 'N/A' })}
                              className="text-left text-sm text-gray-700 hover:text-purple-600 transition-colors"
                            >
                              <p className="truncate max-w-[250px]" title={item.description || 'N/A'}>{item.description || 'N/A'}</p>
                            </button>
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-sm text-gray-900">{item.target_value || 'N/A'}</p>
                          </td>
                          <td className="px-4 py-4">
                            <span className="inline-flex items-center px-2 py-1 rounded bg-blue-100 text-blue-700 text-sm">
                              {item.measure_unit || 'N/A'}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-sm text-gray-700">{item.goal_weight || 'N/A'}</p>
                          </td>
                          <td className="px-4 py-4">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-semibold text-purple-600">
                                  {empRating.toFixed(2)}
                                </span>
                                <span className="text-xs text-gray-500">
                                  ({(empRating * 100 / 1.50).toFixed(1)}%)
                                </span>
                              </div>
                              <p className="text-xs text-gray-500">
                                {empRating === 1.00 ? 'Below Expectation' : empRating === 1.25 ? 'Meets Expectation' : empRating === 1.50 ? 'Exceeds Expectation' : empRating === 0 ? 'Not Rated' : 'Custom'}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            {empComment ? (
                              <button
                                onClick={() => setTextModal({ isOpen: true, title: 'Employee Comment', value: empComment })}
                                className="text-left text-sm text-gray-700 hover:text-purple-600 transition-colors"
                              >
                                <p className="truncate max-w-[200px]" title={empComment}>
                                  {empComment.length > 40 ? empComment.substring(0, 40) + '...' : empComment}
                                </p>
                              </button>
                            ) : (
                              <span className="text-sm text-gray-400">No comment</span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-semibold text-yellow-600">
                                  {mgrRating.toFixed(2)}
                                </span>
                                <span className="text-xs text-gray-500">
                                  ({(mgrRating * 100 / 1.50).toFixed(1)}%)
                                </span>
                              </div>
                              <p className="text-xs text-gray-500">
                                {mgrRating === 1.00 ? 'Below Expectation' : mgrRating === 1.25 ? 'Meets Expectation' : mgrRating === 1.50 ? 'Exceeds Expectation' : mgrRating === 0 ? 'Not Rated' : 'Custom'}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            {mgrComment ? (
                              <button
                                onClick={() => setTextModal({ isOpen: true, title: 'Manager Comment', value: mgrComment })}
                                className="text-left text-sm text-gray-700 hover:text-purple-600 transition-colors"
                              >
                                <p className="truncate max-w-[200px]" title={mgrComment}>
                                  {mgrComment.length > 40 ? mgrComment.substring(0, 40) + '...' : mgrComment}
                                </p>
                              </button>
                            ) : (
                              <span className="text-sm text-gray-400">No comment</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    // Fallback for legacy single KPI format
                    <tr>
                      <td className="px-4 py-4 sticky left-0 bg-white z-10">
                        <span className="font-semibold text-gray-900">1</span>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-gray-900">{review.kpi_title}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-gray-700">{review.kpi_description || 'N/A'}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-gray-900">N/A</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center px-2 py-1 rounded bg-blue-100 text-blue-700 text-sm">N/A</span>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-gray-700">N/A</p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-semibold text-purple-600">
                              {typeof review.employee_rating === 'number' ? review.employee_rating.toFixed(2) : '0.00'}
                            </span>
                            <span className="text-xs text-gray-500">
                              ({((review.employee_rating || 0) * 100 / 1.50).toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-gray-700">{review.employee_comment || 'No comment'}</p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-semibold text-yellow-600">
                              {typeof review.manager_rating === 'number' ? review.manager_rating.toFixed(2) : '0.00'}
                            </span>
                            <span className="text-xs text-gray-500">
                              ({((review.manager_rating || 0) * 100 / 1.50).toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-gray-700">{review.manager_comment || 'No comment'}</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          );
        })()}

        {/* Total Rating Summary */}
        {(() => {
          let totalEmployeeRating = 0;
          let totalManagerRating = 0;
          let itemCount = 0;

          if (kpi && kpi.items && kpi.items.length > 0) {
            // Parse ratings for items
            let employeeItemRatings: { [key: number]: number } = {};
            let managerItemRatings: { [key: number]: number } = {};

            try {
              const empData = JSON.parse(review.employee_comment || '{}');
              if (empData.items && Array.isArray(empData.items)) {
                empData.items.forEach((item: any) => {
                  if (item.item_id) {
                    employeeItemRatings[item.item_id] = item.rating || 0;
                  }
                });
              }
            } catch {}

            try {
              const mgrData = JSON.parse(review.manager_comment || '{}');
              if (mgrData.items && Array.isArray(mgrData.items)) {
                mgrData.items.forEach((item: any) => {
                  if (item.item_id) {
                    managerItemRatings[item.item_id] = item.rating || 0;
                  }
                });
              }
            } catch {}

            kpi.items.forEach((item) => {
              totalEmployeeRating += employeeItemRatings[item.id] || 0;
              totalManagerRating += managerItemRatings[item.id] || 0;
            });
            itemCount = kpi.items.length;
          } else {
            // Legacy format
            totalEmployeeRating = review.employee_rating || 0;
            totalManagerRating = review.manager_rating || 0;
            itemCount = 1;
          }

          const avgEmployeeRating = itemCount > 0 ? totalEmployeeRating / itemCount : 0;
          const avgManagerRating = itemCount > 0 ? totalManagerRating / itemCount : 0;

          return (
            <div className="mt-6 p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border-2 border-purple-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Total Rating Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 border border-purple-200">
                  <p className="text-sm text-gray-600 mb-2">Total Employee Rating</p>
                  <div className="flex items-baseline space-x-3">
                    <span className="text-3xl font-bold text-purple-600">{avgEmployeeRating.toFixed(2)}</span>
                    <span className="text-lg text-gray-500">({(avgEmployeeRating * 100 / 1.50).toFixed(1)}%)</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {avgEmployeeRating >= 1.40 ? 'Exceeds Expectation' : avgEmployeeRating >= 1.15 ? 'Meets Expectation' : 'Below Expectation'}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-yellow-200">
                  <p className="text-sm text-gray-600 mb-2">Total Manager Rating</p>
                  <div className="flex items-baseline space-x-3">
                    <span className="text-3xl font-bold text-yellow-600">{avgManagerRating.toFixed(2)}</span>
                    <span className="text-lg text-gray-500">({(avgManagerRating * 100 / 1.50).toFixed(1)}%)</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {avgManagerRating >= 1.40 ? 'Exceeds Expectation' : avgManagerRating >= 1.15 ? 'Meets Expectation' : 'Below Expectation'}
                  </p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Overall Manager Comments */}
        {review.overall_manager_comment && (
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm font-medium text-yellow-900 mb-2">Overall Manager Comments:</p>
            <p className="text-sm text-yellow-700">{review.overall_manager_comment}</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Decision</h2>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="flex space-x-4">
            <button
              onClick={() => {
                setAction('approve');
                setRejectionNote('');
              }}
              className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                action === 'approve'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-green-300'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <FiCheckCircle className={action === 'approve' ? 'text-green-600' : 'text-gray-400'} />
                <span className={`font-medium ${action === 'approve' ? 'text-green-700' : 'text-gray-600'}`}>
                  Approve Rating
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                I agree with my manager's assessment
              </p>
            </button>

            <button
              onClick={() => {
                setAction('reject');
                setSignature('');
              }}
              className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                action === 'reject'
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-200 hover:border-red-300'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <FiX className={action === 'reject' ? 'text-red-600' : 'text-gray-400'} />
                <span className={`font-medium ${action === 'reject' ? 'text-red-700' : 'text-gray-600'}`}>
                  Reject Rating
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                I disagree with this assessment
              </p>
            </button>
          </div>

          {action === 'reject' && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <label className="block text-sm font-medium text-red-900 mb-2">
                Reason for Rejection <span className="text-red-600">*</span>
              </label>
              <textarea
                value={rejectionNote}
                onChange={(e) => setRejectionNote(e.target.value)}
                placeholder="Please explain why you disagree with this rating..."
                rows={4}
                className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                required
              />
              <p className="text-xs text-red-600 mt-1">
                Your manager and HR will be notified of your rejection and the reason provided.
              </p>
            </div>
          )}

          {action === 'approve' && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <label className="block text-sm font-medium text-green-900 mb-2">
                Your Signature <span className="text-green-600">*</span>
              </label>
              <SignatureField
                value={signature}
                onChange={setSignature}
                placeholder="Sign here to approve..."
              />
              <p className="text-xs text-green-600 mt-2">
                By signing, you confirm that you agree with your manager's rating and assessment.
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => navigate('/employee/dashboard')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!action || submitting}
              className={`px-6 py-2 rounded-lg text-white font-medium ${
                action === 'approve'
                  ? 'bg-green-600 hover:bg-green-700'
                  : action === 'reject'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-gray-400 cursor-not-allowed'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {submitting
                ? 'Submitting...'
                : action === 'approve'
                ? 'Approve & Sign'
                : action === 'reject'
                ? 'Submit Rejection'
                : 'Select an Option'}
            </button>
          </div>
        </div>
      </div>

      {/* Text Modal for viewing full text */}
      <TextModal
        isOpen={textModal.isOpen}
        onClose={() => setTextModal({ isOpen: false, title: '', value: '' })}
        title={textModal.title}
        value={textModal.value}
      />
    </div>
  );
};

export default KPIConfirmation;
