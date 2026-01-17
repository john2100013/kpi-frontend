import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
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

  console.log('📝 [useEmployeeSelfRating] Hook initialized');
  console.log('📝 [useEmployeeSelfRating] kpiId from params:', kpiId);
  console.log('📝 [useEmployeeSelfRating] User:', { id: user?.id, name: user?.name });

  const [kpi, setKpi] = useState<KPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ratings, setRatings] = useState<Record<number, number>>({});
  const [comments, setComments] = useState<Record<number, string>>({});
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

  useEffect(() => {
    console.log('🔄 [useEmployeeSelfRating] useEffect triggered with kpiId:', kpiId);
    if (kpiId) {
      fetchKPIDetails();
    } else {
      console.error('❌ [useEmployeeSelfRating] No kpiId in useEffect');
    }
  }, [kpiId]);

  // Fetch rating options when KPI period is known
  useEffect(() => {
    console.log('🔄 [useEmployeeSelfRating] KPI period useEffect triggered:', { hasPeriod: !!kpi?.period, period: kpi?.period });
    if (kpi && kpi.period) {
      fetchRatingOptions(kpi.period);
    }
  }, [kpi]);

  const fetchKPIDetails = async () => {
    if (!kpiId) {
      console.error('❌ [useEmployeeSelfRating] No kpiId provided');
      return;
    }

    try {
      console.log('🔍 [useEmployeeSelfRating] fetchKPIDetails started for kpiId:', kpiId);
      setLoading(true);
      
      const url = `/kpis/${kpiId}`;
      console.log('🔍 [useEmployeeSelfRating] Making API call to:', url);
      
      const response = await api.get(url);
      
      console.log('✅ [useEmployeeSelfRating] Raw API response:', response.data);
      console.log('✅ [useEmployeeSelfRating] Response structure:', {
        success: response.data.success,
        hasKpi: !!response.data.kpi,
        hasData: !!response.data.data,
        dataKeys: Object.keys(response.data)
      });
      
      // FIXED: Handle nested response structure (response.data.data or response.data.kpi)
      const data = response.data.data || response.data.kpi || response.data;
      
      console.log('✅ [useEmployeeSelfRating] Extracted KPI data:', {
        id: data?.id,
        title: data?.title,
        status: data?.status,
        period: data?.period,
        hasItems: !!data?.items,
        itemsCount: data?.items?.length
      });
      
      if (!data) {
        console.error('❌ [useEmployeeSelfRating] No KPI data found in response');
        throw new Error('No KPI data found in response');
      }
      
      setKpi(data);
      console.log('✅ [useEmployeeSelfRating] KPI state set successfully');

      // Fetch existing review data if status indicates employee has submitted
      if (data.status === 'employee_submitted' || data.status === 'manager_submitted' || data.status === 'completed') {
        console.log('🔍 [useEmployeeSelfRating] Status indicates submitted - fetching review data');
        try {
          const reviewResponse = await api.get(`/kpi-review/kpi/${kpiId}`);
          const review = reviewResponse.data.review || reviewResponse.data;
          
          console.log('✅ [useEmployeeSelfRating] Review data fetched:', {
            hasReview: !!review,
            review_id: review?.id,
            employee_rating: review?.employee_rating,
            employee_signature: review?.employee_signature,
            hasAccomplishments: !!review?.accomplishments,
            accomplishments_count: review?.accomplishments?.length
          });

          if (review && review.id) {
            // Load ratings and comments from kpi_item_ratings using the ratings endpoint
            const ratingsResponse = await api.get(`/kpi-review/${review.id}/ratings`);
            const itemRatings = ratingsResponse.data.ratings || ratingsResponse.data.item_ratings || [];
            
            console.log('✅ [useEmployeeSelfRating] Item ratings fetched:', itemRatings.length);

            const initialRatings: Record<number, number> = {};
            const initialComments: Record<number, string> = {};

            itemRatings.forEach((rating: any) => {
              if (rating.rater_role === 'employee' && rating.kpi_item_id) {
                initialRatings[rating.kpi_item_id] = rating.quantitative_rating || 0;
                initialComments[rating.kpi_item_id] = rating.employee_comment || rating.rating_comment || '';
              }
            });

            console.log('📊 [useEmployeeSelfRating] Loaded ratings from review:', initialRatings);
            console.log('📊 [useEmployeeSelfRating] Loaded comments from review:', initialComments);
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
              console.log('📊 [useEmployeeSelfRating] Loading accomplishments from review:', review.accomplishments.length);
              setAccomplishments(review.accomplishments);
            }
          }
        } catch (reviewError: any) {
          console.warn('⚠️ [useEmployeeSelfRating] Could not fetch review data (may not exist yet):', reviewError.message);
          // It's okay if review doesn't exist yet - user might be doing first-time rating
        }
      } else {
        console.log('📊 [useEmployeeSelfRating] Status is draft/pending - no review data to load');
      }
      
      console.log('✅ [useEmployeeSelfRating] All KPI data loaded successfully');
    } catch (error: any) {
      console.error('❌ [useEmployeeSelfRating] Error fetching KPI details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url
      });
      toast.error(error.response?.data?.error || 'Failed to load KPI details');
      console.log('🔄 [useEmployeeSelfRating] Navigating back to dashboard');
      navigate('/employee/dashboard');
    } finally {
      console.log('🏁 [useEmployeeSelfRating] fetchKPIDetails completed, setting loading to false');
      setLoading(false);
    }
  };

  const fetchRatingOptions = async (period?: string) => {
    console.log('📋 [useEmployeeSelfRating] fetchRatingOptions started for period:', period);
    try {
      const response = await api.get('/rating-options');
      const allOptions = response.data?.rating_options || [];
      
      console.log('📋 [useEmployeeSelfRating] Fetched rating options:', allOptions.length);
      
      // Filter numeric options based on KPI period (yearly or quarterly)
      const periodType = period || 'quarterly'; // Default to quarterly if not specified
      const numericOptions = allOptions.filter((opt: RatingOption) => 
        opt.rating_type === periodType
      );
      const qualitativeOptions = allOptions.filter((opt: RatingOption) => 
        opt.rating_type === 'qualitative'
      );
      
      console.log(`📋 [SelfRating] Setting ${periodType} rating options:`, numericOptions);
      console.log('📋 [SelfRating] Setting qualitative rating options:', qualitativeOptions);
      setRatingOptions(numericOptions);
      setQualitativeRatingOptions(qualitativeOptions);
    } catch (error) {
      console.error('❌ [useEmployeeSelfRating] Failed to fetch rating options:', error);
      // Fallback to default options based on period
      const periodType = period || 'quarterly';
      console.log('🔄 [useEmployeeSelfRating] Using fallback rating options for:', periodType);
      setRatingOptions([
        { rating_value: 1.0, label: 'Below Expectation', rating_type: periodType as 'quarterly' | 'yearly' },
        { rating_value: 1.25, label: 'Meets Expectation', rating_type: periodType as 'quarterly' | 'yearly' },
        { rating_value: 1.5, label: 'Exceeds Expectation', rating_type: periodType as 'quarterly' | 'yearly' },
      ]);
      setQualitativeRatingOptions([]);
    }
  };

  const handleRatingChange = (itemId: number, ratingValue: number) => {
    console.log('🔄 [useEmployeeSelfRating] handleRatingChange called:', { itemId, ratingValue });
    setRatings((prev) => {
      const updated = { ...prev, [itemId]: ratingValue };
      console.log('✅ [useEmployeeSelfRating] Updated ratings state:', updated);
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
      
      // Calculate average rating (from numeric items + accomplishments)
      const itemRatingValues = itemsNeedingRatings.map((item: any) => ratings[item.id] || 0);
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

      console.log('🚀 [useEmployeeSelfRating] Submitting self-rating:', {
        kpiId,
        user: {
          id: user?.id,
          email: user?.email,
          name: user?.name,
          role: user?.role
        },
        kpi: {
          id: kpi?.id,
          employee_id: kpi?.employee_id,
          period: kpi?.period,
          quarter: kpi?.quarter,
          year: kpi?.year
        },
        payload: {
          overall_rating: roundedRating,
          average_rating: averageRating,
          item_ratings_count: itemRatings.length,
          accomplishments_count: accomplishments.length
        }
      });

      await api.post(`/kpi-review/${kpiId}/self-rating`, {
        overall_rating: roundedRating,
        average_rating: averageRating,
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
      
      console.log('✅ [useEmployeeSelfRating] Self-rating submitted successfully');
      
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

  // Calculate average rating (from items + accomplishments)
  const averageRating = (() => {
    const itemsWithRatings = kpi?.items?.filter((item: any) => !item.is_qualitative && ratings[item.id]) || [];
    const itemRatingsSum = itemsWithRatings.reduce((acc, item: any) => acc + (ratings[item.id] || 0), 0);
    
    const accomplishmentRatings = accomplishments
      .filter(acc => acc.employee_rating !== null && acc.employee_rating !== undefined && acc.employee_rating > 0)
      .map(acc => Number(acc.employee_rating) || 0);
    const accomplishmentsSum = accomplishmentRatings.reduce((acc: number, rating: number) => acc + rating, 0);
    
    const totalCount = itemsWithRatings.length + accomplishmentRatings.length;
    if (totalCount === 0) return 0;
    
    return (itemRatingsSum + accomplishmentsSum) / totalCount;
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