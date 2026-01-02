import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { KPI, KPIReview, KPIItem } from '../../types';
import SignatureField from '../../components/SignatureField';
import DatePicker from '../../components/DatePicker';
import { FiArrowLeft, FiSave, FiSend, FiStar, FiExternalLink } from 'react-icons/fi';

const ManagerKPIReview: React.FC = () => {
  const { reviewId } = useParams<{ reviewId: string }>();
  const navigate = useNavigate();
  const [review, setReview] = useState<KPIReview | null>(null);
  const [kpi, setKpi] = useState<KPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [managerRatings, setManagerRatings] = useState<{ [key: number]: number }>({});
  const [managerComments, setManagerComments] = useState<{ [key: number]: string }>({});
  const [overallComment, setOverallComment] = useState('');
  const [managerSignature, setManagerSignature] = useState('');
  const [reviewDate, setReviewDate] = useState<Date | null>(new Date());
  const [employeeRatings, setEmployeeRatings] = useState<{ [key: number]: number }>({});
  const [employeeComments, setEmployeeComments] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    if (reviewId) {
      fetchReview();
    }
  }, [reviewId]);

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
          if (employeeData.items && Array.isArray(employeeData.items)) {
            const empRatings: { [key: number]: number } = {};
            const empComments: { [key: number]: string } = {};
            employeeData.items.forEach((item: any) => {
              if (item.item_id) {
                empRatings[item.item_id] = item.rating || 0;
                empComments[item.item_id] = item.comment || '';
              }
            });
            setEmployeeRatings(empRatings);
            setEmployeeComments(empComments);
          }
        } catch {
          // If not JSON, use single rating for all items (legacy)
          if (kpiData.items && kpiData.items.length > 0) {
            const empRatings: { [key: number]: number } = {};
            const empComments: { [key: number]: string } = {};
            kpiData.items.forEach((item: KPIItem) => {
              empRatings[item.id] = reviewData.employee_rating || 0;
              empComments[item.id] = reviewData.employee_comment || '';
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
      setManagerSignature(reviewData.manager_signature || '');
      if (reviewData.manager_signed_at) {
        setReviewDate(new Date(reviewData.manager_signed_at));
      }
    } catch (error) {
      console.error('Error fetching review:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    alert('Draft saved');
  };

  const handleRatingChange = (itemId: number, value: number) => {
    setManagerRatings({ ...managerRatings, [itemId]: value });
  };

  const handleCommentChange = (itemId: number, value: string) => {
    setManagerComments({ ...managerComments, [itemId]: value });
  };

  const handleSubmit = async () => {
    if (!kpi?.items || kpi.items.length === 0) {
      alert('No KPI items found');
      return;
    }

    // Validate all items have ratings
    const allRated = kpi.items.every((item) => {
      const rating = managerRatings[item.id];
      return rating && rating >= 1 && rating <= 5;
    });

    if (!allRated) {
      alert('Please provide a rating between 1 and 5 for all KPI items');
      return;
    }

    if (!managerSignature) {
      alert('Please provide your digital signature');
      return;
    }

    // Calculate average rating
    const itemRatings = kpi.items.map((item) => managerRatings[item.id] || 0);
    const averageRating = itemRatings.reduce((sum, rating) => sum + rating, 0) / itemRatings.length;

    // Store item-level data as JSON in comment field
    const itemData = {
      items: kpi.items.map((item) => ({
        item_id: item.id,
        rating: managerRatings[item.id] || 0,
        comment: managerComments[item.id] || '',
      })),
      average_rating: averageRating,
    };

    setSaving(true);
    try {
      await api.post(`/kpi-review/${reviewId}/manager-review`, {
        manager_rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        manager_comment: JSON.stringify(itemData),
        overall_manager_comment: overallComment,
        manager_signature: managerSignature,
      });

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

  const ratingOptions = [
    { value: 1, label: '1 - Below Expectations' },
    { value: 2, label: '2 - Partially Meets' },
    { value: 3, label: '3 - Meets Expectations' },
    { value: 4, label: '4 - Exceeds Expectations' },
    { value: 5, label: '5 - Outstanding' },
  ];

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
          <span className="text-sm text-gray-600">Due: Jan 15, 2025</span>
        </div>
      </div>

      {/* Employee Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Employee Information</h2>
          <button className="text-sm text-purple-600 hover:text-purple-700 flex items-center space-x-1">
            <span>View Full Profile</span>
            <FiExternalLink className="text-sm" />
          </button>
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
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">KPI TITLE</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">KPI DESCRIPTION</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">TARGET VALUE</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">MEASURE UNIT</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">EMPLOYEE SELF RATING</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">EMPLOYEE COMMENT</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">MANAGER RATING</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">MANAGER COMMENT</th>
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
                          <p className="font-semibold text-gray-900">{item.title}</p>
                          <p className="text-xs text-gray-500">KPI-{review.review_quarter}-{String(index + 1).padStart(3, '0')}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-700">{item.description || 'N/A'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900">{item.target_value || 'N/A'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-1 rounded bg-blue-100 text-blue-700 text-sm">
                          {item.measure_unit || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <FiStar
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= empRating
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-600">
                            {empRating > 0 ? `${empRating}/5` : '0/5'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-700">{empComment || 'N/A'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={mgrRating}
                          onChange={(e) => handleRatingChange(item.id, parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        >
                          <option value={0}>Select rating</option>
                          {ratingOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.value} - {opt.label.split(' - ')[1]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <textarea
                          value={mgrComment}
                          onChange={(e) => handleCommentChange(item.id, e.target.value)}
                          placeholder="Enter your comment..."
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
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
                    <p className="font-semibold text-gray-900">{review.target_value || 'N/A'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-1 rounded bg-blue-100 text-blue-700 text-sm">
                      {review.measure_unit || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <FiStar
                            key={star}
                            className={`w-4 h-4 ${
                              star <= (review.employee_rating || 0)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">
                        {review.employee_rating || 0}/5
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-700">{review.employee_comment || 'N/A'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={managerRatings[0] || 0}
                      onChange={(e) => handleRatingChange(0, parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value={0}>Select rating</option>
                      {ratingOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.value} - {opt.label.split(' - ')[1]}
                        </option>
                      ))}
                    </select>
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
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FiStar
                    key={star}
                    className={`w-4 h-4 ${
                      star <= Math.round(employeeAvg)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="font-semibold text-gray-900">
                {employeeAvg > 0 ? `${employeeAvg.toFixed(1)} / 5.0` : '0.0 / 5.0'}
              </span>
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Average Manager Rating</p>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FiStar
                    key={star}
                    className={`w-4 h-4 ${
                      star <= Math.round(managerAvg)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="font-semibold text-gray-900">
                {managerAvg > 0 ? `${managerAvg.toFixed(1)} / 5.0` : '0.0 / 5.0'}
              </span>
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
    </div>
  );
};

export default ManagerKPIReview;

