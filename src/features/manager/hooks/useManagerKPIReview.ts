/**
 * useManagerKPIReview
 * 
 * Custom hook for managing KPI Review form state and logic.
 * Handles complex review workflow with ratings, comments, and signatures.
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../../services/api';
import { useToast } from '../../../context/ToastContext';
import type { KPI, KPIReview, Accomplishment } from '../../../types';
import {
  parseEmployeeData,
  parseManagerData,
  initializeItemMaps,
  getRatingLabel as getRatingLabelUtil,
  calculateAverageRating,
  roundToAllowedRating,
  validateAllItemsRated,
  buildItemDataJSON,
  buildQualitativeRatingsArray,
  saveReviewDraft,
  loadReviewDraft,
  clearReviewDraft,
  type ItemRatingsMap,
  type ItemCommentsMap,
  type QualitativeRatingsMap,
} from './kpiReviewUtils';

interface TextModalState {
  isOpen: boolean;
  title: string;
  value: string;
  field?: string;
  itemId?: number;
  onChange?: (value: string) => void;
}

interface RatingOption {
  rating_value: number;
  label: string;
  description?: string;
  rating_type: 'yearly' | 'quarterly' | 'qualitative';
}

interface UseManagerKPIReviewReturn {
  // State
  review: KPIReview | null;
  kpi: KPI | null;
  loading: boolean;
  saving: boolean;
  managerRatings: ItemRatingsMap;
  managerComments: ItemCommentsMap;
  qualitativeRatings: QualitativeRatingsMap;
  qualitativeComments: ItemCommentsMap;
  overallComment: string;
  managerSignature: string;
  reviewDate: Date | null;
  employeeRatings: ItemRatingsMap;
  employeeComments: ItemCommentsMap;
  employeeQualitativeRatings: ItemRatingsMap;
  ratingOptions: RatingOption[];
  qualitativeRatingOptions: RatingOption[];
  majorAccomplishmentsManagerComment: string;
  disappointmentsManagerComment: string;
  improvementNeededManagerComment: string;
  accomplishments: Accomplishment[];
  actualValues: Record<number, string>;
  textModal: TextModalState;
  employeeAvg: number;
  managerAvg: number;
  employeeFinalRating: number;
  managerFinalRating: number;
  
  // Actions
  setManagerRatings: (ratings: ItemRatingsMap) => void;
  setManagerComments: (comments: ItemCommentsMap) => void;
  setQualitativeRatings: (ratings: QualitativeRatingsMap) => void;
  setQualitativeComments: (comments: ItemCommentsMap) => void;
  setOverallComment: (comment: string) => void;
  setManagerSignature: (signature: string) => void;
  setReviewDate: (date: Date | null) => void;
  setMajorAccomplishmentsManagerComment: (comment: string) => void;
  setDisappointmentsManagerComment: (comment: string) => void;
  setImprovementNeededManagerComment: (comment: string) => void;
  setAccomplishments: (accomplishments: Accomplishment[]) => void;
  setActualValues: (values: Record<number, string>) => void;
  setTextModal: (modal: TextModalState) => void;
  handleRatingChange: (itemId: number, value: number) => void;
  handleCommentChange: (itemId: number, value: string) => void;
  handleSaveDraft: () => void;
  handleSubmit: () => Promise<void>;
  handleBack: () => void;
  getRatingLabel: (rating: number) => string;
}

export const useManagerKPIReview = (): UseManagerKPIReviewReturn => {
  const { reviewId } = useParams<{ reviewId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [review, setReview] = useState<KPIReview | null>(null);
  const [kpi, setKpi] = useState<KPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [managerRatings, setManagerRatings] = useState<ItemRatingsMap>({});
  const [managerComments, setManagerComments] = useState<ItemCommentsMap>({});
  const [qualitativeRatings, setQualitativeRatings] = useState<QualitativeRatingsMap>({});
  const [qualitativeComments, setQualitativeComments] = useState<ItemCommentsMap>({});
  const [overallComment, setOverallComment] = useState('');
  const [managerSignature, setManagerSignature] = useState('');
  const [reviewDate, setReviewDate] = useState<Date | null>(new Date());
  const [employeeRatings, setEmployeeRatings] = useState<ItemRatingsMap>({});
  const [employeeComments, setEmployeeComments] = useState<ItemCommentsMap>({});
  const [employeeQualitativeRatings, setEmployeeQualitativeRatings] = useState<ItemRatingsMap>({});
  const [ratingOptions, setRatingOptions] = useState<RatingOption[]>([]);
  const [qualitativeRatingOptions, setQualitativeRatingOptions] = useState<RatingOption[]>([]);
  const [majorAccomplishmentsManagerComment, setMajorAccomplishmentsManagerComment] = useState('');
  const [disappointmentsManagerComment, setDisappointmentsManagerComment] = useState('');
  const [improvementNeededManagerComment, setImprovementNeededManagerComment] = useState('');
  const [accomplishments, setAccomplishments] = useState<Accomplishment[]>([]);
  const [actualValues, setActualValues] = useState<Record<number, string>>({});
  const [textModal, setTextModal] = useState<TextModalState>({
    isOpen: false,
    title: '',
    value: '',
  });

  useEffect(() => {
    console.log('🔄 [KPIReview] Component mounted/updated, reviewId:', reviewId);
    if (reviewId) {
      fetchReview();
      loadDraft();
    }
  }, [reviewId]);

  // Fetch rating options based on KPI period
  useEffect(() => {
    if (kpi && kpi.period) {
      fetchRatingOptions(kpi.period);
    }
  }, [kpi]);

  // Auto-save draft whenever form data changes
  useEffect(() => {
    if (reviewId) {
      saveReviewDraft(reviewId, {
        managerRatings,
        managerComments,
        qualitativeRatings,
        qualitativeComments,
        overallComment,
        managerSignature,
        reviewDate: reviewDate?.toISOString() || '',
        majorAccomplishmentsManagerComment,
        disappointmentsManagerComment,
        improvementNeededManagerComment,
      });
    }
  }, [managerRatings, managerComments, qualitativeRatings, qualitativeComments, overallComment, managerSignature, reviewDate, reviewId, majorAccomplishmentsManagerComment, disappointmentsManagerComment, improvementNeededManagerComment]);

  const loadDraft = () => {
    if (!reviewId) return;
    
    // Load draft after a short delay to allow API data to load first
    setTimeout(() => {
      const draftData = loadReviewDraft(reviewId);
      if (draftData) {
        // Only load draft if there's no existing manager data (indicating it's a new review)
        if (Object.keys(managerRatings).length === 0 && draftData.managerRatings) {
          setManagerRatings(draftData.managerRatings);
        }
        if (Object.keys(managerComments).length === 0 && draftData.managerComments) {
          setManagerComments(draftData.managerComments);
        }
        if (Object.keys(qualitativeRatings).length === 0 && draftData.qualitativeRatings) {
          setQualitativeRatings(draftData.qualitativeRatings);
        }
        if (Object.keys(qualitativeComments).length === 0 && draftData.qualitativeComments) {
          setQualitativeComments(draftData.qualitativeComments);
        }
        if (!overallComment && draftData.overallComment) {
          setOverallComment(draftData.overallComment);
        }
        if (!managerSignature && draftData.managerSignature) {
          setManagerSignature(draftData.managerSignature);
        }
        if (!reviewDate && draftData.reviewDate) {
          setReviewDate(new Date(draftData.reviewDate));
        }
        if (!majorAccomplishmentsManagerComment && draftData.majorAccomplishmentsManagerComment) {
          setMajorAccomplishmentsManagerComment(draftData.majorAccomplishmentsManagerComment);
        }
        if (!disappointmentsManagerComment && draftData.disappointmentsManagerComment) {
          setDisappointmentsManagerComment(draftData.disappointmentsManagerComment);
        }
        if (!improvementNeededManagerComment && draftData.improvementNeededManagerComment) {
          setImprovementNeededManagerComment(draftData.improvementNeededManagerComment);
        }
      }
    }, 500);
  };

  const fetchRatingOptions = async (period?: string) => {
    try {
      console.log('🔍 [KPIReview] Fetching rating options from API for period:', period);
      const response = await api.get('/rating-options');
      console.log('✅ [KPIReview] Rating options response:', response.data);
      const allOptions = response.data.rating_options || [];
      
      // Filter numeric options based on KPI period (yearly or quarterly)
      const periodType = period || 'quarterly'; // Default to quarterly if not specified
      const numericOptions = allOptions.filter((opt: RatingOption) => 
        opt.rating_type === periodType
      );
      const qualitativeOptions = allOptions.filter((opt: RatingOption) => 
        opt.rating_type === 'qualitative'
      );
      
      console.log(`📋 [KPIReview] Setting ${periodType} rating options:`, numericOptions);
      console.log('📋 [KPIReview] Setting qualitative rating options:', qualitativeOptions);
      setRatingOptions(numericOptions);
      setQualitativeRatingOptions(qualitativeOptions);
      
      // If no options returned, use fallback
      if (numericOptions.length === 0) {
        console.warn('⚠️ [KPIReview] No rating options returned, using fallback');
        const fallbackOptions = [
          { rating_value: 1.00, label: 'Below Expectation', rating_type: periodType as 'quarterly' | 'yearly' },
          { rating_value: 1.25, label: 'Meets Expectation', rating_type: periodType as 'quarterly' | 'yearly' },
          { rating_value: 1.50, label: 'Exceeds Expectation', rating_type: periodType as 'quarterly' | 'yearly' },
        ];
        setRatingOptions(fallbackOptions);
      }
    } catch (error) {
      console.error('❌ [KPIReview] Error fetching rating options:', error);
      // Fallback to default options if API fails
      const periodType = period || 'quarterly';
      const fallbackOptions = [
        { rating_value: 1.00, label: 'Below Expectation', rating_type: periodType as 'quarterly' | 'yearly' },
        { rating_value: 1.25, label: 'Meets Expectation', rating_type: periodType as 'quarterly' | 'yearly' },
        { rating_value: 1.50, label: 'Exceeds Expectation', rating_type: periodType as 'quarterly' | 'yearly' },
      ];
      console.log('🔄 [KPIReview] Using fallback rating options:', fallbackOptions);
      setRatingOptions(fallbackOptions);
      setQualitativeRatingOptions([]);
    }
  };

  const fetchReview = async () => {
    try {
      const response = await api.get(`/kpi-review/${reviewId}`);
      const reviewData = response.data.review;
      
      // If review doesn't have an ID, it means it's a new review from KPI
      if (!reviewData.id && reviewData.kpi_id) {
        // This is KPI data formatted as review - review doesn't exist yet
        setReview(reviewData);
        // Fetch KPI to get items
        try {
          const kpiRes = await api.get(`/kpis/${reviewData.kpi_id}`);
          setKpi(kpiRes.data.kpi);
        } catch (error) {
          console.error('Error fetching KPI:', error);
        }
        setLoading(false);
        return;
      }
      
      setReview(reviewData);
      
      // Fetch KPI to get items
      try {
        const kpiRes = await api.get(`/kpis/${reviewData.kpi_id}`);
        const kpiData = kpiRes.data.kpi;
        setKpi(kpiData);
        
        // Initialize manager ratings/comments for all items
        if (kpiData.items && kpiData.items.length > 0) {
          const { ratings, comments } = initializeItemMaps(kpiData.items);
          setManagerRatings(ratings);
          setManagerComments(comments);
        }
        
        // Parse employee ratings/comments from structured data or JSON fallback
        const { ratings: empRatings, comments: empComments } = parseEmployeeData(
          reviewData.employee_comment || '{}',
          reviewData.item_ratings // Pass structured data if available
        );
        console.log('✅ [KPIReview] Employee ratings:', empRatings);
        console.log('✅ [KPIReview] Employee comments:', empComments);
        
        // Separate qualitative ratings from numeric ratings
        const empQualitativeRatings: ItemRatingsMap = {};
        const empNumericRatings: ItemRatingsMap = {};
        
        if (kpiData.items && Array.isArray(kpiData.items)) {
          kpiData.items.forEach((item: any) => {
            if (item.is_qualitative && empRatings[item.id]) {
              empQualitativeRatings[item.id] = empRatings[item.id];
            } else if (empRatings[item.id]) {
              empNumericRatings[item.id] = empRatings[item.id];
            }
          });
        }
        
        setEmployeeRatings(empNumericRatings);
        setEmployeeQualitativeRatings(empQualitativeRatings);
        setEmployeeComments(empComments);
        
        // Parse manager ratings/comments from JSON
        const { ratings: mgrRatings, comments: mgrComments } = parseManagerData(
          reviewData.manager_comment || '{}'
        );
        if (Object.keys(mgrRatings).length > 0) {
          setManagerRatings(mgrRatings);
          setManagerComments(mgrComments);
        }

        // Load accomplishments from review
        if (reviewData.accomplishments && Array.isArray(reviewData.accomplishments)) {
          setAccomplishments(reviewData.accomplishments);
        }

        // Load actual values from kpi items
        const actualVals: Record<number, string> = {};
        if (kpiData.items) {
          kpiData.items.forEach((item: any) => {
            if (item.actual_value) {
              actualVals[item.id] = item.actual_value;
            }
          });
        }
        setActualValues(actualVals);
      } catch (error) {
        console.error('Error fetching KPI:', error);
      }
      
      setOverallComment(reviewData.overall_manager_comment || '');
      // DO NOT pre-fill signature from KPI setting - manager review needs separate signature
      setManagerSignature('');
      if (reviewData.manager_signed_at) {
        setReviewDate(new Date(reviewData.manager_signed_at));
      }
    } catch (error) {
      console.error('Error fetching review:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = () => {
    if (!reviewId) return;
    saveReviewDraft(reviewId, {
      managerRatings,
      managerComments,
      qualitativeRatings,
      qualitativeComments,
      overallComment,
      managerSignature,
      reviewDate: reviewDate?.toISOString() || '',
      majorAccomplishmentsManagerComment,
      disappointmentsManagerComment,
      improvementNeededManagerComment,
    });
    toast.success('Draft saved successfully! Your progress has been saved.');
  };

  const handleRatingChange = (itemId: number, value: number) => {
    const ratingValue = parseFloat(String(value));
    console.log('📝 [KPIReview] Rating changed for item:', itemId, 'Raw value:', value, 'Parsed:', ratingValue, 'Type:', typeof ratingValue);
    const newRatings = { ...managerRatings, [itemId]: ratingValue };
    console.log('📊 [KPIReview] Updated manager ratings state:', newRatings);
    setManagerRatings(newRatings);
  };

  const handleCommentChange = (itemId: number, value: string) => {
    setManagerComments({ ...managerComments, [itemId]: value });
  };

  const handleSubmit = async () => {
    if (!kpi?.items || kpi.items.length === 0) {
      toast.error('No KPI items found');
      return;
    }

    // Validate all KPI items are rated
    const allRated = validateAllItemsRated(kpi.items, managerRatings, qualitativeRatings);
    if (!allRated) {
      toast.error('Please provide a rating for all KPI items (1.00, 1.25, or 1.50 for quantitative; Exceeds/Meets/Needs Improvement for qualitative)');
      return;
    }

    // Validate all accomplishments have manager ratings
    if (accomplishments && accomplishments.length > 0) {
      const unratedAccomplishments = accomplishments.some(acc => 
        acc.manager_rating === null || 
        acc.manager_rating === undefined || 
        acc.manager_rating === 0
      );
      
      if (unratedAccomplishments) {
        toast.error('Please provide ratings for all major accomplishments');
        return;
      }
    }

    if (!managerSignature) {
      toast.warning('Please provide your digital signature');
      return;
    }

    // Calculate and round average rating (including accomplishments)
    const averageRating = calculateAverageRating(kpi.items, managerRatings, accomplishments);
    const roundedRating = roundToAllowedRating(averageRating);

// Build item data JSON with actual values
      const itemDataJSON = buildItemDataJSON(kpi.items, managerRatings, managerComments, actualValues);

      setSaving(true);
      try {
        // Prepare qualitative ratings array for backend
        const qualitativeRatingsArray = buildQualitativeRatingsArray(
          kpi.items,
          qualitativeRatings,
          qualitativeComments
        );

        await api.post(`/kpi-review/${reviewId}/manager-review`, {
          manager_rating: roundedRating,
          manager_comment: itemDataJSON,
          overall_manager_comment: overallComment,
          manager_signature: managerSignature,
          qualitative_ratings: qualitativeRatingsArray,
          major_accomplishments_manager_comment: majorAccomplishmentsManagerComment,
          disappointments_manager_comment: disappointmentsManagerComment,
          improvement_needed_manager_comment: improvementNeededManagerComment,
          accomplishments: accomplishments,
      });

      // Clear draft after successful submission
      if (reviewId) {
        clearReviewDraft(reviewId);
      }

      toast.success('Review submitted successfully!');
      navigate('/manager/reviews');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to submit review');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const getRatingLabel = (rating: number): string => {
    return getRatingLabelUtil(rating);
  };

  // Calculate averages - use backend final ratings if available, otherwise calculate
  const employeeAvg = typeof review?.employee_rating === 'number' 
    ? review.employee_rating 
    : (kpi ? calculateAverageRating(kpi.items || [], employeeRatings) : 0);
  const managerAvg = typeof review?.manager_rating === 'number' 
    ? review.manager_rating 
    : (kpi ? calculateAverageRating(kpi.items || [], managerRatings) : 0);
  const employeeFinalRating = typeof review?.employee_final_rating === 'number' 
    ? review.employee_final_rating 
    : employeeAvg;
  const managerFinalRating = typeof review?.manager_final_rating === 'number' 
    ? review.manager_final_rating 
    : managerAvg;

  return {
    // State
    review,
    kpi,
    loading,
    saving,
    managerRatings,
    managerComments,
    qualitativeRatings,
    qualitativeComments,
    overallComment,
    managerSignature,
    reviewDate,
    employeeRatings,
    employeeComments,
    employeeQualitativeRatings,
    ratingOptions,
    qualitativeRatingOptions,
    majorAccomplishmentsManagerComment,
    disappointmentsManagerComment,
    improvementNeededManagerComment,
    accomplishments,
    actualValues,
    textModal,
    employeeAvg,
    managerAvg,
    employeeFinalRating,
    managerFinalRating,
    
    // Actions
    setManagerRatings,
    setManagerComments,
    setQualitativeRatings,
    setQualitativeComments,
    setOverallComment,
    setManagerSignature,
    setReviewDate,
    setMajorAccomplishmentsManagerComment,
    setDisappointmentsManagerComment,
    setImprovementNeededManagerComment,
    setAccomplishments,
    setActualValues,
    setTextModal,
    handleRatingChange,
    handleCommentChange,
    handleSaveDraft,
    handleSubmit,
    handleBack,
    getRatingLabel,
  };
};
