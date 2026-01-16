import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import TextModal from '../../../components/TextModal';
import AccomplishmentsTable from '../../../components/AccomplishmentsTable';
import { Button } from '../../../components/common';
import { FiAlertCircle, FiArrowLeft } from 'react-icons/fi';
import { KPI, KPIReview } from '../../../types';
import { useToast } from '../../../context/ToastContext';
import { useCompanyFeatures } from '../../../hooks/useCompanyFeatures';
import {
  RatingSummaryCard,
  ApprovalDecisionButtons,
} from '../components';

interface ItemRatings {
  [key: number]: number;
}

interface ItemComments {
  [key: number]: string;
}

const ConfirmReview: React.FC = () => {
  const { reviewId } = useParams<{ reviewId: string }>();
  const navigate = useNavigate();
  const toast = useToast(); // FIXED: Just call it 'toast'
  const { getCalculationMethodName, isEmployeeSelfRatingEnabled } = useCompanyFeatures();

  const [review, setReview] = useState<KPIReview | null>(null);
  const [kpi, setKpi] = useState<KPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [actualValues, setActualValues] = useState<Record<number, string>>({});
  const [percentageValuesObtained, setPercentageValuesObtained] = useState<Record<number, number>>({});
  const [managerRatingPercentages, setManagerRatingPercentages] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [rejectionNote, setRejectionNote] = useState('');
  const [signature, setSignature] = useState('');
  const [error, setError] = useState('');
  const [textModal, setTextModal] = useState<{
    isOpen: boolean;
    title: string;
    value: string;
  }>({
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

      if (response.data.review?.kpi_id) {
        const kpiResponse = await api.get(`/kpis/${response.data.review.kpi_id}`);
        setKpi(kpiResponse.data.kpi);
        
        // Fetch rating details with percentages and actual values
        try {
          const ratingsResponse = await api.get(`/kpi-review/${reviewId}/ratings`);
          const ratings = ratingsResponse.data.ratings;
          
          // Extract actual values and percentages from ratings
          const actualVals: Record<number, string> = {};
          const percentages: Record<number, number> = {};
          const managerPercentages: Record<number, number> = {};
          
          ratings.forEach((rating: any) => {
            if (rating.kpi_item_id) {
              if (rating.actual_value) {
                actualVals[rating.kpi_item_id] = rating.actual_value;
              }
              if (rating.percentage_value_obtained) {
                percentages[rating.kpi_item_id] = rating.percentage_value_obtained;
              }
              if (rating.manager_rating_percentage) {
                managerPercentages[rating.kpi_item_id] = rating.manager_rating_percentage;
              }
            }
          });
          
          setActualValues(actualVals);
          setPercentageValuesObtained(percentages);
          setManagerRatingPercentages(managerPercentages);
        } catch (err) {
          console.log('Could not fetch rating details:', err);
        }
      }
    } catch (error: any) {
      console.error('Error fetching review:', error);
      toast.error('Failed to load review'); // FIXED: Use toast.error()
      setError('Failed to load review');
    } finally {
      setLoading(false);
    }
  };

  const parseRatingsAndComments = () => {
    const employeeItemRatings: ItemRatings = {};
    const employeeItemComments: ItemComments = {};
    const managerItemRatings: ItemRatings = {};
    const managerItemComments: ItemComments = {};

    if (review) {
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
      } catch {}

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
      } catch {}
    }

    return {
      employeeItemRatings,
      employeeItemComments,
      managerItemRatings,
      managerItemComments,
    };
  };

  const calculateTotalRatings = () => {
    let totalEmployeeRating = 0;
    let totalManagerRating = 0;
    let itemCount = 0;

    if (kpi && kpi.items && kpi.items.length > 0) {
      const { employeeItemRatings, managerItemRatings } = parseRatingsAndComments();

      kpi.items.forEach((item) => {
        totalEmployeeRating += employeeItemRatings[item.id] || 0;
        totalManagerRating += managerItemRatings[item.id] || 0;
      });
      itemCount = kpi.items.length;
    } else {
      totalEmployeeRating = review?.employee_rating || 0;
      totalManagerRating = review?.manager_rating || 0;
      itemCount = 1;
    }

    const avgEmployeeRating = itemCount > 0 ? totalEmployeeRating / itemCount : 0;
    const avgManagerRating = itemCount > 0 ? totalManagerRating / itemCount : 0;
    
    // Use backend final ratings if available
    const finalEmployeeRating = review?.employee_final_rating || avgEmployeeRating;
    const finalManagerRating = review?.manager_final_rating || avgManagerRating;

    return { avgEmployeeRating, avgManagerRating, finalEmployeeRating, finalManagerRating };
  };

  const handleActionChange = (newAction: 'approve' | 'reject') => {
    setAction(newAction);
    if (newAction === 'approve') {
      setRejectionNote('');
    } else {
      setSignature('');
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

      // FIXED: Use toast.success()
      toast.success(
        action === 'approve'
          ? 'Review approved successfully!'
          : 'Review rejected successfully. Your manager and HR have been notified.'
      );

      navigate('/employee/dashboard');
    } catch (error: any) {
      console.error('Error confirming review:', error);
      const errorMessage = error.response?.data?.error || 'Failed to confirm review';
      setError(errorMessage);
      toast.error(errorMessage); // FIXED: Use toast.error()
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
        <Button onClick={() => navigate('/employee/dashboard')} variant="secondary" className="mt-4">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  if (review.review_status !== 'manager_submitted' && review.review_status !== 'awaiting_employee_confirmation') {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <p className="text-orange-600">This review is not awaiting confirmation</p>
        <Button onClick={() => navigate('/employee/dashboard')} variant="primary" className="mt-4">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const {
    employeeItemRatings,
    employeeItemComments,
    managerItemRatings,
    managerItemComments,
  } = parseRatingsAndComments();

  const { avgEmployeeRating, avgManagerRating, finalEmployeeRating, finalManagerRating } = calculateTotalRatings();
  
  // Determine calculation method and self-rating status
  const isSelfRatingDisabled = !isEmployeeSelfRatingEnabled();
  const calculationMethodName = kpi?.period ? getCalculationMethodName(kpi.period) : 'Normal Calculation';
  const isActualValueMethod = calculationMethodName.includes('Actual vs Target');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Confirm KPI Review</h1>
        <Button
          onClick={() => navigate('/employee/dashboard')}
          variant="secondary"
          icon={FiArrowLeft}
        >
          Back to Dashboard
        </Button>
      </div>
      
      {/* Calculation Method Display */}
      {calculationMethodName && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-purple-900">Calculation Method:</span>
            <span className="text-sm font-semibold text-purple-700">{calculationMethodName}</span>
          </div>
        </div>
      )}

      {/* Alert Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <FiAlertCircle className="text-blue-600 text-xl mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-blue-900">Action Required</h3>
            <p className="text-sm text-blue-800 mt-1">
              Your manager has completed your KPI review. Please review the rating and comments
              below and confirm whether you agree with the assessment.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Review Details */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">KPI Review Details</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-6">
          <div>
            <p className="text-gray-500">KPI Title</p>
            {/* FIXED: Use kpi state variable, not review.kpi */}
            <p className="font-medium text-gray-900">{kpi?.title || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-500">Manager</p>
            {/* FIXED: KPIReview likely has manager_name as flat property */}
            <p className="font-medium text-gray-900">{review.manager_name || 'N/A'}</p>
          </div>
          {kpi && (
            <>
              <div>
                <p className="text-gray-500">Period</p>
                <p className="font-medium text-gray-900">
                  {kpi.quarter ? `${kpi.quarter} ${kpi.year}` : kpi.year}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Total Items</p>
                <p className="font-medium text-gray-900">{kpi.items?.length || 0}</p>
              </div>
            </>
          )}
        </div>

        {/* Dynamic KPI Review Table */}
        {kpi && kpi.items && kpi.items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full" style={{ minWidth: (isSelfRatingDisabled && isActualValueMethod) ? '1600px' : '2000px' }}>
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase" style={{ minWidth: '50px' }}>#</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase" style={{ minWidth: '200px' }}>KPI TITLE</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase" style={{ minWidth: '250px' }}>DESCRIPTION</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase" style={{ minWidth: '150px' }}>TARGET VALUE</th>
                  
                  {/* Show Actual Value column only for Actual vs Target method */}
                  {isActualValueMethod && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase" style={{ minWidth: '150px' }}>ACTUAL VALUE</th>
                  )}
                  
                  {/* Show Percentage Obtained only for Actual vs Target method */}
                  {isActualValueMethod && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase" style={{ minWidth: '150px' }}>PERCENTAGE OBTAINED</th>
                  )}
                  
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase" style={{ minWidth: '120px' }}>MEASURE UNIT</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase" style={{ minWidth: '120px' }}>GOAL WEIGHT</th>
                  
                  {/* Show Employee columns ONLY if self-rating is enabled */}
                  {!isSelfRatingDisabled && (
                    <>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase" style={{ minWidth: '150px' }}>YOUR RATING</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase" style={{ minWidth: '200px' }}>YOUR COMMENT</th>
                    </>
                  )}
                  
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase" style={{ minWidth: '150px' }}>MANAGER RATING</th>
                  
                  {/* Show Manager Rating % only for Actual vs Target method */}
                  {isActualValueMethod && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase" style={{ minWidth: '150px' }}>MANAGER RATING %</th>
                  )}
                  
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase" style={{ minWidth: '200px' }}>MANAGER COMMENT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {kpi.items.map((item, index) => {
                  const empRating = employeeItemRatings[item.id] || 0;
                  const empComment = employeeItemComments[item.id] || '';
                  const mgrRating = managerItemRatings[item.id] || 0;
                  const mgrComment = managerItemComments[item.id] || '';
                  const actualValue = actualValues[item.id] || '';
                  const percentageObtained = percentageValuesObtained[item.id] || 0;
                  const managerRatingPercentage = managerRatingPercentages[item.id] || 0;
                  
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
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
                      {isActualValueMethod && (
                        <td className="px-4 py-4">
                          <p className="text-sm font-semibold text-gray-900">{actualValue || 'N/A'}</p>
                        </td>
                      )}
                      {isActualValueMethod && (
                        <td className="px-4 py-4">
                          <span className={`text-sm font-semibold ${
                            percentageObtained >= 100 ? 'text-green-600' :
                            percentageObtained >= 70 ? 'text-orange-600' :
                            percentageObtained > 0 ? 'text-red-600' : 'text-gray-400'
                          }`}>
                            {percentageObtained > 0 ? `${percentageObtained.toFixed(2)}%` : 'N/A'}
                          </span>
                        </td>
                      )}
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center px-2 py-1 rounded bg-blue-100 text-blue-700 text-sm">
                          {item.measure_unit || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-gray-700">{item.goal_weight || item.measure_criteria || 'N/A'}</p>
                      </td>
                      {!isSelfRatingDisabled && (
                        <>
                          <td className="px-4 py-4">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-semibold text-purple-600">{empRating.toFixed(2)}</span>
                                <span className="text-xs text-gray-500">({((empRating * 100) / 1.5).toFixed(1)}%)</span>
                              </div>
                              <p className="text-xs text-gray-500">
                                {empRating === 1.00 ? 'Below Expectation' :
                                 empRating === 1.25 ? 'Meets Expectation' :
                                 empRating === 1.50 ? 'Exceeds Expectation' : 'Not Rated'}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            {empComment ? (
                              <button
                                onClick={() => setTextModal({ isOpen: true, title: 'Your Comment', value: empComment })}
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
                        </>
                      )}
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-semibold text-green-600">{mgrRating.toFixed(2)}</span>
                            {!isActualValueMethod && (
                              <span className="text-xs text-gray-500">({((mgrRating * 100) / 1.5).toFixed(1)}%)</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">
                            {mgrRating === 1.00 ? 'Below Expectation' :
                             mgrRating === 1.25 ? 'Meets Expectation' :
                             mgrRating === 1.50 ? 'Exceeds Expectation' : 'Not Rated'}
                          </p>
                        </div>
                      </td>
                      {isActualValueMethod && (
                        <td className="px-4 py-4">
                          <span className={`text-sm font-semibold ${
                            managerRatingPercentage >= 100 ? 'text-green-600' :
                            managerRatingPercentage >= 70 ? 'text-orange-600' :
                            managerRatingPercentage > 0 ? 'text-red-600' : 'text-gray-400'
                          }`}>
                            {managerRatingPercentage > 0 ? `${managerRatingPercentage.toFixed(2)}%` : 'N/A'}
                          </span>
                        </td>
                      )}
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
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Rating Summary - Conditional display based on calculation method */}
        <div className="mt-6">
          {isActualValueMethod ? (
            /* For Actual vs Target: Show Final Rating % */
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600 mb-1">Final Rating Percentage</p>
                <p className="text-4xl font-bold text-purple-600">
                  {(() => {
                    const totalPercentage = Object.values(managerRatingPercentages).reduce((sum, val) => sum + val, 0);
                    return totalPercentage > 0 ? `${totalPercentage.toFixed(2)}%` : 'Not calculated';
                  })()}
                </p>
              </div>
            </div>
          ) : (
            /* For Normal/Goal Weight: Show traditional rating cards */
            <RatingSummaryCard
              employeeRating={isSelfRatingDisabled ? undefined : avgEmployeeRating}
              managerRating={avgManagerRating}
              employeeFinalRating={isSelfRatingDisabled ? undefined : finalEmployeeRating}
              managerFinalRating={finalManagerRating}
            />
          )}
        </div>

        {/* Overall Manager Comments */}
        {review.overall_manager_comment && (
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm font-medium text-yellow-900 mb-2">Overall Manager Comments:</p>
            <p className="text-sm text-yellow-700">{review.overall_manager_comment}</p>
          </div>
        )}

        {/* Accomplishments */}
        {review.accomplishments && review.accomplishments.length > 0 && (
          <div className="mt-6">
            <AccomplishmentsTable
              accomplishments={review.accomplishments}
              mode="view"
              readonly={true}
            />
          </div>
        )}

        {/* Future Plan */}
        {review.future_plan && (
          <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <p className="text-sm font-medium text-purple-900 mb-2">Your Future Plans & Goals:</p>
            <p className="text-sm text-purple-700 whitespace-pre-wrap">{review.future_plan}</p>
          </div>
        )}
      </div>

      {/* Reusable Approval Decision Buttons */}
      <ApprovalDecisionButtons
        action={action}
        rejectionNote={rejectionNote}
        signature={signature}
        submitting={submitting}
        error={error}
        onActionChange={handleActionChange}
        onRejectionNoteChange={setRejectionNote}
        onSignatureChange={setSignature}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/employee/dashboard')}
      />

      {/* Text Modal */}
      <TextModal
        isOpen={textModal.isOpen}
        onClose={() => setTextModal({ isOpen: false, title: '', value: '' })}
        title={textModal.title}
        value={textModal.value}
      />
    </div>
  );
};

export default ConfirmReview;