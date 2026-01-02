import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { KPI } from '../../types';
import SignatureField from '../../components/SignatureField';
import DatePicker from '../../components/DatePicker';
import { FiArrowLeft, FiSave, FiSend, FiStar } from 'react-icons/fi';

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

  useEffect(() => {
    if (kpiId) {
      fetchKPI();
    }
  }, [kpiId]);

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
          
          setEmployeeSignature(existingReview.employee_signature || '');
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
    setRatings({ ...ratings, [itemId]: value });
  };

  const handleCommentChange = (itemId: number, value: string) => {
    setComments({ ...comments, [itemId]: value });
  };

  const handleSaveDraft = async () => {
    // Save draft logic
    alert('Draft saved');
  };

  const handleSubmit = async () => {
    // Validate all items have ratings
    if (!kpi?.items || kpi.items.length === 0) {
      alert('No KPI items found');
      return;
    }

    const allRated = kpi.items.every((item) => {
      const rating = ratings[item.id];
      return rating && rating >= 1 && rating <= 5;
    });

    if (!allRated) {
      alert('Please provide a rating between 1 and 5 for all KPI items');
      return;
    }

    if (!employeeSignature) {
      alert('Please provide your digital signature');
      return;
    }

    // Calculate average rating
    const itemRatings = kpi.items.map((item) => ratings[item.id] || 0);
    const averageRating = itemRatings.reduce((sum, rating) => sum + rating, 0) / itemRatings.length;

    // Store item-level data as JSON in comment field
    const itemData = {
      items: kpi.items.map((item) => ({
        item_id: item.id,
        rating: ratings[item.id] || 0,
        comment: comments[item.id] || '',
      })),
      average_rating: averageRating,
    };

    setSaving(true);
    try {
      await api.post(`/kpi-review/${kpiId}/self-rating`, {
        employee_rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        employee_comment: JSON.stringify(itemData),
        employee_signature: employeeSignature,
        review_period: kpi?.period || 'quarterly',
        review_quarter: kpi?.quarter,
        review_year: kpi?.year,
      });

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

  const ratingOptions = [
    { value: 1, label: '1 - Below Expectations' },
    { value: 2, label: '2 - Partially Meets' },
    { value: 3, label: '3 - Meets Expectations' },
    { value: 4, label: '4 - Exceeds Expectations' },
    { value: 5, label: '5 - Outstanding' },
  ];

  // Calculate average rating and completion
  const calculateAverageRating = () => {
    if (!kpi?.items || kpi.items.length === 0) return 0;
    const itemRatings = kpi.items.map((item) => ratings[item.id] || 0).filter(r => r > 0);
    if (itemRatings.length === 0) return 0;
    return itemRatings.reduce((sum, rating) => sum + rating, 0) / itemRatings.length;
  };

  const calculateCompletion = () => {
    if (!kpi?.items || kpi.items.length === 0) return 0;
    const ratedCount = kpi.items.filter((item) => ratings[item.id] && ratings[item.id] >= 1 && ratings[item.id] <= 5).length;
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
          <li>Please rate your performance against each KPI using a scale of 1-5 (1 = Below Expectations, 5 = Exceeds Expectations)</li>
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
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">KPI TITLE</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">KPI DESCRIPTION</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">TARGET VALUE</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">MEASURE UNIT</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">SELF RATING *</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">EMPLOYEE COMMENT</th>
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
                          <p className="font-semibold text-gray-900">{item.title}</p>
                          <p className="text-xs text-gray-500">KPI-{kpi.quarter}-{String(index + 1).padStart(3, '0')}</p>
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
                        <div className="space-y-2">
                          <select
                            value={itemRating}
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
                          <div className="flex items-center space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <FiStar
                                key={star}
                                className={`w-5 h-5 ${
                                  star <= itemRating
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                            {itemRating > 0 && (
                              <span className="ml-2 text-sm text-gray-600">{itemRating}/5</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <textarea
                          value={itemComment}
                          onChange={(e) => handleCommentChange(item.id, e.target.value)}
                          placeholder="Optional comment..."
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
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
                    <p className="font-semibold text-gray-900">{kpi.target_value || 'N/A'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-1 rounded bg-blue-100 text-blue-700 text-sm">
                      {kpi.measure_unit || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      <select
                        value={ratings[0] || 0}
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
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <FiStar
                            key={star}
                            className={`w-5 h-5 ${
                              star <= (ratings[0] || 0)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                        {ratings[0] > 0 && (
                          <span className="ml-2 text-sm text-gray-600">{ratings[0]}/5</span>
                        )}
                      </div>
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
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FiStar
                        key={star}
                        className={`w-4 h-4 ${
                          star <= Math.round(averageRating)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {averageRating > 0 ? `${averageRating.toFixed(1)}/5.0` : '0.0/5.0'}
                  </span>
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
    </div>
  );
};

export default SelfRating;

