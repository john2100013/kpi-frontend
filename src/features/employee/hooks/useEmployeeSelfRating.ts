import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { useCompanyFeatures } from '../../../hooks/useCompanyFeatures';
import api from '../../../services/api';
import { KPI, Accomplishment } from '../../../types';
import { RatingOption } from '../types';

interface TextModalState {
  isOpen: boolean;
  title: string;
  value: string;
  onChange?: (value: string) => void;
}

export const useEmployeeSelfRating = () => {
  const { kpiId } = useParams<{ kpiId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();


  const [kpi, setKpi] = useState<KPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ratings, setRatings] = useState<Record<number, number>>({});
  const [comments, setComments] = useState<Record<number, string>>({});
  const [goalWeights, setGoalWeights] = useState<Record<number, string>>({});
  const [employeeSignature, setEmployeeSignature] = useState('');
  const [reviewDate, setReviewDate] = useState<Date | null>(new Date()); // Changed to Date | null
  const [ratingOptions, setRatingOptions] = useState<RatingOption[]>([]);
  const [qualitativeRatingOptions, setQualitativeRatingOptions] = useState<RatingOption[]>([]);
  const [majorAccomplishments, setMajorAccomplishments] = useState('');
  const [disappointments, setDisappointments] = useState('');
  const [improvementNeeded, setImprovementNeeded] = useState('');
  const [accomplishments, setAccomplishments] = useState<Accomplishment[]>([
    { review_id: 0, title: '', description: '', item_order: 1 },
    { review_id: 0, title: '', description: '', item_order: 2 }
  ]);
  const [futurePlan, setFuturePlan] = useState('');
  const [textModal, setTextModal] = useState<TextModalState>({
    isOpen: false,
    title: '',
    value: '',
  });

  // Get calculation method from department features
  const { getCalculationMethodName } = useCompanyFeatures(Number(kpiId));

  useEffect(() => {
    if (kpiId) {
      fetchKPIDetails();
    } else {
      // No kpiId in useEffect (log removed)
    }
  }, [kpiId]);

  // Fetch rating options when KPI period is known
  useEffect(() => {
    if (kpi && kpi.period) {
      fetchRatingOptions(kpi.period);
    }
  }, [kpi]);

  const fetchKPIDetails = async () => {
    if (!kpiId) {
      return;
    }

    try {
      setLoading(true);
      
      const url = `/kpis/${kpiId}`;
      
      const response = await api.get(url);
      
      
      
      // FIXED: Handle nested response structure (response.data.data or response.data.kpi)
      const data = response.data.data || response.data.kpi || response.data;
    
      
      if (!data) {
        throw new Error('No KPI data found in response');
      }
      
      setKpi(data);

      // Fetch existing review data if status indicates employee has submitted
      if (data.status === 'employee_submitted' || data.status === 'manager_submitted' || data.status === 'completed') {
        try {
          const reviewResponse = await api.get(`/kpi-review/kpi/${kpiId}`);
          const review = reviewResponse.data.review || reviewResponse.data;
          
        

          if (review && review.id) {
            // Load ratings and comments from kpi_item_ratings using the ratings endpoint
            const ratingsResponse = await api.get(`/kpi-review/${review.id}/ratings`);
            const itemRatings = ratingsResponse.data.ratings || ratingsResponse.data.item_ratings || [];
            

            const initialRatings: Record<number, number> = {};
            const initialComments: Record<number, string> = {};

            itemRatings.forEach((rating: any) => {
              if (rating.rater_role === 'employee' && rating.kpi_item_id) {
                initialRatings[rating.kpi_item_id] = rating.quantitative_rating || 0;
                initialComments[rating.kpi_item_id] = rating.employee_comment || rating.rating_comment || '';
              }
            });

            setRatings(initialRatings);
            setComments(initialComments);

            // Load review form fields
            if (review.employee_signature) setEmployeeSignature(review.employee_signature);
            if (review.employee_signed_at) setReviewDate(new Date(review.employee_signed_at));
            if (review.major_accomplishments) setMajorAccomplishments(review.major_accomplishments);
            if (review.disappointments) setDisappointments(review.disappointments);
            if (review.improvement_needed) setImprovementNeeded(review.improvement_needed);
            if (review.future_plan) setFuturePlan(review.future_plan);
            
            // Load accomplishments (now included in the review response)
            if (review.accomplishments && Array.isArray(review.accomplishments) && review.accomplishments.length > 0) {
              setAccomplishments(review.accomplishments);
            }
          }
        } catch (reviewError: any) {
          if (typeof window !== 'undefined' && window.toast) {
            window.toast.error('Could not load review data. Please try again later.');
          }
          // It's okay if review doesn't exist yet - user might be doing first-time rating
        }
      } 
      
    } catch (error: any) {
    
      toast.error(error.response?.data?.error || 'Failed to load KPI details');
      navigate('/employee/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchRatingOptions = async (period?: string) => {
    try {
      const response = await api.get('/rating-options');
      const allOptions = response.data?.rating_options || [];
      
      const periodType = period || 'quarterly'; // Default to quarterly if not specified
      const numericOptions = allOptions.filter((opt: RatingOption) => 
        opt.rating_type === periodType
      );
      const qualitativeOptions = allOptions.filter((opt: RatingOption) => 
        opt.rating_type === 'qualitative'
      );
      
      setRatingOptions(numericOptions);
      setQualitativeRatingOptions(qualitativeOptions);
    } catch (error) {
      // Fallback to default options based on period
      const periodType = period || 'quarterly';
      setRatingOptions([
        { rating_value: 1.0, label: 'Below Expectation', rating_type: periodType as 'quarterly' | 'yearly' },
        { rating_value: 1.25, label: 'Meets Expectation', rating_type: periodType as 'quarterly' | 'yearly' },
        { rating_value: 1.5, label: 'Exceeds Expectation', rating_type: periodType as 'quarterly' | 'yearly' },
      ]);
      setQualitativeRatingOptions([]);
    }
  };

  const handleRatingChange = (itemId: number, ratingValue: number) => {
    setRatings((prev) => {
      const updated = { ...prev, [itemId]: ratingValue };
      return updated;
    });
  };

  const handleCommentChange = (itemId: number, comment: string) => {
    setComments((prev) => ({ ...prev, [itemId]: comment }));
  };

  const handleSaveDraft = async () => {
    if (!kpiId || !kpi) return;

    try {
      setSaving(true);
      // Save draft logic here
      const draftData = {
        ratings,
        comments,
        employeeSignature,
        reviewDate: reviewDate?.toISOString(),
        majorAccomplishments,
        disappointments,
        improvementNeeded,
      };
      localStorage.setItem(`self-rating-draft-${kpiId}`, JSON.stringify(draftData));
      toast.success('Draft saved successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!kpiId || !kpi) return;

    // Check if Performance Reflection should be hidden (Quarterly + Goal Weight + Self Rating Enabled)
    const kpiPeriod = kpi?.period?.toLowerCase() === 'yearly' ? 'yearly' : 'quarterly';
    const calculationMethodName = kpi?.period ? getCalculationMethodName(kpi.period) : 'Normal Calculation';
    const shouldHidePerformanceReflection = 
      kpiPeriod === 'quarterly' && 
      calculationMethodName.includes('Goal Weight');

    // Only validate accomplishments if Performance Reflection section is visible
    if (!shouldHidePerformanceReflection) {
      // Validate accomplishments (minimum 2)
      if (accomplishments.length < 2) {
        toast.error('Please add at least 2 major accomplishments');
        return;
      }

      // Validate all accomplishments have titles and ratings
      const incompleteAccomplishments = accomplishments.some(acc => 
        !acc.title || acc.title.trim() === '' || 
        acc.employee_rating === null || 
        acc.employee_rating === undefined
      );

      if (incompleteAccomplishments) {
        toast.error('Please complete all accomplishment titles and ratings');
        return;
      }
    }

    // Validate all KPIs have ratings (excluding qualitative ones)
    const itemsNeedingRatings = kpi.items?.filter((item: any) => !item.is_qualitative) || [];
    const allRated = itemsNeedingRatings.every((item: any) => ratings[item.id] > 0);

    if (!allRated) {
      toast.error('Please provide ratings for all KPIs before submitting');
      return;
    }

    if (!employeeSignature) {
      toast.error('Please provide your signature');
      return;
    }

    if (!reviewDate) {
      toast.error('Please select the review date');
      return;
    }

    try {
      setSaving(true);
      
      // Calculate average rating (from numeric items + accomplishments) - exclude items marked with exclude_from_calculation = 1
      const itemsIncludedInCalculation = itemsNeedingRatings.filter((item: any) => !item.exclude_from_calculation || item.exclude_from_calculation === 0);
      const itemRatingValues = itemsIncludedInCalculation.map((item: any) => ratings[item.id] || 0);
      const accomplishmentRatings = accomplishments
        .filter(acc => acc.employee_rating !== null && acc.employee_rating !== undefined && acc.employee_rating > 0)
        .map(acc => Number(acc.employee_rating) || 0);
      const allRatings = [...itemRatingValues, ...accomplishmentRatings];
      const averageRating = allRatings.length > 0 
        ? allRatings.reduce((sum: number, rating: number) => sum + rating, 0) / allRatings.length
        : 0;
      
      // Round to nearest allowed value
      const allowedRatings = [1.00, 1.25, 1.50];
      const roundedRating = allowedRatings.reduce((prev, curr) => 
        Math.abs(curr - averageRating) < Math.abs(prev - averageRating) ? curr : prev
      );
      
      // Prepare item ratings array - proper REST API structure
      const allItems = kpi.items || [];
      const itemRatings = allItems.map((item: any) => ({
        item_id: item.id,
        rating: ratings[item.id] || 0,
        comment: comments[item.id] || '',
        is_qualitative: item.is_qualitative || false,
      }));

      

   


      const submitResponse = await api.post(`/kpi-review/${kpiId}/self-rating`, {
        overall_rating: roundedRating,
        average_rating: averageRating,
        employee_rating_percentage: employeeRatingPercentage,
        item_ratings: itemRatings,
        employee_signature: employeeSignature,
        review_period: kpi?.period || 'quarterly',
        review_quarter: kpi?.quarter,
        review_year: kpi?.year,
        major_accomplishments: majorAccomplishments,
        disappointments: disappointments,
        improvement_needed: improvementNeeded,
        accomplishments: accomplishments,
        future_plan: futurePlan,
      });
      
     
      
      // Clear draft
      localStorage.removeItem(`self-rating-draft-${kpiId}`);
      
      toast.success('Self-rating submitted successfully!');
      navigate('/employee/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to submit self-rating');
    } finally {
      setSaving(false);
    }
  };

  const openTextModal = (
    title: string,
    value: string,
    _type?: string,       // Prefixed with underscore
    _itemId?: number,     // Prefixed with underscore
    onChange?: (value: string) => void
  ) => {
    setTextModal({
      isOpen: true,
      title,
      value,
      onChange,
    });
  };

  const closeTextModal = () => {
    setTextModal({
      isOpen: false,
      title: '',
      value: '',
    });
  };

  const updateTextModalValue = (value: string) => {
    if (textModal.onChange) {
      textModal.onChange(value);
    }
    setTextModal((prev) => ({ ...prev, value }));
  };

  // Calculate average rating (from items + accomplishments) - exclude items marked with exclude_from_calculation = 1
  const averageRating = (() => {
    const itemsWithRatings = kpi?.items?.filter((item: any) => 
      !item.is_qualitative && 
      ratings[item.id] && 
      (!item.exclude_from_calculation || item.exclude_from_calculation === 0)
    ) || [];
    const itemRatingsSum = itemsWithRatings.reduce((acc, item: any) => acc + (ratings[item.id] || 0), 0);
    
    const accomplishmentRatings = accomplishments
      .filter(acc => acc.employee_rating !== null && acc.employee_rating !== undefined && acc.employee_rating > 0)
      .map(acc => Number(acc.employee_rating) || 0);
    const accomplishmentsSum = accomplishmentRatings.reduce((acc: number, rating: number) => acc + rating, 0);
    
    const totalCount = itemsWithRatings.length + accomplishmentRatings.length;
    if (totalCount === 0) return 0;
    
    return (itemRatingsSum + accomplishmentsSum) / totalCount;
  })();

  // Calculate employee rating percentage based on calculation method
  const employeeRatingPercentage = (() => {
    if (!kpi) return 0;
    
    const calculationMethodName = kpi.period ? getCalculationMethodName(kpi.period) : 'Normal Calculation';
    const includedItems = kpi.items?.filter((item: any) => 
      !item.is_qualitative && 
      (!item.exclude_from_calculation || item.exclude_from_calculation === 0)
    ) || [];
    
    // Include accomplishments with employee_rating
    const accomplishmentsWithRatings = accomplishments.filter(acc => 
      acc.employee_rating !== null && acc.employee_rating !== undefined && acc.employee_rating > 0
    );
    
    // Get the maximum rating value from rating options based on KPI period
    
    const maxRating = ratingOptions.length > 0 
      ? Math.max(...ratingOptions.map(option => Number(option.rating_value))) 
      : 0;
    
   
    
    if (maxRating === 0) {
      return 0;
    }
    
    if (calculationMethodName.includes('Goal Weight')) {
      let totalWeightedScore = 0;
      
      // Calculate for items
      includedItems.forEach(item => {
        const empRating = ratings[item.id] || 0;
        const goalWeight = goalWeights[item.id] || item.goal_weight || item.measure_criteria;
        const goalWeightNum = goalWeight ? parseFloat(String(goalWeight).replace('%', '')) / 100 : 0;
        
        if (empRating > 0 && goalWeightNum > 0) {
          const ratingPercentage = (empRating / maxRating) * 100;
          const weightedScore = ratingPercentage * goalWeightNum;
          totalWeightedScore += weightedScore;
        }
      });
      
      // Include accomplishments - distribute remaining weight equally
      if (accomplishmentsWithRatings.length > 0) {
        const totalItemWeight = includedItems.reduce((sum, item) => {
          const goalWeight = goalWeights[item.id] || item.goal_weight || item.measure_criteria;
          const goalWeightNum = goalWeight ? parseFloat(String(goalWeight).replace('%', '')) / 100 : 0;
          return sum + goalWeightNum;
        }, 0);
        const remainingWeight = Math.max(0, 1 - totalItemWeight);
        const accomplishmentWeight = accomplishmentsWithRatings.length > 0 
          ? remainingWeight / accomplishmentsWithRatings.length 
          : 0;
        
        accomplishmentsWithRatings.forEach(acc => {
          const rating = acc.employee_rating;
          if (rating !== null && rating !== undefined && rating > 0) {
            const ratingPercentage = (Number(rating) / maxRating) * 100;
            const weightedScore = ratingPercentage * accomplishmentWeight;
            totalWeightedScore += weightedScore;
          }
        });
      }
      
      return totalWeightedScore;
    } else {
      // Normal Calculation: (total score / total possible score) × 100
      const totalQuestions = includedItems.length + accomplishmentsWithRatings.length;
      const totalPossibleScore = totalQuestions * maxRating;
      
      // Sum ratings for included items
      const totalItemScore = includedItems.reduce((sum, item) => sum + (ratings[item.id] || 0), 0);
      
      // Sum ratings for accomplishments
      const totalAccomplishmentScore = accomplishmentsWithRatings.reduce((sum, acc) => {
        return sum + (Number(acc.employee_rating) || 0);
      }, 0);
      
      const totalScore = totalItemScore + totalAccomplishmentScore;
      const percentage = totalPossibleScore > 0 ? (totalScore / totalPossibleScore) * 100 : 0;
      
     
      
      return percentage;
    }
  })();

  // Calculate completion percentage
  const completion = (() => {
    const itemsNeedingRatings = kpi?.items?.filter((item: any) => !item.is_qualitative) || [];
    if (itemsNeedingRatings.length === 0) return 100;
    const ratedCount = itemsNeedingRatings.filter((item: any) => ratings[item.id] > 0).length;
    return Math.round((ratedCount / itemsNeedingRatings.length) * 100);
  })();

  return {
    user,
    kpi,
    loading,
    saving,
    ratings,
    comments,
    goalWeights,
    employeeSignature,
    reviewDate,
    ratingOptions,
    qualitativeRatingOptions,
    majorAccomplishments,
    disappointments,
    improvementNeeded,
    accomplishments,
    futurePlan,
    textModal,
    averageRating,
    completion,
    employeeRatingPercentage,
    setEmployeeSignature,
    setReviewDate, // Now returns Date | null
    setMajorAccomplishments,
    setDisappointments,
    setImprovementNeeded,
    setAccomplishments,
    setFuturePlan,
    handleRatingChange,
    handleCommentChange,
    handleSaveDraft,
    handleSubmit,
    openTextModal,
    closeTextModal,
    updateTextModalValue,
    navigate,
  };
};