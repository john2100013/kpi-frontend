import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { KPI } from '../../types';
import SignatureField from '../../components/SignatureField';
import DatePicker from '../../components/DatePicker';
import TextModal from '../../components/TextModal';
import { FiArrowLeft, FiSave, FiSend, FiExternalLink } from 'react-icons/fi';

const SelfRating: React.FC = () => {
  const { kpiId } = useParams<{ kpiId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [kpi, setKpi] = useState<KPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ratings, setRatings] = useState<{ [key: number]: number }>({});
  const [comments, setComments] = useState<{ [key: number]: string }>({});
  const [employeeSignature, setEmployeeSignature] = useState('');
  const [reviewDate, setReviewDate] = useState<Date | null>(new Date());
  const [ratingOptions, setRatingOptions] = useState<Array<{ rating_value: number; label: string; description?: string }>>([]);
  const [textModal, setTextModal] = useState<{ isOpen: boolean; title: string; value: string; field?: string; itemId?: number; onChange?: (value: string) => void }>({
    isOpen: false,
    title: '',
    value: '',
  });

  useEffect(() => {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔄 [SelfRating] ===== COMPONENT MOUNTED/UPDATED =====');
    console.log('🔄 [SelfRating] kpiId:', kpiId);
    console.log('🔄 [SelfRating] Current ratingOptions state:', ratingOptions);
    console.log('🔄 [SelfRating] Current ratingOptions length:', ratingOptions.length);
    console.log('🔄 [SelfRating] User:', user);
    if (kpiId) {
      console.log('🔄 [SelfRating] Calling fetchKPI and loadDraft');
      fetchKPI();
      loadDraft();
    }
    console.log('🔄 [SelfRating] Calling fetchRatingOptions NOW...');
    fetchRatingOptions();
    console.log('🔄 [SelfRating] fetchRatingOptions called');
    console.log('═══════════════════════════════════════════════════════════');
  }, [kpiId]);
  
  // Debug: Log when ratingOptions changes
  useEffect(() => {
    console.log('🔄 [SelfRating] ratingOptions state changed:', ratingOptions);
    console.log('🔄 [SelfRating] ratingOptions length:', ratingOptions.length);
  }, [ratingOptions]);

  // Save draft to localStorage whenever form data changes
  useEffect(() => {
    if (kpiId) {
      const draftKey = `self-rating-draft-${kpiId}`;
      const draftData = {
        ratings,
        comments,
        employeeSignature,
        reviewDate: reviewDate?.toISOString(),
      };
      localStorage.setItem(draftKey, JSON.stringify(draftData));
    }
  }, [ratings, comments, employeeSignature, reviewDate, kpiId]);

  const loadDraft = () => {
    if (!kpiId) return;
    // Load draft after a short delay to allow API data to load first
    setTimeout(() => {
      try {
        const draftKey = `self-rating-draft-${kpiId}`;
        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft) {
          const draftData = JSON.parse(savedDraft);
          // Only load draft if there's no existing rating data (indicating it's a new review)
          if (Object.keys(ratings).length === 0 && draftData.ratings) {
            setRatings(draftData.ratings);
          }
          if (Object.keys(comments).length === 0 && draftData.comments) {
            setComments(draftData.comments);
          }
          if (!employeeSignature && draftData.employeeSignature) {
            setEmployeeSignature(draftData.employeeSignature);
          }
          if (!reviewDate && draftData.reviewDate) {
            setReviewDate(new Date(draftData.reviewDate));
          }
        }
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    }, 500);
  };

  const fetchRatingOptions = async () => {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔍 [SelfRating] ===== fetchRatingOptions CALLED =====');
    console.log('🔍 [SelfRating] Current user:', JSON.stringify(user, null, 2));
    console.log('🔍 [SelfRating] API baseURL:', api.defaults.baseURL);
    console.log('🔍 [SelfRating] Full API URL will be:', api.defaults.baseURL + '/rating-options');
    console.log('🔍 [SelfRating] Token exists?', !!localStorage.getItem('token'));
    
    try {
      console.log('🔍 [SelfRating] About to make API call...');
      const response = await api.get('/rating-options');
      console.log('✅ [SelfRating] API call SUCCESSFUL');
      
      console.log('✅ [SelfRating] Full response object:', response);
      console.log('✅ [SelfRating] Response status:', response.status);
      console.log('✅ [SelfRating] Response statusText:', response.statusText);
      console.log('✅ [SelfRating] Response headers:', response.headers);
      console.log('✅ [SelfRating] Response data:', JSON.stringify(response.data, null, 2));
      console.log('✅ [SelfRating] Response data type:', typeof response.data);
      console.log('✅ [SelfRating] response.data.rating_options:', response.data?.rating_options);
      console.log('✅ [SelfRating] rating_options type:', typeof response.data?.rating_options);
      console.log('✅ [SelfRating] rating_options is array?', Array.isArray(response.data?.rating_options));
      console.log('✅ [SelfRating] rating_options length:', response.data?.rating_options?.length);
      
      const options = response.data?.rating_options || [];
      console.log('📋 [SelfRating] Extracted options:', JSON.stringify(options, null, 2));
      console.log('📋 [SelfRating] Options is array?', Array.isArray(options));
      console.log('📋 [SelfRating] Options length:', options.length);
      
      if (options.length > 0) {
        console.log('📋 [SelfRating] First option:', JSON.stringify(options[0], null, 2));
        console.log('📋 [SelfRating] First option rating_value:', options[0].rating_value);
        console.log('📋 [SelfRating] First option rating_value type:', typeof options[0].rating_value);
      } else {
        console.warn('⚠️ [SelfRating] OPTIONS ARRAY IS EMPTY!');
        console.warn('⚠️ [SelfRating] response.data:', JSON.stringify(response.data, null, 2));
      }
      
      console.log('📋 [SelfRating] About to set ratingOptions state with:', options.length, 'items');
      setRatingOptions(options);
      console.log('📋 [SelfRating] Rating options state set, count:', options.length);
      console.log('═══════════════════════════════════════════════════════════');
    } catch (error: any) {
      console.error('═══════════════════════════════════════════════════════════');
      console.error('❌ [SelfRating] ===== ERROR IN fetchRatingOptions =====');
      console.error('❌ [SelfRating] Error object:', error);
      console.error('❌ [SelfRating] Error message:', error.message);
      console.error('❌ [SelfRating] Error name:', error.name);
      console.error('❌ [SelfRating] Error response:', error.response);
      if (error.response) {
        console.error('❌ [SelfRating] Error response status:', error.response.status);
        console.error('❌ [SelfRating] Error response data:', JSON.stringify(error.response.data, null, 2));
        console.error('❌ [SelfRating] Error response headers:', error.response.headers);
      }
      console.error('❌ [SelfRating] Error config:', error.config);
      console.error('❌ [SelfRating] Error stack:', error.stack);
      console.error('═══════════════════════════════════════════════════════════');
    }
  };

  const fetchKPI = async () => {
    try {
      const response = await api.get(`/kpis/${kpiId}`);
      const kpiData = response.data.kpi;
      setKpi(kpiData);
      
      // Initialize ratings and comments for all items
      if (kpiData.items && kpiData.items.length > 0) {
        const initialRatings: { [key: number]: number } = {};
        const initialComments: { [key: number]: string } = {};
        kpiData.items.forEach((item: any) => {
          initialRatings[item.id] = 0;
          initialComments[item.id] = '';
        });
        setRatings(initialRatings);
        setComments(initialComments);
      }
      
      // Try to fetch existing review
      try {
        const reviewRes = await api.get(`/kpi-review?kpi_id=${kpiId}`);
        if (reviewRes.data.reviews && reviewRes.data.reviews.length > 0) {
          const existingReview = reviewRes.data.reviews[0];
          
          // Try to parse item-level ratings/comments from comment field (if stored as JSON)
          try {
            const itemData = JSON.parse(existingReview.employee_comment || '{}');
            if (itemData.items && Array.isArray(itemData.items)) {
              const parsedRatings: { [key: number]: number } = {};
              const parsedComments: { [key: number]: string } = {};
              itemData.items.forEach((item: any) => {
                if (item.item_id) {
                  parsedRatings[item.item_id] = item.rating || 0;
                  parsedComments[item.item_id] = item.comment || '';
                }
              });
              setRatings(parsedRatings);
              setComments(parsedComments);
            } else {
              // Legacy: single rating/comment - apply to all items
              if (kpiData.items && kpiData.items.length > 0) {
                const legacyRatings: { [key: number]: number } = {};
                const legacyComments: { [key: number]: string } = {};
                kpiData.items.forEach((item: any) => {
                  legacyRatings[item.id] = existingReview.employee_rating || 0;
                  legacyComments[item.id] = existingReview.employee_comment || '';
                });
                setRatings(legacyRatings);
                setComments(legacyComments);
              }
            }
          } catch {
            // If not JSON, use single rating for all items (legacy)
            if (kpiData.items && kpiData.items.length > 0) {
              const legacyRatings: { [key: number]: number } = {};
              const legacyComments: { [key: number]: string } = {};
              kpiData.items.forEach((item: any) => {
                legacyRatings[item.id] = existingReview.employee_rating || 0;
                legacyComments[item.id] = existingReview.employee_comment || '';
              });
          setRatings(legacyRatings);
          setComments(legacyComments);
        }
      }
      
      // DO NOT pre-fill signature from acknowledgement - self-rating needs separate signature
      // Only set signature if it's from a previous self-rating submission (which shouldn't happen, but handle it)
      // For new self-rating, signature should be empty
      setEmployeeSignature('');
        }
      } catch (error) {
        // No existing review
      }
    } catch (error) {
      console.error('Error fetching KPI:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = (itemId: number, value: number) => {
    console.log('📝 [SelfRating] Rating changed for item:', itemId, 'New value:', value, 'Type:', typeof value);
    const newRatings = { ...ratings, [itemId]: value };
    console.log('📊 [SelfRating] Updated ratings state:', newRatings);
    setRatings(newRatings);
  };

  const handleCommentChange = (itemId: number, value: string) => {
    setComments({ ...comments, [itemId]: value });
  };

  const handleSaveDraft = () => {
    if (!kpiId) return;
    const draftKey = `self-rating-draft-${kpiId}`;
    const draftData = {
      ratings,
      comments,
      employeeSignature,
      reviewDate: reviewDate?.toISOString(),
    };
    localStorage.setItem(draftKey, JSON.stringify(draftData));
    alert('Draft saved successfully! Your progress has been saved.');
  };

  const handleSubmit = async () => {
    // Validate all items have ratings
    if (!kpi?.items || kpi.items.length === 0) {
      alert('No KPI items found');
      return;
    }

    const allRated = kpi.items.every((item) => {
      const rating = ratings[item.id];
      return rating && (rating === 1.00 || rating === 1.25 || rating === 1.50);
    });

    if (!allRated) {
      alert('Please provide a rating (1.00, 1.25, or 1.50) for all KPI items');
      return;
    }

    if (!employeeSignature) {
      alert('Please provide your digital signature');
      return;
    }

    // Calculate average rating
    const itemRatings = kpi.items.map((item) => ratings[item.id] || 0);
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
        rating: ratings[item.id] || 0,
        comment: comments[item.id] || '',
      })),
      average_rating: averageRating,
      rounded_rating: roundedRating,
    };

    setSaving(true);
    try {
      await api.post(`/kpi-review/${kpiId}/self-rating`, {
        employee_rating: roundedRating, // Use rounded value that matches constraint (1.00, 1.25, or 1.50)
        employee_comment: JSON.stringify(itemData),
        employee_signature: employeeSignature,
        review_period: kpi?.period || 'quarterly',
        review_quarter: kpi?.quarter,
        review_year: kpi?.year,
      });

      // Clear draft after successful submission
      if (kpiId) {
        const draftKey = `self-rating-draft-${kpiId}`;
        localStorage.removeItem(draftKey);
      }

      navigate('/employee/kpi-list');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to submit self-rating');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !kpi) {
    return <div className="p-6">Loading...</div>;
  }

  // Rating options are now fetched from database

  // Calculate average rating and completion
  const calculateAverageRating = () => {
    if (!kpi?.items || kpi.items.length === 0) return 0;
    const itemRatings = kpi.items.map((item) => ratings[item.id] || 0).filter(r => r > 0);
    if (itemRatings.length === 0) return 0;
    return itemRatings.reduce((sum, rating) => sum + rating, 0) / itemRatings.length;
  };

  const calculateCompletion = () => {
    if (!kpi?.items || kpi.items.length === 0) return 0;
    const ratedCount = kpi.items.filter((item) => {
      const rating = ratings[item.id];
      return rating && (rating === 1.00 || rating === 1.25 || rating === 1.50);
    }).length;
    return Math.round((ratedCount / kpi.items.length) * 100);
  };

  const averageRating = calculateAverageRating();
  const completion = calculateCompletion();

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
            <h1 className="text-2xl font-bold text-gray-900">
              {kpi.period === 'quarterly' ? 'Quarterly' : 'Yearly'} KPI Self-Rating
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {kpi.quarter} {kpi.year} • {kpi.period === 'quarterly' ? 'Jan - Mar' : 'Jan - Dec'} {kpi.year} • Due: March 31, {kpi.year}
            </p>
          </div>
        </div>
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
            <span>Submit Self-Rating</span>
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-blue-900 mb-3">Self-Rating Instructions</h3>
        <ul className="space-y-2 text-sm text-blue-800 list-disc list-inside">
          <li>Please rate your performance against each KPI using the rating scale: 1.00 (Below Expectation), 1.25 (Meets Expectation), or 1.50 (Exceeds Expectation)</li>
          <li>Provide honest and accurate self-assessments based on your actual achievements during this quarter</li>
          <li>Add comments to explain your rating, highlight achievements, or note any challenges faced</li>
          <li>Your self-rating will be reviewed by your manager during the KPI review meeting</li>
        </ul>
      </div>

      {/* KPI Review Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 mr-3">
                KPI Period: {kpi.period === 'quarterly' ? 'Quarterly' : 'Yearly'}
              </span>
              <span className="text-sm text-gray-600">Total KPIs: {kpi.items?.length || kpi.item_count || 1}</span>
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
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap" style={{ minWidth: '150px' }}>SELF RATING *</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap" style={{ minWidth: '200px' }}>EMPLOYEE COMMENT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {kpi.items && kpi.items.length > 0 ? (
                kpi.items.map((item, index) => {
                  const itemRating = ratings[item.id] || 0;
                  const itemComment = comments[item.id] || '';
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
                          <p className="text-xs text-gray-500">KPI-{kpi.quarter}-{String(index + 1).padStart(3, '0')}</p>
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
                          <p className="truncate max-w-[150px]" title={item.target_value || 'N/A'}>{item.target_value || 'N/A'}</p>
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-1 rounded bg-blue-100 text-blue-700 text-sm whitespace-nowrap">
                          {item.measure_unit || 'N/A'}
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
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <select
                            value={itemRating || 0}
                            onChange={(e) => {
                              const selectedValue = parseFloat(e.target.value);
                              console.log('🔄 [SelfRating] Select changed - Raw value:', e.target.value, 'Parsed:', selectedValue);
                              if (!isNaN(selectedValue)) {
                                handleRatingChange(item.id, selectedValue);
                              }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                          >
                            <option value={0}>Select rating</option>
                            {(() => {
                              console.log('🔍 [SelfRating] Rendering select options, ratingOptions:', ratingOptions);
                              console.log('🔍 [SelfRating] ratingOptions.length:', ratingOptions.length);
                              if (ratingOptions.length > 0) {
                                return ratingOptions.map((opt, idx) => {
                                  const optValue = typeof opt.rating_value === 'number' 
                                    ? opt.rating_value 
                                    : parseFloat(String(opt.rating_value || '0'));
                                  console.log(`🔍 [SelfRating] Option ${idx}:`, { opt, optValue, type: typeof optValue });
                                  return (
                                    <option key={`${opt.rating_value}-${opt.label}-${idx}`} value={optValue}>
                                      {opt.rating_value} - {opt.label}
                                    </option>
                                  );
                                });
                              } else {
                                console.warn('⚠️ [SelfRating] No rating options available, showing empty select');
                                return null;
                              }
                            })()}
                          </select>
                          {itemRating > 0 && (
                            <div className="mt-1">
                              <span className="text-sm font-semibold text-gray-900">
                                {(() => {
                                  const ratingValue = parseFloat(String(itemRating));
                                  console.log('📊 [SelfRating] Displaying rating label for value:', ratingValue);
                                  if (Math.abs(ratingValue - 1.00) < 0.01) return 'Below Expectation';
                                  if (Math.abs(ratingValue - 1.25) < 0.01) return 'Meets Expectation';
                                  if (Math.abs(ratingValue - 1.50) < 0.01) return 'Exceeds Expectation';
                                  return `${itemRating}`;
                                })()}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start space-x-2">
                          <textarea
                            value={itemComment}
                            onChange={(e) => handleCommentChange(item.id, e.target.value)}
                            placeholder="Optional comment..."
                            rows={2}
                            className="flex-1 min-w-[150px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                          />
                          {itemComment && itemComment.length > 30 && (
                            <button
                              onClick={() => setTextModal({ 
                                isOpen: true, 
                                title: 'Employee Comment', 
                                value: itemComment,
                                field: 'comment',
                                itemId: item.id,
                                onChange: (value) => handleCommentChange(item.id, value)
                              })}
                              className="px-2 py-1 text-xs text-purple-600 hover:text-purple-700 border border-purple-300 rounded"
                              title="View/Edit full comment"
                            >
                              <FiExternalLink />
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Optional</p>
                      </td>
                    </tr>
                  );
                })
              ) : (
                // Fallback for legacy single KPI format
                <tr>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-gray-900">{kpi.title}</p>
                      <p className="text-xs text-gray-500">KPI-{kpi.quarter}-001</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-700">{kpi.description || 'N/A'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900">N/A</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-900">{kpi.target_value || 'N/A'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-700">N/A</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-1 rounded bg-blue-100 text-blue-700 text-sm">
                      {kpi.measure_unit || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-700">{kpi.measure_criteria || 'N/A'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      <select
                        value={ratings[0] || 0}
                        onChange={(e) => {
                          const selectedValue = parseFloat(e.target.value);
                          console.log('🔄 [SelfRating] Legacy select changed - Raw value:', e.target.value, 'Parsed:', selectedValue);
                          if (!isNaN(selectedValue)) {
                            handleRatingChange(0, selectedValue);
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      >
                        <option value={0}>Select rating</option>
                        {ratingOptions.length > 0 ? (
                          ratingOptions.map((opt) => {
                            const optValue = typeof opt.rating_value === 'number' 
                              ? opt.rating_value 
                              : parseFloat(String(opt.rating_value || '0'));
                            return (
                              <option key={`${opt.rating_value}-${opt.label}`} value={optValue}>
                                {opt.rating_value} - {opt.label}
                              </option>
                            );
                          })
                        ) : (
                          <>
                            <option value={1.00}>1.00 - Below Expectation</option>
                            <option value={1.25}>1.25 - Meets Expectation</option>
                            <option value={1.50}>1.50 - Exceeds Expectation</option>
                          </>
                        )}
                      </select>
                      {ratings[0] > 0 && (
                        <div className="mt-1">
                          <span className="text-sm font-semibold text-gray-900">
                            {(() => {
                              const ratingValue = parseFloat(String(ratings[0]));
                              if (Math.abs(ratingValue - 1.00) < 0.01) return 'Below Expectation';
                              if (Math.abs(ratingValue - 1.25) < 0.01) return 'Meets Expectation';
                              if (Math.abs(ratingValue - 1.50) < 0.01) return 'Exceeds Expectation';
                              return `${ratings[0]}`;
                            })()}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <textarea
                      value={comments[0] || ''}
                      onChange={(e) => handleCommentChange(0, e.target.value)}
                      placeholder="Optional comment..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Optional</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <p className="text-sm text-gray-600">Average Self-Rating:</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-sm font-semibold text-gray-900">
                    {averageRating > 0 ? `${averageRating.toFixed(2)}` : '0.00'}
                  </span>
                  {averageRating > 0 && (
                    <span className="text-xs text-gray-500">
                      {(() => {
                        const avg = parseFloat(String(averageRating));
                        if (Math.abs(avg - 1.00) < 0.01) return '(Below Expectation)';
                        if (Math.abs(avg - 1.25) < 0.01) return '(Meets Expectation)';
                        if (Math.abs(avg - 1.50) < 0.01) return '(Exceeds Expectation)';
                        return '';
                      })()}
                    </span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Completion:</p>
                <p className={`text-sm font-semibold mt-1 ${completion === 100 ? 'text-green-600' : 'text-orange-600'}`}>
                  {completion}%
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500">*All ratings are required before submission</p>
          </div>
        </div>
      </div>

      {/* Employee Confirmation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Employee Confirmation</h2>
        <p className="text-sm text-gray-600 mb-4">
          By signing below, I confirm that the self-ratings provided are accurate to the best of my knowledge.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <SignatureField
              label="Digital Signature *"
              value={employeeSignature}
              onChange={setEmployeeSignature}
              required
              placeholder="Click and drag to sign"
            />
            <button className="text-sm text-red-600 hover:text-red-700 mt-2">
              Clear Signature
            </button>
          </div>

          <div className="space-y-4">
            <DatePicker
              label="Self-Review Date *"
              value={reviewDate}
              onChange={setReviewDate}
              required
            />
            <div>
              <p className="text-sm text-gray-600 mb-1">Employee Name</p>
              <p className="font-semibold text-gray-900">{user?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Payroll Number</p>
              <p className="font-semibold text-gray-900">{user?.payroll_number || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Date & Time</p>
              <p className="font-semibold text-gray-900">
                {new Date().toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Important Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-white text-xs font-bold">!</span>
          </div>
          <div>
            <h3 className="font-semibold text-yellow-900 mb-2">Important Notice</h3>
            <p className="text-sm text-yellow-800">
              Once submitted, your self-rating will be sent to your manager for review. You will be notified when your manager schedules the KPI review meeting to discuss your performance.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/employee/dashboard')}
          className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-gray-900"
        >
          <FiArrowLeft className="text-lg" />
          <span>Back to Dashboard</span>
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
            <span>Submit Self-Rating</span>
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

export default SelfRating;

