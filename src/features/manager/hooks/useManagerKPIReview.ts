/**
 * useManagerKPIReview
 * 
 * Custom hook for managing KPI Review form state and logic.
 * Handles complex review workflow with ratings, comments, and signatures.
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../../services/api';
import { useToast } from '../../../context/ToastContext';
import { useCompanyFeatures } from '../../../hooks/useCompanyFeatures';
import type { KPI, KPIReview, Accomplishment } from '../../../types';
import {
  parseEmployeeData,
  parseManagerData,
  initializeItemMaps,
  getRatingLabel as getRatingLabelUtil,
  calculateAverageRating,
  roundToAllowedRating,
  validateAllItemsRated,
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
  id?: number;
  rating_value: number | string;
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
  targetValues: Record<number, string>;
  goalWeights: Record<number, string>;
  currentPerformanceStatuses: Record<number, string>;
  managerRatingPercentages: Record<number, string>;
  textModal: TextModalState;
  employeeAvg: number;
  managerAvg: number;
  employeeFinalRating: number;
  managerFinalRating: number;
  employeeRatingPercentage: number | null;
  employeeFinalRatingPercentage: number | null;
  managerFinalRatingPercentage: number | null;
  
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
  setTargetValues: (values: Record<number, string>) => void;
  setGoalWeights: (values: Record<number, string>) => void;
  setCurrentPerformanceStatuses: (values: Record<number, string>) => void;
  setManagerRatingPercentages: (values: Record<number, string>) => void;
  setTextModal: (modal: TextModalState) => void;
  handleRatingChange: (itemId: number, value: number) => void;
  handleCommentChange: (itemId: number, value: string) => void;
  handleSaveDraft: () => void;
  handleSubmit: () => Promise<void>;
  handleBack: () => void;
  getRatingLabel: (rating: number) => string;
}

export const useManagerKPIReview = (): UseManagerKPIReviewReturn => {
  const { reviewId, kpiId } = useParams<{ reviewId?: string; kpiId?: string }>();
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
  const [targetValues, setTargetValues] = useState<Record<number, string>>({});
  const [goalWeights, setGoalWeights] = useState<Record<number, string>>({});
  const [currentPerformanceStatuses, setCurrentPerformanceStatuses] = useState<Record<number, string>>({});
  const [managerRatingPercentages, setManagerRatingPercentages] = useState<Record<number, string>>({});
  const [textModal, setTextModal] = useState<TextModalState>({
    isOpen: false,
    title: '',
    value: '',
  });

  // Get calculation method from department features
  const { getCalculationMethodName } = useCompanyFeatures(kpi?.id);

  useEffect(() => {
 
    
    if (reviewId) {
      fetchReview();
      loadDraft();
    } else if (kpiId) {
      fetchKPIForNewReview();
    } else {
      navigate('/manager/dashboard');
    }
  }, [reviewId, kpiId]);

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
      const response = await api.get('/rating-options');
      const allOptions = response.data.rating_options || [];
      
      // Filter numeric options based on KPI period (yearly or quarterly)
      const periodType = period || 'quarterly'; // Default to quarterly if not specified
      const numericOptions = allOptions.filter((opt: RatingOption) => 
        opt.rating_type === periodType
      );
      const qualitativeOptions = allOptions.filter((opt: RatingOption) => 
        opt.rating_type === 'qualitative'
      );
      
      setRatingOptions(numericOptions);
      setQualitativeRatingOptions(qualitativeOptions);
      
      // If no options returned, use fallback
      if (numericOptions.length === 0) {
        const fallbackOptions = [
          { rating_value: 1.00, label: 'Below Expectation', rating_type: periodType as 'quarterly' | 'yearly' },
          { rating_value: 1.25, label: 'Meets Expectation', rating_type: periodType as 'quarterly' | 'yearly' },
          { rating_value: 1.50, label: 'Exceeds Expectation', rating_type: periodType as 'quarterly' | 'yearly' },
        ];
        setRatingOptions(fallbackOptions);
      }
    } catch (error) {
      // Fallback to default options if API fails
      const periodType = period || 'quarterly';
      const fallbackOptions = [
        { rating_value: 1.00, label: 'Below Expectation', rating_type: periodType as 'quarterly' | 'yearly' },
        { rating_value: 1.25, label: 'Meets Expectation', rating_type: periodType as 'quarterly' | 'yearly' },
        { rating_value: 1.50, label: 'Exceeds Expectation', rating_type: periodType as 'quarterly' | 'yearly' },
      ];
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
        const kpiData = kpiRes.data.data || kpiRes.data.kpi || kpiRes.data;
       
        setKpi(kpiData);
        
        // Initialize manager ratings/comments for all items
        if (kpiData && kpiData.items && kpiData.items.length > 0) {
          const { ratings, comments } = initializeItemMaps(kpiData.items);
          setManagerRatings(ratings);
          setManagerComments(comments);
        }
        
        // Parse employee ratings/comments from structured data or JSON fallback
        const { ratings: empRatings, comments: empComments } = parseEmployeeData(
          reviewData.employee_comment || '{}',
          reviewData.item_ratings // Pass structured data if available
        );
        
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
        
        // Load existing manager ratings from database (item_ratings.manager)
        const mgrRatings: ItemRatingsMap = {};
        const mgrComments: ItemCommentsMap = {};
        const mgrQualitativeRatings: ItemRatingsMap = {};
        const mgrQualitativeComments: ItemCommentsMap = {};
        const mgrActualValues: Record<number, string> = {};
        const mgrTargetValues: Record<number, string> = {};
        const mgrGoalWeights: Record<number, string> = {};
        const mgrCurrentStatuses: Record<number, string> = {};
        
        if (reviewData.item_ratings && reviewData.item_ratings.manager) {
          Object.entries(reviewData.item_ratings.manager).forEach(([itemIdStr, ratingData]: [string, any]) => {
            const itemId = parseInt(itemIdStr);
            const item = kpiData.items?.find((i: any) => i.id === itemId);
            
            if (item && item.is_qualitative) {
              // Qualitative item
              if (ratingData.qualitative_rating !== null && ratingData.qualitative_rating !== undefined) {
                mgrQualitativeRatings[itemId] = ratingData.qualitative_rating;
              }
              if (ratingData.comment) {
                mgrQualitativeComments[itemId] = ratingData.comment;
              }
            } else {
              // Quantitative item
              if (ratingData.rating !== null && ratingData.rating !== undefined) {
                mgrRatings[itemId] = ratingData.rating;
              }
              if (ratingData.comment) {
                mgrComments[itemId] = ratingData.comment;
              }
              if (ratingData.actual_value) {
                mgrActualValues[itemId] = ratingData.actual_value;
              }
            }
          });
          
        
        } else {
          // Fallback: Try parsing from JSON (legacy)
          const { ratings: mgrRatingsLegacy, comments: mgrCommentsLegacy } = parseManagerData(
            reviewData.manager_comment || '{}'
          );
          Object.assign(mgrRatings, mgrRatingsLegacy);
          Object.assign(mgrComments, mgrCommentsLegacy);
        }
        
        // Set manager ratings state
        if (Object.keys(mgrRatings).length > 0) {
          setManagerRatings(mgrRatings);
        } else {
        }
        if (Object.keys(mgrComments).length > 0) {
          setManagerComments(mgrComments);
        }
        if (Object.keys(mgrQualitativeRatings).length > 0) {
          setQualitativeRatings(mgrQualitativeRatings);
        }
        if (Object.keys(mgrQualitativeComments).length > 0) {
          setQualitativeComments(mgrQualitativeComments);
        }
        if (Object.keys(mgrActualValues).length > 0) {
          setActualValues(mgrActualValues);
        }

        // Load accomplishments from review
       
        
        if (reviewData.accomplishments && Array.isArray(reviewData.accomplishments)) {
       
          setAccomplishments(reviewData.accomplishments);
        } else {
          // Set empty array so table still shows for manager
          setAccomplishments([]);
        }

        // Load target values, goal weights, and current status from kpi items (don't overwrite manager's actual values)
        const targetVals: Record<number, string> = {};
        const goalWeightVals: Record<number, string> = {};
        const currentStatusVals: Record<number, string> = {};
        if (kpiData.items) {
          kpiData.items.forEach((item: any) => {
            if (item.target_value) {
              targetVals[item.id] = item.target_value;
            }
            if (item.goal_weight) {
              goalWeightVals[item.id] = item.goal_weight;
            }
            if (item.current_performance_status) {
              currentStatusVals[item.id] = item.current_performance_status;
            }
            // Only set actual value from item if manager hasn't entered one
            if (item.actual_value && !mgrActualValues[item.id]) {
              mgrActualValues[item.id] = item.actual_value;
            }
          });
        }
        setTargetValues(targetVals);
        setGoalWeights(goalWeightVals);
        setCurrentPerformanceStatuses(currentStatusVals);
        // Update actual values with merged data (manager entries + item fallbacks)
        if (Object.keys(mgrActualValues).length > 0) {
          setActualValues(mgrActualValues);
        }
      } catch (error) {
        console.error('Error fetching KPI:', error);
      }
      
      setOverallComment(reviewData.overall_comment || '');
      setMajorAccomplishmentsManagerComment(reviewData.major_accomplishments_comment || '');
      setDisappointmentsManagerComment(reviewData.disappointments_comment || '');
      setImprovementNeededManagerComment(reviewData.improvement_needed_manager_comment || '');
      // Load manager signature if exists
      if (reviewData.manager_signature) {
        setManagerSignature(reviewData.manager_signature);
      }
      if (reviewData.manager_signed_at) {
        setReviewDate(new Date(reviewData.manager_signed_at));
      }
    } catch (error) {
      console.error('❌ [fetchReview] Error fetching review:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchKPIForNewReview = async () => {
    try {
      const response = await api.get(`/kpis/${kpiId}`);
      const kpiData = response.data.data || response.data.kpi || response.data;
      
      setKpi(kpiData);
      
      // Initialize empty review object for new review
      setReview({
        id: 0, // Temporary ID for new review
        kpi_id: kpiData.id,
        employee_id: kpiData.employee_id,
        manager_id: kpiData.manager_id,
        company_id: kpiData.company_id,
        employee_name: kpiData.employee_name,
        manager_name: kpiData.manager_name,
        kpi_title: kpiData.title,
        review_quarter: kpiData.quarter,
        review_year: kpiData.year,
        review_period: kpiData.period || 'quarterly',
        employee_rating: undefined,
        manager_rating: undefined,
        employee_comment: undefined,
        manager_comment: undefined,
        overall_comment: undefined,
      } as Partial<KPIReview> as KPIReview);
      
      // Initialize manager ratings/comments for all items
      if (kpiData && kpiData.items && kpiData.items.length > 0) {
        const { ratings, comments } = initializeItemMaps(kpiData.items);
        setManagerRatings(ratings);
        setManagerComments(comments);
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
      toast.error('Failed to load KPI data');
      navigate('/manager/dashboard');
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
    const newRatings = { ...managerRatings, [itemId]: ratingValue };
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

    // Validate all KPI items are rated (returns details on missing items)
    const validation = validateAllItemsRated(kpi.items, managerRatings, qualitativeRatings);
    const allRated = validation.valid;
    if (!allRated) {
      // Show a user-friendly toast and also include item ids for debugging
      toast.error('Please provide a rating for all KPI items. Missing: ' + validation.missingItems.map(i => `${i.item_id}(${i.title})`).join(', '));
      return;
    }

    // Additional guard: ensure at least one manager rating is > 0 (avoid submitting all-zero payloads)
    const managerValues = Object.values(managerRatings || {}).map(v => parseFloat(String(v)) || 0);
    const hasAnyManagerRating = managerValues.some(v => v > 0) || (accomplishments && accomplishments.length > 0);
    if (!hasAnyManagerRating) {
      toast.error('Please provide ratings for items before submitting the review');
      return;
    }

    // Check if Performance Reflection should be hidden (Quarterly + Goal Weight + Self Rating Enabled)
    const kpiPeriod = kpi?.period?.toLowerCase() === 'yearly' ? 'yearly' : 'quarterly';
    const calculationMethodName = kpi?.period ? getCalculationMethodName(kpi.period) : 'Normal Calculation';
    const shouldHidePerformanceReflection = 
      kpiPeriod === 'quarterly' && 
      calculationMethodName.includes('Goal Weight');

    // Only validate accomplishments if Performance Reflection section is visible
    if (!shouldHidePerformanceReflection) {
      // Validate all accomplishments have manager ratings
      if (accomplishments && accomplishments.length > 0) {
        const unratedAccomplishments = accomplishments.some(acc => {
          const isUnrated = acc.manager_rating === null || 
            acc.manager_rating === undefined;
          return isUnrated;
        });
        
        if (unratedAccomplishments) {
          toast.error('Please provide ratings for all major accomplishments');
          return;
        }
        console.log('✅ All accomplishments validated');
      }
    }

    if (!managerSignature) {
      toast.warning('Please provide your digital signature');
      return;
    }


    // Calculate and round average rating (including accomplishments)
    const averageRating = calculateAverageRating(kpi.items, managerRatings, accomplishments);
    const roundedRating = roundToAllowedRating(averageRating);

    // Build manager ratings array for kpi_item_ratings table
    const managerRatingsArray = kpi.items.map(item => {
      const actualValue = actualValues[item.id] || '';
      const targetValue = targetValues[item.id] || item.target_value || '';
      const goalWeight = goalWeights[item.id] || item.goal_weight || '';
      const currentStatus = currentPerformanceStatuses[item.id] || item.current_performance_status || '';
      
      const targetValueNum = targetValue ? parseFloat(String(targetValue)) : 0;
      const goalWeightNum = goalWeight ? parseFloat(String(goalWeight).replace('%', '')) / 100 : 0;
      
      // Calculate percentage value obtained: (actual / target) * 100
      const percentageValueObtained = actualValue && targetValueNum > 0 
        ? (parseFloat(actualValue) / targetValueNum) * 100
        : null;
      
      // Calculate manager rating percentage: Use manual value if provided, otherwise calculate
      const manualRatingPercentage = managerRatingPercentages[item.id];
      const calculatedRatingPercentage = percentageValueObtained && goalWeightNum > 0
        ? percentageValueObtained * goalWeightNum
        : null;
      
      // Use manual value if provided, otherwise use calculated value
      const managerRatingPercentage = manualRatingPercentage && manualRatingPercentage.trim() !== ''
        ? parseFloat(manualRatingPercentage.replace('%', ''))
        : calculatedRatingPercentage;
      
      return {
        item_id: item.id,
        rating: managerRatings[item.id] || 0,
        comment: managerComments[item.id] || '',
        actual_value: actualValue || null,
        target_value: targetValue || null,
        goal_weight: goalWeight || null,
        current_performance_status: currentStatus || null,
        percentage_value_obtained: percentageValueObtained,
        manager_rating_percentage: managerRatingPercentage,
      };
    });


    setSaving(true);
    try {
        // Prepare qualitative ratings array for backend
        const qualitativeRatingsArray = buildQualitativeRatingsArray(
          kpi.items,
          qualitativeRatings,
          qualitativeComments
        );

        const payload = {
          manager_rating: managerRatingsArray, // Send as array for kpi_item_ratings table
          overall_comment: overallComment,
          manager_signature: managerSignature,
          qualitative_ratings: qualitativeRatingsArray,
          major_accomplishments_comment: majorAccomplishmentsManagerComment,
          disappointments_comment: disappointmentsManagerComment,
          improvement_needed_manager_comment: improvementNeededManagerComment,
          accomplishments: accomplishments,
          average_manager_rating: roundedRating, // Include rounded average for kpi_reviews table
          manager_final_rating_percentage: managerFinalRatingPercentage, // ⭐ Send calculated percentage from frontend
        };

        
        
     
        
        
        // Log each item's data to verify what's being sent
        managerRatingsArray.forEach((item, index) => {
         
          
          // Warn about missing critical data
          const warnings = [];
          if (!item.actual_value || item.actual_value === '') warnings.push('ACTUAL VALUE');
          if (!item.current_performance_status || item.current_performance_status === '') warnings.push('CURRENT PERFORMANCE STATUS');
          if (item.percentage_value_obtained === null || item.percentage_value_obtained === undefined) warnings.push('PERCENTAGE OBTAINED');
          if (item.manager_rating_percentage === null || item.manager_rating_percentage === undefined) warnings.push('MANAGER RATING %');
          if (!item.comment || item.comment === '') warnings.push('MANAGER COMMENT');
          
          if (warnings.length > 0) {
            console.warn(`⚠️ [Item ${item.item_id}] Missing data: ${warnings.join(', ')}`);
          } else {
            console.log(`✅ [Item ${item.item_id}] All data present`);
          }
        });

        // Check if this is a manager-initiated review (no reviewId) or updating existing review
        let response;
        if (!reviewId && kpiId) {
          // Manager-initiated review: Create new review for this KPI
          response = await api.post(`/kpi-review/initiate/${kpiId}`, payload);
        } else if (reviewId) {
          // Existing review: Update with manager ratings
          response = await api.post(`/kpi-review/${reviewId}/manager-review`, payload);
        } else {
          throw new Error('Invalid state: No reviewId or kpiId available');
        }
        
        
        // Verify response indicates success
        if (response.data.success) {
          
          // Log the returned review data if available
          if (response.data.review) {
           
          }
        } else {
          console.warn('⚠️ [handleSubmit] Backend returned success=false:', response.data);
        }

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

  // EMPLOYEE ratings: Fetch from backend (employee already submitted)
  // Backend returns strings from PostgreSQL, need to parse to numbers
  const employeeAvg = review?.employee_rating 
    ? parseFloat(review.employee_rating.toString())
    : 0;
  const employeeFinalRating = review?.employee_final_rating
    ? parseFloat(review.employee_final_rating.toString())
    : employeeAvg;
  
  // Employee percentages from backend (calculated when employee submitted)
  const employeeRatingPercentage = review?.employee_rating_percentage
    ? parseFloat(review.employee_rating_percentage.toString())
    : null;
  const employeeFinalRatingPercentage = review?.employee_final_rating_percentage
    ? parseFloat(review.employee_final_rating_percentage.toString())
    : null;
  
 
  
  // MANAGER ratings: Calculate in REAL-TIME as manager is rating (like SelfRating.tsx)
  // Use IIFE pattern instead of useMemo for immediate recalculation
  const managerAvg = (() => {
   
    
    // If already submitted, use backend value
    if (typeof review?.manager_rating === 'number') {
      return review.manager_rating;
    }
    
    // Calculate from current form state (like SelfRating does)
    if (!kpi || !kpi.items) {
      return 0;
    }
    
    // Get items with ratings (exclude qualitative and excluded items)
    const itemsWithRatings = kpi.items.filter((item: any) => 
      !item.is_qualitative && 
      managerRatings[item.id] && 
      managerRatings[item.id] > 0 &&
      (!item.exclude_from_calculation || item.exclude_from_calculation === 0)
    );
    
    const itemRatingsSum = itemsWithRatings.reduce((acc, item: any) => 
      acc + (managerRatings[item.id] || 0), 0);
    
    // Include accomplishments with manager_rating
    const accomplishmentRatings = accomplishments
      .filter(acc => acc.manager_rating !== null && acc.manager_rating !== undefined && acc.manager_rating > 0)
      .map(acc => Number(acc.manager_rating) || 0);
    const accomplishmentsSum = accomplishmentRatings.reduce((acc: number, rating: number) => acc + rating, 0);
    
    const totalCount = itemsWithRatings.length + accomplishmentRatings.length;
   
    
    if (totalCount === 0) {
      return 0;
    }
    
    const average = (itemRatingsSum + accomplishmentsSum) / totalCount;
    return average;
  })();
  
  const managerFinalRating = typeof review?.manager_final_rating === 'number' 
    ? review.manager_final_rating 
    : managerAvg;
  
  // Manager percentage: Calculate in real-time (like SelfRating does)
  const managerFinalRatingPercentage = (() => {
  
    
    // If already submitted, use backend value
    if (typeof review?.manager_final_rating_percentage === 'number') {
      return review.manager_final_rating_percentage;
    }
    
    // Calculate percentage in real-time
    if (managerAvg === 0) {
      return null;
    }
    
    if (ratingOptions.length === 0) {
      return null;
    }
    
    const maxRating = Math.max(...ratingOptions.map(opt => parseFloat(String(opt.rating_value))));
    
    if (maxRating === 0) {
      return null;
    }
    
    const percentage = (managerAvg / maxRating) * 100;
    return percentage;
  })();
  
 

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
    targetValues,
    goalWeights,
    currentPerformanceStatuses,
    managerRatingPercentages,
    textModal,
    employeeAvg,
    managerAvg,
    employeeFinalRating,
    managerFinalRating,
    employeeRatingPercentage,
    employeeFinalRatingPercentage,
    managerFinalRatingPercentage,
    
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
    setTargetValues,
    setGoalWeights,
    setCurrentPerformanceStatuses,
    setManagerRatingPercentages,
    setTextModal,
    handleRatingChange,
    handleCommentChange,
    handleSaveDraft,
    handleSubmit,
    handleBack,
    getRatingLabel,
  };
};
