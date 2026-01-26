/**
 * KPI Rejection Card Component
 * Shows rejection details and resolution options
 */

import React from 'react';
import { FiCheckCircle } from 'react-icons/fi';
import { KPIReview } from '../../../types';
import { Button } from '../../../components/common';

interface KPIRejectionCardProps {
  review: KPIReview;
  resolveNote: string;
  onResolveNoteChange: (note: string) => void;
  onResolve: () => void;
}

export const KPIRejectionCard: React.FC<KPIRejectionCardProps> = ({
  review,
  resolveNote,
  onResolveNoteChange,
  onResolve,
}) => {
  // Check for rejection - use both field names for compatibility
  const rejectionNote = review.rejection_note || review.employee_rejection_note;
  const confirmationStatus = review.confirmation_status || review.employee_confirmation_status;
  const signedAt = review.confirmation_signed_at || review.employee_confirmation_signed_at;
  
  if (review.review_status !== 'rejected' && review.status !== 'rejected') {
    return null;
  }
  
  if (!rejectionNote) {
    return null;
  }

  return (
    <div className="mt-6 p-4 bg-red-50 rounded-lg border-2 border-red-300">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-bold text-red-900">⚠️ Employee Rejection Reason:</p>
        {confirmationStatus === 'rejected' && (
          <span className="px-2 py-1 bg-red-200 text-red-800 text-xs rounded-full font-semibold">
            REJECTED
          </span>
        )}
      </div>
      <p className="text-sm text-red-700 font-medium bg-white p-3 rounded border border-red-200">
        {rejectionNote}
      </p>
      {signedAt && (
        <p className="text-xs text-red-600 mt-2">
          Rejected on {new Date(signedAt).toLocaleDateString()}
        </p>
      )}

      {/* Mark as Resolved Button for HR */}
      {review.rejection_resolved_status !== 'resolved' && (
        <div className="mt-4 pt-4 border-t border-red-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Resolution Note (Optional)
          </label>
          <textarea
            value={resolveNote}
            onChange={(e) => onResolveNoteChange(e.target.value)}
            placeholder="Enter a note about how this issue was resolved..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 mb-3"
            rows={3}
          />
          <Button onClick={onResolve} variant="success">
            ✓ Mark as Resolved
          </Button>
        </div>
      )}

      {/* Resolved Status */}
      {review.rejection_resolved_status === 'resolved' && (
        <div className="mt-4 pt-4 border-t border-red-200">
          <div className="flex items-center space-x-2 text-green-700 mb-2">
            <FiCheckCircle className="text-lg" />
            <span className="font-semibold">Issue Resolved</span>
          </div>
          {review.rejection_resolved_note && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-2">
              <p className="text-sm font-medium text-gray-700 mb-1">Resolution Note:</p>
              <p className="text-sm text-gray-900">{review.rejection_resolved_note}</p>
            </div>
          )}
          {review.rejection_resolved_at && (
            <p className="text-xs text-gray-600">
              Resolved on {new Date(review.rejection_resolved_at).toLocaleDateString()}
              {review.rejection_resolved_by_name && ` by ${review.rejection_resolved_by_name}`}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
