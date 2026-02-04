import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../../../context/ToastContext';
import { useConfirm } from '../../../hooks/useConfirm';
import { KPI } from '../../../types';
import { employeeService } from '../services/employeeService';
import { KPIReviewConfirmation, TextModalState } from '../types';
import {
  parseItemRatingsFromReview,
  calculateRatingSummary,
  validateConfirmation,
} from './kpiConfirmationUtils';

export const useEmployeeKPIConfirmation = () => {
  const { reviewId } = useParams<{ reviewId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();

  const [review, setReview] = useState<KPIReviewConfirmation | null>(null);
  const [kpi, setKpi] = useState<KPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [rejectionNote, setRejectionNote] = useState('');
  const [signature, setSignature] = useState('');
  const [error, setError] = useState('');
  const [textModal, setTextModal] = useState<TextModalState>({
    isOpen: false,
    title: '',
    value: '',
  });
  
  // Physical Meeting Confirmation - Employee Confirmation
  const [employeeConfirmationMeetingConfirmed, setEmployeeConfirmationMeetingConfirmed] = useState(false);
  const [employeeConfirmationMeetingLocation, setEmployeeConfirmationMeetingLocation] = useState('');
  const [employeeConfirmationMeetingDate, setEmployeeConfirmationMeetingDate] = useState('');
  const [employeeConfirmationMeetingTime, setEmployeeConfirmationMeetingTime] = useState('');

  useEffect(() => {
    if (reviewId) {
      fetchReview();
    }
  }, [reviewId]);

  const fetchReview = async () => {
    try {
      setLoading(true);
      const reviewData = await employeeService.fetchReviewById(parseInt(reviewId!));
      setReview(reviewData); // <-- CRITICAL: set the review state!
      // Fetch the full KPI details with items
      if (reviewData?.kpi_id) {
        const kpiData = await employeeService.fetchKPIById(reviewData.kpi_id);
        setKpi(kpiData);
      }
    } catch (error: any) {
      if (typeof window !== 'undefined' && window.toast) {
        window.toast.error('Failed to load review');
      }
      setError('Failed to load review');
    } finally {
      setLoading(false);
    }
  };

  const handleActionSelect = (selectedAction: 'approve' | 'reject') => {
    setAction(selectedAction);
    if (selectedAction === 'approve') {
      setRejectionNote('');
    } else {
      setSignature('');
    }
  };

  const handleSubmit = async () => {
    
    const validation = validateConfirmation(action, rejectionNote, signature);
    
    if (!validation.valid) {      setError(validation.error!);
      return;
    }

    // Physical meeting validation (only when approving, not rejecting)
    if (action === 'approve' && employeeConfirmationMeetingConfirmed) {
      if (!employeeConfirmationMeetingLocation?.trim()) {
        setError('Please enter the meeting location');
        return;
      }
      if (!employeeConfirmationMeetingDate) {
        setError('Please select the meeting date');
        return;
      }
      if (!employeeConfirmationMeetingTime) {
        setError('Please select the meeting time');
        return;
      }
    }

    // Warning if physical meeting is NOT confirmed (only for approval)
    if (action === 'approve' && !employeeConfirmationMeetingConfirmed) {
      const confirmProceed = await confirm({
        title: 'No Physical Meeting Confirmed',
        message: 'Are you sure you did not have a physical meeting? HR will be notified about this.',
        variant: 'warning',
        confirmText: 'Continue Without Meeting',
        cancelText: 'Go Back'
      });
      if (!confirmProceed) {
        return;
      }
    }

    setSubmitting(true);
    setError('');

    try {
     
      
      const response = await employeeService.submitConfirmation(parseInt(reviewId!), {
        confirmation_status: action === 'approve' ? 'approved' : 'rejected',
        rejection_note: action === 'reject' ? rejectionNote : null,
        signature: action === 'approve' ? signature : null,
        // Physical meeting fields (only when approving)
        employee_confirmation_meeting_confirmed: action === 'approve' ? employeeConfirmationMeetingConfirmed : false,
        employee_confirmation_meeting_location: action === 'approve' && employeeConfirmationMeetingConfirmed ? employeeConfirmationMeetingLocation : null,
        employee_confirmation_meeting_date: action === 'approve' && employeeConfirmationMeetingConfirmed ? employeeConfirmationMeetingDate : null,
        employee_confirmation_meeting_time: action === 'approve' && employeeConfirmationMeetingConfirmed ? employeeConfirmationMeetingTime : null,
      });
      

      toast.success(
        action === 'approve'
          ? 'Review approved successfully!'
          : 'Review rejected successfully. Your manager and HR have been notified.'
      );
      
      navigate('/employee/dashboard');
    } catch (error: any) {
      if (typeof window !== 'undefined' && window.toast) {
        window.toast.error(error.response?.data?.error || 'Failed to confirm review');
      }
      setError(error.response?.data?.error || 'Failed to confirm review');
    } finally {
      setSubmitting(false);
    }
  };

  const openTextModal = (title: string, value: string) => {
    setTextModal({ isOpen: true, title, value });
  };

  const closeTextModal = () => {
    setTextModal({ isOpen: false, title: '', value: '' });
  };

  const parsedRatings = review ? parseItemRatingsFromReview(review) : null;
  const ratingSummary = review ? calculateRatingSummary(review, kpi) : null;


  return {
    reviewId,
    review,
    kpi,
    loading,
    submitting,
    action,
    rejectionNote,
    signature,
    error,
    textModal,
    parsedRatings,
    ratingSummary,
    setAction: handleActionSelect,
    setRejectionNote,
    setSignature,
    handleSubmit,
    openTextModal,
    closeTextModal,
    navigate,
    // Physical Meeting Confirmation
    employeeConfirmationMeetingConfirmed,
    setEmployeeConfirmationMeetingConfirmed,
    employeeConfirmationMeetingLocation,
    setEmployeeConfirmationMeetingLocation,
    employeeConfirmationMeetingDate,
    setEmployeeConfirmationMeetingDate,
    employeeConfirmationMeetingTime,
    setEmployeeConfirmationMeetingTime,
    // Confirm dialog
    confirmState,
    handleConfirm,
    handleCancel,
  };
};