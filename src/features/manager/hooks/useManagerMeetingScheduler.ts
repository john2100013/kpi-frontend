/**
 * useManagerMeetingScheduler
 * 
 * Custom hook for managing meeting scheduling state and logic.
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../../services/api';
import { useToast } from '../../../context/ToastContext';
import { User, KPI, KPIReview } from '../../../types';

interface UseManagerMeetingSchedulerReturn {
  loading: boolean;
  saving: boolean;
  employees: User[];
  kpis: KPI[];
  reviews: KPIReview[];
  meetingType: 'kpi_setting' | 'kpi_review';
  setMeetingType: (type: 'kpi_setting' | 'kpi_review') => void;
  selectedKpiId: number | null;
  setSelectedKpiId: (id: number | null) => void;
  selectedReviewId: number | null;
  setSelectedReviewId: (id: number | null) => void;
  selectedEmployeeId: number | null;
  setSelectedEmployeeId: (id: number | null) => void;
  scheduledDate: Date | null;
  setScheduledDate: (date: Date | null) => void;
  scheduledTime: string;
  setScheduledTime: (time: string) => void;
  location: string;
  setLocation: (loc: string) => void;
  notes: string;
  setNotes: (notes: string) => void;
  filteredKPIs: KPI[];
  filteredReviews: KPIReview[];
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  handleBack: () => void;
  handleCancel: () => void;
  handleMeetingTypeChange: (type: 'kpi_setting' | 'kpi_review') => void;
}

export const useManagerMeetingScheduler = (): UseManagerMeetingSchedulerReturn => {
  const navigate = useNavigate();
  const toast = useToast();
  const { kpiId, reviewId } = useParams<{ kpiId?: string; reviewId?: string }>();
  
  const [employees, setEmployees] = useState<User[]>([]);
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [reviews, setReviews] = useState<KPIReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [meetingType, setMeetingType] = useState<'kpi_setting' | 'kpi_review'>('kpi_setting');
  const [selectedKpiId, setSelectedKpiId] = useState<number | null>(kpiId ? parseInt(kpiId) : null);
  const [selectedReviewId, setSelectedReviewId] = useState<number | null>(reviewId ? parseInt(reviewId) : null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [scheduledDate, setScheduledDate] = useState<Date | null>(new Date());
  const [scheduledTime, setScheduledTime] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedKpiId && meetingType === 'kpi_setting') {
      const kpi = kpis.find(k => k.id === selectedKpiId);
      if (kpi) {
        setSelectedEmployeeId(kpi.employee_id);
      }
    } else if (selectedReviewId && meetingType === 'kpi_review') {
      const review = reviews.find(r => r.id === selectedReviewId);
      if (review) {
        setSelectedEmployeeId(review.employee_id);
      }
    }
  }, [selectedKpiId, selectedReviewId, meetingType, kpis, reviews]);

  const fetchData = async () => {
    try {
      const [employeesRes, kpisRes, reviewsRes] = await Promise.all([
        api.get('/users/list').catch(() => ({ data: { data: [] } })),
        api.get('/kpis').catch(() => ({ data: { kpis: [] } })),
        api.get('/kpi-review').catch(() => ({ data: { reviews: [] } })),
      ]);

      const users = employeesRes.data.data || employeesRes.data.users || [];
      const employees = users.filter((u: any) => u.role_id !== 1 && u.role_id !== 2 && u.role_id !== 3);
      setEmployees(employees);
      setKpis(kpisRes.data.kpis || kpisRes.data.data || []);
      setReviews(reviewsRes.data.reviews || reviewsRes.data.data || []);

      // Pre-select if kpiId or reviewId is provided
      if (kpiId) {
        const kpi = (kpisRes.data.kpis || []).find((k: KPI) => k.id === parseInt(kpiId));
        if (kpi) {
          setMeetingType('kpi_setting');
          setSelectedKpiId(parseInt(kpiId));
        }
      } else if (reviewId) {
        const review = (reviewsRes.data.reviews || []).find((r: KPIReview) => r.id === parseInt(reviewId));
        if (review) {
          setMeetingType('kpi_review');
          setSelectedReviewId(parseInt(reviewId));
        }
      }
    } catch (error) {
      toast.error('Server error. Please try reloading or try later.');
    } finally {
      setLoading(false);
    }
  };

  const handleMeetingTypeChange = (type: 'kpi_setting' | 'kpi_review') => {
    setMeetingType(type);
    if (type === 'kpi_setting') {
      setSelectedReviewId(null);
    } else {
      setSelectedKpiId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEmployeeId || !scheduledDate) {
      toast.warning('Please select an employee and meeting date');
      return;
    }

    setSaving(true);
    try {
      const meetingData: any = {
        employee_id: selectedEmployeeId,
        meeting_type: meetingType,
        scheduled_date: scheduledDate.toISOString().split('T')[0],
        scheduled_time: scheduledTime || null,
        location: location || null,
        notes: notes || null,
      };

      if (meetingType === 'kpi_setting' && selectedKpiId) {
        meetingData.kpi_id = selectedKpiId;
      } else if (meetingType === 'kpi_review' && selectedReviewId) {
        meetingData.review_id = selectedReviewId;
      }

      await api.post('/meetings', meetingData);
      toast.success('Meeting scheduled successfully! Email notifications have been sent.');
      navigate('/manager/dashboard');
    } catch (error: any) {
      toast.error('Failed to schedule meeting. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleCancel = () => {
    navigate(-1);
  };

  // Filter KPIs and reviews by selected employee
  const filteredKPIs = selectedEmployeeId 
    ? kpis.filter(k => k.employee_id === selectedEmployeeId)
    : kpis;

  const filteredReviews = selectedEmployeeId
    ? reviews.filter(r => r.employee_id === selectedEmployeeId)
    : reviews;

  return {
    loading,
    saving,
    employees,
    kpis,
    reviews,
    meetingType,
    setMeetingType,
    selectedKpiId,
    setSelectedKpiId,
    selectedReviewId,
    setSelectedReviewId,
    selectedEmployeeId,
    setSelectedEmployeeId,
    scheduledDate,
    setScheduledDate,
    scheduledTime,
    setScheduledTime,
    location,
    setLocation,
    notes,
    setNotes,
    filteredKPIs,
    filteredReviews,
    handleSubmit,
    handleBack,
    handleCancel,
    handleMeetingTypeChange,
  };
};
