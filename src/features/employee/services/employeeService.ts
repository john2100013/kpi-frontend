import api from '../../../services/api';
import { KPI, KPIReview } from '../../../types';
import { 
  AcknowledgementData, 
  KPIAcknowledgement, 
  EmployeeDashboardStats,
  RatingOption,
  SelfRatingSubmission,
  KPIReviewConfirmation,
  ConfirmationSubmission
} from '../types';

export const employeeService = {
  // Fetch employee's KPIs
  fetchMyKPIs: async (): Promise<KPI[]> => {
    const response = await api.get('/kpis');
    return response.data.kpis || [];
  },

  // Fetch pending KPIs (need acknowledgement)
  fetchPendingKPIs: async (): Promise<KPI[]> => {
    const response = await api.get('/kpis');
    const kpis = response.data.kpis || [];
    return kpis.filter((kpi: KPI) => kpi.status === 'pending');
  },

  // Fetch single KPI by ID
  fetchKPIById: async (id: number): Promise<KPI> => {
    const response = await api.get(`/kpis/${id}`);
    return response.data.kpi || response.data;
  },

  // Fetch KPI reviews
  fetchKPIReviews: async (): Promise<KPIReview[]> => {
    const response = await api.get('/kpi-review');
    return response.data.reviews || [];
  },

  // Fetch review for specific KPI
  fetchReviewForKPI: async (kpiId: number): Promise<KPIReview | null> => {
    try {
      const response = await api.get(`/kpi-review?kpi_id=${kpiId}`);
      if (response.data.reviews && response.data.reviews.length > 0) {
        return response.data.reviews[0];
      }
      return null;
    } catch (error) {
      return null;
    }
  },

  // Fetch review by ID for confirmation
  fetchReviewById: async (reviewId: number): Promise<KPIReviewConfirmation> => {
    const response = await api.get(`/kpi-review/${reviewId}`);
    console.log('📥 [employeeService] fetchReviewById response.data:', response.data);
    return response.data.review;
  },

  // Submit confirmation
  submitConfirmation: async (reviewId: number, data: ConfirmationSubmission): Promise<void> => {
    await api.post(`/kpi-review/${reviewId}/employee-confirmation`, data);
  },

  // Fetch rating options
  fetchRatingOptions: async (period?: string): Promise<RatingOption[]> => {
    console.log('🔍 [employeeService] fetchRatingOptions called with period:', period);
    try {
      const params = period ? { period } : {};
      const response = await api.get('/rating-options', { params });
      console.log('✅ [employeeService] Rating options response:', response.data);
      return response.data?.rating_options || [];
    } catch (error) {
      console.error('❌ [employeeService] Error fetching rating options:', error);
      return [];
    }
  },

  // Submit self-rating
  submitSelfRating: async (kpiId: number, data: SelfRatingSubmission): Promise<void> => {
    await api.post(`/kpi-review/${kpiId}/self-rating`, data);
  },

  // Acknowledge KPI
  acknowledgeKPI: async (data: AcknowledgementData): Promise<KPIAcknowledgement> => {
    const response = await api.post(`/kpis/${data.kpi_id}/acknowledge`, data);
    return response.data;
  },

  // Fetch dashboard statistics
  fetchDashboardStats: async (): Promise<EmployeeDashboardStats> => {
    const response = await api.get('/employee/statistics');
    return response.data;
  },

  // Fetch KPI acknowledgement status
  fetchAcknowledgementStatus: async (kpiId: number): Promise<KPIAcknowledgement | null> => {
    try {
      const response = await api.get(`/kpis/${kpiId}/acknowledgement`);
      return response.data;
    } catch (error) {
      return null;
    }
  },
};