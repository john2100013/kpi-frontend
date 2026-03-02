/**
 * Email Queue API Service
 * Handles API calls for email queue monitoring and management
 */

import api from './api';

export interface EmailQueueStats {
  pending: number;
  processing: number;
  sent: number;
  failed: number;
  total: number;
}

export interface FailedEmail {
  id: number;
  to_email: string;
  subject: string;
  template_type: string;
  template_data?: any;
  company_id?: number;
  user_id?: number;
  status: string;
  attempts: number;
  max_attempts: number;
  error_message: string;
  scheduled_at: string;
  processed_at: string;
  created_at: string;
}

export interface RecentActivity {
  stats: {
    sent: number;
    failed: number;
    total: number;
  };
  recentlyFailed: FailedEmail[];
  timeRange: string;
}

export interface PaginatedFailedEmails {
  emails: FailedEmail[];
  total: number;
}

/**
 * Get email queue statistics
 */
export const getEmailQueueStats = async (
  companyId?: number,
  userId?: number
): Promise<EmailQueueStats> => {
  const params: any = {};
  if (companyId) params.companyId = companyId;
  if (userId) params.userId = userId;

  const response = await api.get('/email-queue/stats', { params });
  return response.data.data;
};

/**
 * Get failed emails with pagination
 */
export const getFailedEmails = async (params: {
  page?: number;
  limit?: number;
  userId?: number;
  startDate?: string;
  endDate?: string;
}): Promise<{ data: FailedEmail[]; pagination: any }> => {
  const response = await api.get('/email-queue/failed', { params });
  return {
    data: response.data.data,
    pagination: response.data.pagination,
  };
};

/**
 * Get recent email activity
 */
export const getRecentActivity = async (
  hours: number = 24,
  userId?: number
): Promise<RecentActivity> => {
  const params: any = { hours };
  if (userId) params.userId = userId;

  const response = await api.get('/email-queue/activity', { params });
  return response.data.data;
};

/**
 * Retry a single failed email
 */
export const retryFailedEmail = async (queueId: number): Promise<void> => {
  await api.post(`/email-queue/retry/${queueId}`);
};

/**
 * Retry multiple failed emails
 */
export const retryFailedEmails = async (
  queueIds: number[]
): Promise<{ success: number; failed: number }> => {
  const response = await api.post('/email-queue/retry-bulk', { queueIds });
  return response.data.data;
};
