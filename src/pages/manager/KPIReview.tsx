import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { KPI, KPIReview, KPIItem } from '../../types';
import SignatureField from '../../components/SignatureField';
import DatePicker from '../../components/DatePicker';
import TextModal from '../../components/TextModal';
import { FiArrowLeft, FiSave, FiSend, FiExternalLink } from 'react-icons/fi';

const ManagerKPIReview: React.FC = () => {
  const { reviewId } = useParams<{ reviewId: string }>();
  const navigate = useNavigate();
  const [review, setReview] = useState<KPIReview | null>(null);
  const [kpi, setKpi] = useState<KPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [managerRatings, setManagerRatings] = useState<{ [key: number]: number }>({});
  const [managerComments, setManagerComments] = useState<{ [key: number]: string }>({});
  const [qualitativeRatings, setQualitativeRatings] = useState<{ [key: number]: string }>({});
  const [qualitativeComments, setQualitativeComments] = useState<{ [key: number]: string }>({});
  const [overallComment, setOverallComment] = useState('');
  const [managerSignature, setManagerSignature] = useState('');
  const [reviewDate, setReviewDate] = useState<Date | null>(new Date());
  const [employeeRatings, setEmployeeRatings] = useState<{ [key: number]: number }>({});
  const [employeeComments, setEmployeeComments] = useState<{ [key: number]: string }>({});
  const [ratingOptions, setRatingOptions] = useState<Array<{ rating_value: number; label: string; description?: string }>>([]);
  const [majorAccomplishmentsManagerComment, setMajorAccomplishmentsManagerComment] = useState('');
  const [disappointmentsManagerComment, setDisappointmentsManagerComment] = useState('');
  const [textModal, setTextModal] = useState<{ isOpen: boolean; title: string; value: string; field?: string; itemId?: number; onChange?: (value: string) => void }>({
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

  // Save draft to localStorage whenever form data changes
  useEffect(() => {
    if (reviewId) {
      const draftKey = `kpi-review-draft-${reviewId}`;
      const draftData = {
        managerRatings,
        managerComments,
        qualitativeRatings,
        qualitativeComments,
        overallComment,
        managerSignature,
        reviewDate: reviewDate?.toISOString(),
        majorAccomplishmentsManagerComment,
        disappointmentsManagerComment,
      };
      localStorage.setItem(draftKey, JSON.stringify(draftData));
    }
  }, [managerRatings, managerComments, qualitativeRatings, qualitativeComments, overallComment, managerSignature, reviewDate, reviewId, majorAccomplishmentsManagerComment, disappointmentsManagerComment]);

  const loadDraft = () => {
    if (!reviewId) return;
    // Load draft after a short delay to allow API data to load first
    setTimeout(() => {
      try {
        const draftKey = `kpi-review-draft-${reviewId}`;
        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft) {
          const draftData = JSON.parse(savedDraft);
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
        }
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    }, 500);
  };

  const fetchRatingOptions = async (period?: string) => {
    try {
      console.log('🔍 [KPIReview] Fetching rating options from API for period:', period);
      const params = period ? { period } : {};
      const response = await api.get('/rating-options', { params });
      console.log('✅ [KPIReview] Rating options response:', response.data);
      const options = response.data.rating_options || [];
      console.log('📋 [KPIReview] Setting rating options:', options);
      setRatingOptions(options);
      
      // If no options returned, use fallback
      if (options.length === 0) {
        console.warn('⚠️ [KPIReview] No rating options returned, using fallback');
        const fallbackOptions = [
          { rating_value: 1.00, label: 'Below Expectation' },
          { rating_value: 1.25, label: 'Meets Expectation' },
          { rating_value: 1.50, label: 'Exceeds Expectation' },
        ];
        setRatingOptions(fallbackOptions);
      }
    } catch (error) {
      console.error('❌ [KPIReview] Error fetching rating options:', error);
      // Fallback to default options if API fails
      const fallbackOptions = [
        { rating_value: 1.00, label: 'Below Expectation' },
        { rating_value: 1.25, label: 'Meets Expectation' },
        { rating_value: 1.50, label: 'Exceeds Expectation' },
      ];
      console.log('🔄 [KPIReview] Using fallback rating options:', fallbackOptions);
      setRatingOptions(fallbackOptions);
    }
  };

  const fetchReview = async () => {
    try {
      const response = await api.get(`/kpi-review/${reviewId}`);
      const reviewData = response.data.review;
      
      // If review doesn't have an ID, it means it's a new review from KPI
      if (!reviewData.id && reviewData.kpi_id) {
        // This is KPI data formatted as review - review doesn't exist yet
        // Employee needs to submit self-rating first
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
          const initialRatings: { [key: number]: number } = {};
          const initialComments: { [key: number]: string } = {};
          kpiData.items.forEach((item: KPIItem) => {
            initialRatings[item.id] = 0;
            initialComments[item.id] = '';
          });
          setManagerRatings(initialRatings);
          setManagerComments(initialComments);
        }
        
        // Parse employee ratings/comments from JSON
        try {
          const employeeData = JSON.parse(reviewData.employee_comment || '{}');
          console.log('📋 [KPIReview] Parsed employee data:', employeeData);
          if (employeeData.items && Array.isArray(employeeData.items)) {
            const empRatings: { [key: number]: number } = {};
            const empComments: { [key: number]: string } = {};
            employeeData.items.forEach((item: any) => {
              if (item.item_id) {
                const ratingValue = parseFloat(String(item.rating || 0));
                console.log(`📊 [KPIReview] Item ${item.item_id} - Rating: ${item.rating}, Parsed: ${ratingValue}`);
                empRatings[item.item_id] = ratingValue;
                empComments[item.item_id] = String(item.comment || '');
              }
            });
            console.log('✅ [KPIReview] Employee ratings:', empRatings);
            console.log('✅ [KPIReview] Employee comments:', empComments);
            setEmployeeRatings(empRatings);
            setEmployeeComments(empComments);
          } else {
            console.warn('⚠️ [KPIReview] Employee data.items is not an array:', employeeData);
          }
        } catch (error) {
          console.error('❌ [KPIReview] Error parsing employee data:', error);
          // If not JSON, use single rating for all items (legacy)
          if (kpiData.items && kpiData.items.length > 0) {
            const empRatings: { [key: number]: number } = {};
            const empComments: { [key: number]: string } = {};
            const legacyRating = parseFloat(String(reviewData.employee_rating || 0));
            kpiData.items.forEach((item: KPIItem) => {
              empRatings[item.id] = legacyRating;
              empComments[item.id] = String(reviewData.employee_comment || '');
            });
            setEmployeeRatings(empRatings);
            setEmployeeComments(empComments);
          }
        }
        
        // Parse manager ratings/comments from JSON
        try {
          const managerData = JSON.parse(reviewData.manager_comment || '{}');
          if (managerData.items && Array.isArray(managerData.items)) {
            const mgrRatings: { [key: number]: number } = {};
            const mgrComments: { [key: number]: string } = {};
            managerData.items.forEach((item: any) => {
              if (item.item_id) {
                mgrRatings[item.item_id] = item.rating || 0;
                mgrComments[item.item_id] = item.comment || '';
              }
            });
            setManagerRatings(mgrRatings);
            setManagerComments(mgrComments);
          }
        } catch {
          // If not JSON, use single rating for all items (legacy)
          if (kpiData.items && kpiData.items.length > 0) {
            const mgrRatings: { [key: number]: number } = {};
            const mgrComments: { [key: number]: string } = {};
            kpiData.items.forEach((item: KPIItem) => {
              mgrRatings[item.id] = reviewData.manager_rating || 0;
              mgrComments[item.id] = reviewData.manager_comment || '';
            });
            setManagerRatings(mgrRatings);
            setManagerComments(mgrComments);
          }
        }
      } catch (error) {
        console.error('Error fetching KPI:', error);
      }
      
      setOverallComment(reviewData.overall_manager_comment || '');
      // DO NOT pre-fill signature from KPI setting - manager review needs separate signature
      // Only set signature if it's from a previous review submission
      // For new review, signature should be empty
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
    const draftKey = `kpi-review-draft-${reviewId}`;
    const draftData = {
      managerRatings,
      managerComments,
      overallComment,
      managerSignature,
      reviewDate: reviewDate?.toISOString(),
      majorAccomplishmentsManagerComment,
      disappointmentsManagerComment,
    };
    localStorage.setItem(draftKey, JSON.stringify(draftData));
    alert('Draft saved successfully! Your progress has been saved.');
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
      alert('No KPI items found');
      return;
    }

    // Validate all KPI items are rated (quantitative items only)
    const allRated = kpi.items.every((item) => {
      // Skip validation for qualitative items
      if (item.is_qualitative) {
        const qualRating = qualitativeRatings[item.id];
        return qualRating && (qualRating === 'exceeds' || qualRating === 'meets' || qualRating === 'needs_improvement');
      }
      // Validate quantitative items
      const rating = managerRatings[item.id];
      return rating !== undefined && rating !== null && (rating === 0.00 || rating === 1.00 || rating === 1.25 || rating === 1.50);
    });

    if (!allRated) {
      alert('Please provide a rating for all KPI items (1.00, 1.25, or 1.50 for quantitative; Exceeds/Meets/Needs Improvement for qualitative)');
      return;
    }

    if (!managerSignature) {
      alert('Please provide your digital signature');
      return;
    }

    // Calculate average rating
    const itemRatings = kpi.items.map((item) => managerRatings[item.id] || 0);
    const averageRating = itemRatings.reduce((sum, rating) => sum + rating, 0) / itemRatings.length;

    // Round average to nearest allowed rating value (1.00, 1.25, or 1.50)
    // This ensures the value matches the database constraint
    const allowedRatings = [1.00, 1.25, 1.50];
    const roundedRating = allowedRatings.reduce((prev, curr) => 
      Math.abs(curr - averageRating) < Math.abs(prev - averageRating) ? curr : prev
    );

    // Store item-level data as JSON in comment field
    const itemData = {
      items: kpi.items.map((item) => ({
        item_id: item.id,
        rating: managerRatings[item.id] || 0,
        comment: managerComments[item.id] || '',
      })),
      average_rating: averageRating,
      rounded_rating: roundedRating,
    };

    setSaving(true);
    try {
      // Prepare qualitative ratings array for backend
      const qualitativeRatingsArray = kpi.items
        .filter(item => item.is_qualitative)
        .map(item => ({
          item_id: item.id,
          rating: qualitativeRatings[item.id] || '',
          comment: qualitativeComments[item.id] || ''
        }));

      await api.post(`/kpi-review/${reviewId}/manager-review`, {
        manager_rating: roundedRating, // Use rounded value that matches constraint (1.00, 1.25, or 1.50)
        manager_comment: JSON.stringify(itemData),
        overall_manager_comment: overallComment,
        manager_signature: managerSignature,
        qualitative_ratings: qualitativeRatingsArray,
        major_accomplishments_manager_comment: majorAccomplishmentsManagerComment,
        disappointments_manager_comment: disappointmentsManagerComment,
      });

      // Clear draft after successful submission
      if (reviewId) {
        const draftKey = `kpi-review-draft-${reviewId}`;
        localStorage.removeItem(draftKey);
      }

      navigate('/manager/reviews');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to submit review');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!review) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">Review not found.</p>
        </div>
      </div>
    );
  }

  // If review doesn't have an ID, employee hasn't submitted self-rating yet
  if (!review.id) {
    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">Waiting for Employee Self-Rating</h2>
          <p className="text-sm text-blue-800">
            The employee needs to complete their self-rating before you can review this KPI. 
            Once they submit their self-rating, you'll be able to provide your review and rating.
          </p>
        </div>
        <button
          onClick={() => navigate('/manager/reviews')}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          Back to Reviews
        </button>
      </div>
    );
  }

  // Rating options are now fetched from database
  const getRatingLabel = (rating: number): string => {
    if (rating === 1.00) return 'Below Expectation';
    if (rating === 1.25) return 'Meets Expectation';
    if (rating === 1.50) return 'Exceeds Expectation';
    return `${rating}`;
  };

  // Calculate average ratings
  const calculateEmployeeAverage = () => {
    if (!kpi?.items || kpi.items.length === 0) return 0;
    const itemRatings = kpi.items.map((item) => employeeRatings[item.id] || 0).filter(r => r > 0);
    if (itemRatings.length === 0) return 0;
    return itemRatings.reduce((sum, rating) => sum + rating, 0) / itemRatings.length;
  };

  const calculateManagerAverage = () => {
    if (!kpi?.items || kpi.items.length === 0) return 0;
    const itemRatings = kpi.items.map((item) => managerRatings[item.id] || 0).filter(r => r > 0);
    if (itemRatings.length === 0) return 0;
    return itemRatings.reduce((sum, rating) => sum + rating, 0) / itemRatings.length;
  };

  const employeeAvg = calculateEmployeeAverage();
  const managerAvg = calculateManagerAverage();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <FiArrowLeft className="text-xl" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manager KPI Review & Rating</h1>
            <p className="text-sm text-gray-600 mt-1">
              {review.review_quarter} {review.review_year} Quarterly Performance Review
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            In Progress
          </span>
          <span className="text-sm text-gray-600">
            Due: {kpi?.meeting_date ? new Date(kpi.meeting_date).toLocaleDateString() : 'N/A'}
          </span>
        </div>
      </div>

      {/* Employee Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Employee Information</h2>
        </div>
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
            <span className="text-2xl font-semibold text-purple-600">
              {review.employee_name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 flex-1">
            <div>
              <p className="text-sm text-gray-600">EMPLOYEE NAME</p>
              <p className="font-semibold text-gray-900">{review.employee_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">POSITION</p>
              <p className="font-semibold text-gray-900">{review.employee_position}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">PAYROLL NUMBER</p>
              <p className="font-semibold text-gray-900">{review.employee_payroll}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">DEPARTMENT</p>
              <p className="font-semibold text-gray-900">{review.employee_department}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">KPI PERIOD</p>
              <p className="font-semibold text-purple-600">
                {review.review_quarter} {review.review_year} - Quarterly
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">REVIEW STATUS</p>
              <p className="font-semibold text-orange-600">Pending Manager Review</p>
            </div>
          </div>
        </div>
      </div>

      {/* Review Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-white text-xs font-bold">i</span>
          </div>
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">Review Instructions</h3>
            <p className="text-sm text-blue-800">
              Review the employee's self-ratings carefully, enter your ratings and detailed comments for each KPI, then sign and submit for HR review. Your ratings should be based on observed performance, achievement of targets, and overall contribution during the quarterly period.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Review Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">KPI Review & Rating Table</h2>
              <p className="text-sm text-gray-600 mt-1">
                {review.review_quarter} {review.review_year} {review.review_period === 'quarterly' ? 'Quarterly' : 'Yearly'} Performance Evaluation
              </p>
            </div>
            <div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 mr-3">
                KPI Period: {review.review_period === 'quarterly' ? 'Quarterly' : 'Yearly'}
              </span>
              <span className="text-sm text-gray-600">Total KPIs: {kpi?.items?.length || kpi?.item_count || 1}</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: '1800px' }}>
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap" style={{ minWidth: '200px' }}>KPI TITLE</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap" style={{ minWidth: '250px' }}>KPI DESCRIPTION</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap" style={{ minWidth: '180px' }}>CURRENT PERFORMANCE STATUS</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap" style={{ minWidth: '150px' }}>TARGET VALUE</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap" style={{ minWidth: '120px' }}>MEASURE UNIT</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap" style={{ minWidth: '150px' }}>EXPECTED COMPLETION DATE</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap" style={{ minWidth: '120px' }}>GOAL WEIGHT</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap" style={{ minWidth: '150px' }}>EMPLOYEE SELF RATING</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap" style={{ minWidth: '200px' }}>EMPLOYEE COMMENT</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap" style={{ minWidth: '200px' }}>MANAGER RATING</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap" style={{ minWidth: '200px' }}>MANAGER COMMENT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {kpi?.items && kpi.items.length > 0 ? (
                kpi.items.map((item, index) => {
                  const empRating = employeeRatings[item.id] || 0;
                  const empComment = employeeComments[item.id] || '';
                  const mgrRating = managerRatings[item.id] || 0;
                  const mgrComment = managerComments[item.id] || '';
                  return (
                    <tr key={item.id}>
                      <td className="px-6 py-4">
                        <div>
                          <button
                            onClick={() => setTextModal({ isOpen: true, title: 'KPI Title', value: item.title || 'N/A' })}
                            className="text-left font-semibold text-gray-900 hover:text-purple-600 transition-colors"
                          >
                            <p className="truncate max-w-[200px]" title={item.title}>{item.title}</p>
                          </button>
                          <p className="text-xs text-gray-500">KPI-{review.review_quarter}-{String(index + 1).padStart(3, '0')}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setTextModal({ isOpen: true, title: 'KPI Description', value: item.description || 'N/A' })}
                          className="text-left text-sm text-gray-700 hover:text-purple-600 transition-colors"
                        >
                          <p className="truncate max-w-[250px]" title={item.description || 'N/A'}>{item.description || 'N/A'}</p>
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setTextModal({ isOpen: true, title: 'Current Performance Status', value: item.current_performance_status || 'N/A' })}
                          className="text-left text-sm text-gray-900 hover:text-purple-600 transition-colors"
                        >
                          <p className="truncate max-w-[180px]" title={item.current_performance_status || 'N/A'}>{item.current_performance_status || 'N/A'}</p>
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setTextModal({ isOpen: true, title: 'Target Value', value: item.target_value || 'N/A' })}
                          className="text-left font-semibold text-gray-900 hover:text-purple-600 transition-colors"
                        >
                          <p className="truncate max-w-[150px]" title={item.target_value || 'N/A'}>
                            {item.is_qualitative ? <span className="text-purple-600 font-medium">Qualitative</span> : (item.target_value || 'N/A')}
                          </p>
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-sm whitespace-nowrap ${item.is_qualitative ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                          {item.is_qualitative ? 'Qualitative' : (item.measure_unit || 'N/A')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-700 whitespace-nowrap">
                          {item.expected_completion_date 
                            ? new Date(item.expected_completion_date).toLocaleDateString() 
                            : 'N/A'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-700 whitespace-nowrap">{item.goal_weight || item.measure_criteria || 'N/A'}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.is_qualitative ? (
                          <span className="text-sm text-purple-600 font-medium">N/A (Qualitative)</span>
                        ) : empRating > 0 ? (
                          <div>
                            <span className="text-sm font-semibold text-gray-900">
                              {(() => {
                                const ratingValue = parseFloat(String(empRating));
                                if (Math.abs(ratingValue - 1.00) < 0.01) return '1.00';
                                if (Math.abs(ratingValue - 1.25) < 0.01) return '1.25';
                                if (Math.abs(ratingValue - 1.50) < 0.01) return '1.50';
                                return parseFloat(String(empRating)).toFixed(2);
                              })()}
                            </span>
                            <span className="text-xs text-gray-500 ml-1 block">
                              ({getRatingLabel(empRating)})
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Not rated</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {empComment && empComment !== 'N/A' ? (
                          <button
                            onClick={() => setTextModal({ isOpen: true, title: 'Employee Comment', value: empComment })}
                            className="text-left text-sm text-gray-700 hover:text-purple-600 transition-colors"
                          >
                            <p className="truncate max-w-[200px]" title={empComment}>
                              {empComment.length > 50 ? empComment.substring(0, 50) + '...' : empComment}
                            </p>
                          </button>
                        ) : (
                          <p className="text-sm text-gray-400">N/A</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {item.is_qualitative ? (
                          <div>
                            <select
                              value={qualitativeRatings[item.id] || ''}
                              onChange={(e) => {
                                setQualitativeRatings(prev => ({ ...prev, [item.id]: e.target.value }));
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            >
                              <option value="">Select rating</option>
                              <option value="exceeds">⭐ Exceeds Expectations</option>
                              <option value="meets">✓ Meets Expectations</option>
                              <option value="needs_improvement">⚠ Needs Improvement</option>
                            </select>
                          </div>
                        ) : (
                          <div>
                            <select
                              value={mgrRating || 0}
                              onChange={(e) => {
                                const selectedValue = parseFloat(e.target.value);
                                console.log('🔄 [KPIReview] Select changed - Raw value:', e.target.value, 'Parsed:', selectedValue, 'Item ID:', item.id);
                                handleRatingChange(item.id, selectedValue);
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            >
                              <option value={0}>Select rating</option>
                              {ratingOptions.map((opt) => {
                                const optValue = parseFloat(String(opt.rating_value));
                                return (
                                  <option key={opt.rating_value} value={optValue}>
                                    {opt.rating_value} - {opt.label}
                                  </option>
                                );
                              })}
                            </select>
                            {mgrRating > 0 && (
                              <div className="mt-1">
                                <span className="text-xs text-gray-500">
                                  {(() => {
                                    const ratingValue = parseFloat(String(mgrRating));
                                    if (Math.abs(ratingValue - 1.00) < 0.01) return 'Below Expectation';
                                    if (Math.abs(ratingValue - 1.25) < 0.01) return 'Meets Expectation';
                                    if (Math.abs(ratingValue - 1.50) < 0.01) return 'Exceeds Expectation';
                                    return '';
                                  })()}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start space-x-2">
                          <textarea
                            value={item.is_qualitative ? (qualitativeComments[item.id] || '') : mgrComment}
                            onChange={(e) => {
                              if (item.is_qualitative) {
                                setQualitativeComments(prev => ({ ...prev, [item.id]: e.target.value }));
                              } else {
                                handleCommentChange(item.id, e.target.value);
                              }
                            }}
                            placeholder={item.is_qualitative ? "Enter qualitative assessment..." : "Enter your comment..."}
                            rows={2}
                            className="flex-1 min-w-[150px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                          />
                          {((item.is_qualitative && qualitativeComments[item.id] && qualitativeComments[item.id].length > 30) || 
                            (!item.is_qualitative && mgrComment && mgrComment.length > 30)) && (
                            <button
                              onClick={() => setTextModal({ 
                                isOpen: true, 
                                title: item.is_qualitative ? 'Qualitative Assessment' : 'Manager Comment', 
                                value: item.is_qualitative ? qualitativeComments[item.id] : mgrComment,
                                field: item.is_qualitative ? 'qualitative_comment' : 'manager_comment',
                                itemId: item.id,
                                onChange: (value) => {
                                  if (item.is_qualitative) {
                                    setQualitativeComments(prev => ({ ...prev, [item.id]: value }));
                                  } else {
                                    handleCommentChange(item.id, value);
                                  }
                                }
                              })}
                              className="px-2 py-1 text-xs text-purple-600 hover:text-purple-700 border border-purple-300 rounded"
                              title="View/Edit full comment"
                            >
                              <FiExternalLink />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                // Fallback for legacy single KPI format
                <tr>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-gray-900">{review.kpi_title}</p>
                      <p className="text-xs text-gray-500">KPI-CS-001</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-700">{review.kpi_description || 'N/A'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900">N/A</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-900">{review.target_value || 'N/A'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-700">N/A</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-1 rounded bg-blue-100 text-blue-700 text-sm whitespace-nowrap">
                      {review.measure_unit || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-700">N/A</p>
                  </td>
                  <td className="px-6 py-4">
                    {review.employee_rating ? (
                      <div>
                        <span className="text-sm font-semibold text-gray-900">
                          {review.employee_rating === 1.00 ? '1.00' : review.employee_rating === 1.25 ? '1.25' : review.employee_rating === 1.50 ? '1.50' : review.employee_rating}
                        </span>
                        <span className="text-xs text-gray-500 ml-1 block">
                          ({getRatingLabel(parseFloat(String(review.employee_rating)))})
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">Not rated</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-700 break-words max-w-xs">{review.employee_comment || 'N/A'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={managerRatings[0] || 0}
                      onChange={(e) => {
                        const selectedValue = parseFloat(e.target.value);
                        console.log('🔄 [KPIReview] Legacy select changed - Raw value:', e.target.value, 'Parsed:', selectedValue);
                        handleRatingChange(0, selectedValue);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value={0}>Select rating</option>
                      {ratingOptions.map((opt) => {
                        const optValue = parseFloat(String(opt.rating_value));
                        return (
                          <option key={opt.rating_value} value={optValue}>
                            {opt.rating_value} - {opt.label}
                          </option>
                        );
                      })}
                    </select>
                    {managerRatings[0] > 0 && (
                      <div className="mt-1">
                        <span className="text-xs text-gray-500">
                          {(() => {
                            const ratingValue = parseFloat(String(managerRatings[0]));
                            if (Math.abs(ratingValue - 1.00) < 0.01) return 'Below Expectation';
                            if (Math.abs(ratingValue - 1.25) < 0.01) return 'Meets Expectation';
                            if (Math.abs(ratingValue - 1.50) < 0.01) return 'Exceeds Expectation';
                            return '';
                          })()}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <textarea
                      value={managerComments[0] || ''}
                      onChange={(e) => handleCommentChange(0, e.target.value)}
                      placeholder="Enter your comment..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Average Employee Rating</p>
            <div>
              <span className="text-2xl font-bold text-gray-900">
                {employeeAvg > 0 ? parseFloat(String(employeeAvg)).toFixed(2) : '0.00'}
              </span>
              {employeeAvg > 0 && (
                <span className="text-xs text-gray-500 ml-2">
                  ({getRatingLabel(employeeAvg)})
                </span>
              )}
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Average Manager Rating</p>
            <div>
              <span className="text-2xl font-bold text-gray-900">
                {managerAvg > 0 ? parseFloat(String(managerAvg)).toFixed(2) : '0.00'}
              </span>
              {managerAvg > 0 && (
                <span className="text-xs text-gray-500 ml-2">
                  ({getRatingLabel(managerAvg)})
                </span>
              )}
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">KPIs Reviewed</p>
            <p className="text-2xl font-bold text-gray-900">
              {kpi?.items ? kpi.items.filter(item => managerRatings[item.id] > 0).length : 0} / {kpi?.items?.length || kpi?.item_count || 1}
            </p>
            <p className={`text-xs mt-1 ${kpi?.items && kpi.items.filter(item => managerRatings[item.id] > 0).length === kpi.items.length ? 'text-green-600' : 'text-orange-600'}`}>
              {kpi?.items && kpi.items.filter(item => managerRatings[item.id] > 0).length === kpi.items.length ? 'Complete' : 'In Progress'}
            </p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Overall Performance</p>
            <p className="text-2xl font-bold text-gray-900">Good</p>
            <p className="text-xs text-yellow-600 mt-1">Above Target</p>
          </div>
        </div>
      </div>

      {/* Employee Accomplishments & Disappointments */}
      {review && (review.major_accomplishments || review.disappointments) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Employee Performance Reflection</h2>
          <p className="text-sm text-gray-600 mb-6">
            Review the employee's self-reported accomplishments and challenges, and provide your feedback.
          </p>

          <div className="space-y-6">
            {/* Major Accomplishments */}
            {review.major_accomplishments && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Employee's Major Accomplishments</h3>
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{review.major_accomplishments}</p>
                </div>
                
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Manager's Comments on Accomplishments</h3>
                <textarea
                  value={majorAccomplishmentsManagerComment}
                  onChange={(e) => setMajorAccomplishmentsManagerComment(e.target.value)}
                  placeholder="Provide your feedback on the employee's accomplishments. Acknowledge their achievements and provide additional context if needed..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            )}

            {/* Disappointments / Challenges */}
            {review.disappointments && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Employee's Challenges & Disappointments</h3>
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{review.disappointments}</p>
                </div>
                
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Manager's Comments on Challenges</h3>
                <textarea
                  value={disappointmentsManagerComment}
                  onChange={(e) => setDisappointmentsManagerComment(e.target.value)}
                  placeholder="Acknowledge the challenges faced and provide guidance, support, or context. Discuss how to overcome these obstacles..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Overall Manager Comments */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Overall Manager Comments</h2>
        <textarea
          value={overallComment}
          onChange={(e) => setOverallComment(e.target.value)}
          placeholder="Provide overall feedback on employee performance..."
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* Manager Confirmation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Manager Confirmation</h2>
        <p className="text-sm text-gray-600 mb-4">Digital signature and review date required</p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <span className="text-blue-600 text-xl">i</span>
            <p className="text-sm text-blue-800">
              By signing below, I confirm that the ratings and comments provided accurately reflect my evaluation of the employee's performance during the quarterly review period. I have reviewed all KPIs objectively and provided constructive feedback.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <SignatureField
              label="Digital Signature *"
              value={managerSignature}
              onChange={setManagerSignature}
              required
              placeholder="Click and drag to sign"
            />
            <p className="text-sm text-gray-600 mt-2">
              Or type your full name: <input
                type="text"
                className="border-b border-gray-300 focus:border-purple-500 outline-none"
                placeholder="Type your full name"
              />
            </p>
          </div>

          <div className="space-y-4">
            <DatePicker
              label="Review Date *"
              value={reviewDate || undefined}
              onChange={setReviewDate}
              required
            />
            <div>
              <p className="text-sm text-gray-600 mb-1">Manager Name</p>
              <p className="font-semibold text-gray-900">Michael Anderson</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Position</p>
              <p className="font-semibold text-gray-900">Department Manager</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Employee ID</p>
              <p className="font-semibold text-gray-900">MGR-2024-0089</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Department</p>
              <p className="font-semibold text-gray-900">Customer Success</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-gray-900"
        >
          <FiArrowLeft className="text-lg" />
          <span>Cancel</span>
        </button>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleSaveDraft}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <FiSave className="text-lg" />
            <span>Save as Draft</span>
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            <FiSend className="text-lg" />
            <span>Submit Final Review</span>
          </button>
        </div>
      </div>

      {/* Text Modal */}
      <TextModal
        isOpen={textModal.isOpen}
        onClose={() => {
          if (textModal.onChange && textModal.itemId !== undefined) {
            textModal.onChange(textModal.value);
          }
          setTextModal({ isOpen: false, title: '', value: '' });
        }}
        title={textModal.title}
        value={textModal.value}
        onChange={textModal.onChange}
        readOnly={!textModal.onChange}
      />
    </div>
  );
};

export default ManagerKPIReview;

