import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import TextModal from '../../../components/TextModal';
import AccomplishmentsTable from '../../../components/AccomplishmentsTable';
import { Button } from '../../../components/common';
import { FiAlertCircle, FiArrowLeft } from 'react-icons/fi';
import { KPI, KPIReview } from '../../../types';
import { useToast } from '../../../context/ToastContext';
import {
  KPIReviewTable,
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

  const [review, setReview] = useState<KPIReview | null>(null);
  const [kpi, setKpi] = useState<KPI | null>(null);
  const [loading, setLoading] = useState(true);
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

  if (review.review_status !== 'manager_submitted') {
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

        {/* Reusable KPI Review Table */}
        {kpi && kpi.items && kpi.items.length > 0 && (
          <KPIReviewTable
            items={kpi.items}
            employeeRatings={employeeItemRatings}
            employeeComments={employeeItemComments}
            managerRatings={managerItemRatings}
            managerComments={managerItemComments}
            onViewText={(title, value) => setTextModal({ isOpen: true, title, value })}
            showManagerColumns={true}
          />
        )}

        {/* Reusable Rating Summary */}
        <div className="mt-6">
          <RatingSummaryCard
            employeeRating={avgEmployeeRating}
            managerRating={avgManagerRating}
            employeeFinalRating={finalEmployeeRating}
            managerFinalRating={finalManagerRating}
          />
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