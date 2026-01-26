/**
 * Custom hook for Rejected KPI Management page
 */

import { useState, useEffect } from 'react';
import { useToast } from '../../../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { KPI, KPIReview } from '../../../types';
import { hrService } from '../services';

export const useRejectedKPIManagement = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'rejected' | 'resolved' | null>(null);
  const [kpis, setKpis] = useState<KPIReview[]>([]);
  const [reviews, setReviews] = useState<KPIReview[]>([]);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [resolvedCount, setResolvedCount] = useState(0);
  const toast = useToast();

  useEffect(() => {
    fetchData();
  }, [selectedFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);

      
      const [kpisRes, reviewsRes] = await Promise.all([
        hrService.fetchKPIs({}),
        hrService.fetchReviews(),
      ]);


      // CRITICAL: The component doesn't need KPIs - it only needs reviews!
      // Each review already has kpi_id and all KPI info (kpi_title, kpi_description, etc.)
      // We can filter reviews directly by confirmation_status
      const allReviews = reviewsRes || [];
    

      setReviews(allReviews);

      // FIXED: Check confirmation_status (actual field name from backend)

      
      // IMPORTANT: Work directly with reviews - they already contain KPI info
      // Filter reviews based on rejection status
      const rejectedReviews = allReviews.filter((review: any) => {
        return review.confirmation_status === 'rejected' && review.rejection_resolved_status !== 'resolved';
      });

      const resolvedReviews = allReviews.filter((review: any) => {
        return review.confirmation_status === 'rejected' && review.rejection_resolved_status === 'resolved';
      });


      setRejectedCount(rejectedReviews.length);
      setResolvedCount(resolvedReviews.length);
      setReviews(allReviews);

      // Set displayed data based on selection (using reviews, not KPIs)
      if (selectedFilter === 'rejected') {
        setKpis(rejectedReviews);
      } else if (selectedFilter === 'resolved') {
        setKpis(resolvedReviews);
      } else {
        setKpis([]);
      }
      

    } catch (error) {
      toast.error('Server error. Please try reloading or try later.');
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (filter: 'rejected' | 'resolved') => {
    setSelectedFilter(selectedFilter === filter ? null : filter);
  };

  const getReviewForKPI = (kpiId: number): KPIReview | undefined => {
    return reviews.find(r => r.kpi_id === kpiId);
  };

  return {
    loading,
    selectedFilter,
    kpis,
    reviews,
    rejectedCount,
    resolvedCount,
    handleCardClick,
    getReviewForKPI,
    navigate,
  };
};
