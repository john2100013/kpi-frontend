/**
 * useKPIDetails Hook (Updated to match Manager implementation)
 * Manages KPI details page state and logic with calculation method support
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { useToast } from '../../../context/ToastContext';
import { useConfirm } from '../../../hooks/useConfirm';
import { KPI, KPIReview } from '../../../types';
import { TextModalState } from '../types';
import { hrService } from '../services/hrService';
import { filterKPIItems, parseReviewData } from './kpiDetailsUtils';

export const useKPIDetails = () => {
  const { kpiId } = useParams<{ kpiId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();

  // State
  const [kpi, setKpi] = useState<KPI | null>(null);
  const [review, setReview] = useState<KPIReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolveNote, setResolveNote] = useState('');
  const [textModal, setTextModal] = useState<TextModalState>({
    isOpen: false,
    title: '',
    value: '',
  });

  // Actual vs Target data (from kpi_item_ratings table)
  const [actualValues, setActualValues] = useState<Record<number, string>>({});
  const [targetValues, setTargetValues] = useState<Record<number, string>>({});
  const [goalWeights, setGoalWeights] = useState<Record<number, string>>({});
  const [currentPerformanceStatuses, setCurrentPerformanceStatuses] = useState<Record<number, string>>({});
  const [percentageValuesObtained, setPercentageValuesObtained] = useState<Record<number, number>>({});
  const [managerRatingPercentages, setManagerRatingPercentages] = useState<Record<number, number>>({});
  const [finalRatingPercentage, setFinalRatingPercentage] = useState<number>(0);

  useEffect(() => {

    if (kpiId) {

      fetchKPIData();
    } else {
    }
  }, [kpiId]);

  const fetchKPIData = async () => {
    try {

      setLoading(true);
      
      // Fetch KPI and review data
      const { kpi: fetchedKpi, review: fetchedReview } = await hrService.fetchKPIById(kpiId!);
      
      // Filter items to ensure they belong to this specific KPI
      const filteredKPI = filterKPIItems(fetchedKpi, parseInt(kpiId!));
      setKpi(filteredKPI);

      if (fetchedReview) {
        // Fetch the full review details by ID to get accomplishments

        try {
          const fullReviewResponse = await api.get(`/kpi-review/${fetchedReview.id}`);
          const fullReview = fullReviewResponse.data.review;
          

          setReview(fullReview);
          
          // Fetch ratings data for this review
          await fetchRatingsData(fullReview.id);
        } catch (reviewError) {
          toast.error('Server error. Please try reloading or try later.');
          // Fallback to the review from the list
          setReview(fetchedReview);
        }
      } else {
      }
    } catch (error) {
      toast.error('Failed to load KPI details');
    } finally {
      setLoading(false);
    }
  };

  // Fetch ratings data with actual values and percentages (same as Manager implementation)
  const fetchRatingsData = async (reviewId: number) => {
    try {
      const response = await api.get(`/kpi-review/${reviewId}/ratings`);
      
      // Backend returns { review, ratings } from kpi_item_ratings table
      const ratings = response.data.ratings;
      

      
      if (!ratings || !Array.isArray(ratings)) {
        return;
      }
      
      // Extract actual values and percentages from kpi_item_ratings table
      const actualVals: Record<number, string> = {};
      const targetVals: Record<number, string> = {};
      const goalWeightsMap: Record<number, string> = {};
      const statusMap: Record<number, string> = {};
      const percentages: Record<number, number> = {};
      const managerPercentages: Record<number, number> = {};
      let totalPercentage = 0;
      
      ratings.forEach((rating: any) => {

        
        // Only extract data from manager ratings
        if (rating.kpi_item_id && rating.rater_role === 'manager') {
          if (rating.actual_value) {
            actualVals[rating.kpi_item_id] = rating.actual_value;
          }
          if (rating.target_value) {
            targetVals[rating.kpi_item_id] = rating.target_value;
          }
          if (rating.goal_weight) {
            goalWeightsMap[rating.kpi_item_id] = rating.goal_weight;
          }
          if (rating.current_performance_status) {
            statusMap[rating.kpi_item_id] = rating.current_performance_status;
          }
          if (rating.percentage_value_obtained !== null && rating.percentage_value_obtained !== undefined) {
            percentages[rating.kpi_item_id] = parseFloat(rating.percentage_value_obtained);
          }
          if (rating.manager_rating_percentage !== null && rating.manager_rating_percentage !== undefined) {
            managerPercentages[rating.kpi_item_id] = parseFloat(rating.manager_rating_percentage);
            totalPercentage += parseFloat(rating.manager_rating_percentage);
          }
        }
      });
      
      setActualValues(actualVals);
      setTargetValues(targetVals);
      setGoalWeights(goalWeightsMap);
      setCurrentPerformanceStatuses(statusMap);
      setPercentageValuesObtained(percentages);
      setManagerRatingPercentages(managerPercentages);
      setFinalRatingPercentage(totalPercentage);
      
    } catch (err) {
      toast.error('Server error. Please try reloading or try later.');
    }
  };

  const getStageInfo = () => {
    if (!kpi) {
      return {
        stage: '',
        color: '',
        icon: 'clock',
      };
    }

    if (kpi.status === 'pending') {
      return {
        stage: 'KPI Setting - Awaiting Acknowledgement',
        color: 'bg-orange-100 text-orange-700 border-orange-200',
        icon: 'clock',
      };
    }

    if (kpi.status === 'acknowledged' && !review) {
      return {
        stage: 'KPI Acknowledged - Review Pending',
        color: 'bg-blue-100 text-blue-700 border-blue-200',
        icon: 'clock',
      };
    }

    if (review) {
      if (review.review_status === 'manager_submitted' && review.employee_confirmation_status !== 'confirmed') {
        return {
          stage: 'Awaiting Employee Confirmation',
          color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
          icon: 'clock',
        };
      }

      if (review.review_status === 'employee_submitted') {
        return {
          stage: 'Self-Rating Submitted - Awaiting Manager Review',
          color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
          icon: 'clock',
        };
      }

      if (review.review_status === 'manager_submitted' || review.review_status === 'completed') {
        return {
          stage: 'KPI Review Completed',
          color: 'bg-green-100 text-green-700 border-green-200',
          icon: 'check',
        };
      }

      if (review.review_status === 'rejected') {
        return {
          stage: 'Review Rejected',
          color: 'bg-red-100 text-red-700 border-red-200',
          icon: 'clock',
        };
      }

      if (review.review_status === 'pending') {
        return {
          stage: 'KPI Review - Self-Rating Required',
          color: 'bg-purple-100 text-purple-700 border-purple-200',
          icon: 'clock',
        };
      }
    }

    return {
      stage: 'In Progress',
      color: 'bg-gray-100 text-gray-700 border-gray-200',
      icon: 'clock',
    };
  };

  // HR-specific: Handle rejection resolution
  const handleResolveRejection = async () => {
    if (!review) return;

    const confirmed = await confirm.confirm({
      title: 'Mark as Resolved',
      message: 'Mark this rejection as resolved? This will move it to the Resolved Issues section.',
      variant: 'info',
    });

    if (confirmed) {
      try {
        await hrService.resolveRejection(review.id, resolveNote);
        toast.success('Rejection marked as resolved successfully!');
        setResolveNote('');
        fetchKPIData(); // Refresh data
      } catch (error) {
        toast.error('Failed to mark as resolved');
      }
    }
  };

  // Parse review data for ratings and comments
  const parsedReviewData = parseReviewData(review);

  const openTextModal = (title: string, value: string) => {
    setTextModal({ isOpen: true, title, value });
  };

  const closeTextModal = () => {
    setTextModal({ isOpen: false, title: '', value: '' });
  };

  return {
    // State
    kpi,
    review,
    loading,
    resolveNote,
    setResolveNote,
    textModal,
    parsedReviewData,
    stageInfo: getStageInfo(),
    
    // Actual vs Target data
    actualValues,
    targetValues,
    goalWeights,
    currentPerformanceStatuses,
    percentageValuesObtained,
    managerRatingPercentages,
    finalRatingPercentage,
    
    // Actions
    openTextModal,
    closeTextModal,
    handleResolveRejection,
    navigate,
  };
};

