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

// Extended KPIItem interface with review fields
interface ExtendedKPIItem {
  id: number;
  title: string;
  description?: string;
  current_performance_status?: string;
  target_value?: string;
  measure_unit?: string;
  expected_completion_date?: string;
  goal_weight?: string;
  measure_criteria?: string;
  is_qualitative?: boolean;
  self_rating?: number | null;
  employee_comment?: string | null;
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

      // Load existing self-ratings if any
      if (data.items && data.items.length > 0) {
        console.log('📊 [useEmployeeSelfRating] Processing KPI items:', data.items.length);
        const initialRatings: Record<number, number> = {};
        const initialComments: Record<number, string> = {};

        data.items.forEach((item: ExtendedKPIItem) => {
          if (item.self_rating !== null && item.self_rating !== undefined) {
            initialRatings[item.id] = item.self_rating;
          }
          if (item.employee_comment) {
            initialComments[item.id] = item.employee_comment;
          }
        });

        console.log('📊 [useEmployeeSelfRating] Initial ratings:', initialRatings);
        console.log('📊 [useEmployeeSelfRating] Initial comments:', initialComments);
        setRatings(initialRatings);
        setComments(initialComments);
      }

      // Load other self-rating data
      if (data.employee_signature) setEmployeeSignature(data.employee_signature);
      if (data.self_review_date) setReviewDate(new Date(data.self_review_date));
      if (data.major_accomplishments) setMajorAccomplishments(data.major_accomplishments);
      if (data.disappointments) setDisappointments(data.disappointments);
      if (data.improvement_needed) setImprovementNeeded(data.improvement_needed);
      if (data.accomplishments && data.accomplishments.length > 0) {
        setAccomplishments(data.accomplishments);
      }
      if (data.future_plan) setFuturePlan(data.future_plan);
      
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
      const itemRatings = itemsNeedingRatings.map((item: any) => ratings[item.id] || 0);
      const accomplishmentRatings = accomplishments
        .filter(acc => acc.employee_rating !== null && acc.employee_rating !== undefined && acc.employee_rating > 0)
        .map(acc => Number(acc.employee_rating) || 0);
      const allRatings = [...itemRatings, ...accomplishmentRatings];
      const averageRating = allRatings.length > 0 
        ? allRatings.reduce((sum: number, rating: number) => sum + rating, 0) / allRatings.length
        : 0;
      
      // Round to nearest allowed value
      const allowedRatings = [1.00, 1.25, 1.50];
      const roundedRating = allowedRatings.reduce((prev, curr) => 
        Math.abs(curr - averageRating) < Math.abs(prev - averageRating) ? curr : prev
      );
      
      // Include ALL items (both numeric and qualitative) in submission
      const allItems = kpi.items || [];
      const itemData = {
        items: allItems.map((item: any) => ({
          item_id: item.id,
          rating: ratings[item.id] || 0,
          comment: comments[item.id] || '',
          is_qualitative: item.is_qualitative || false,
        })),
        average_rating: averageRating,
        rounded_rating: roundedRating,
      };

      await api.post(`/kpi-review/${kpiId}/self-rating`, {
        employee_rating: roundedRating,
        employee_comment: JSON.stringify(itemData),
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