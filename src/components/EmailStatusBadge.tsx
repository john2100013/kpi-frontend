/**
 * Email Status Badge Component
 * Displays email sending results with success/failure counts
 */

import React from 'react';

interface EmailStatusBadgeProps {
  sent: number;
  failed: number;
  className?: string;
}

const EmailStatusBadge: React.FC<EmailStatusBadgeProps> = ({
  sent,
  failed,
  className = '',
}) => {
  if (sent === 0 && failed === 0) {
    return null;
  }

  return (
    <div className={`flex items-center gap-3 text-sm ${className}`}>
      {sent > 0 && (
        <div className="flex items-center gap-1 text-green-600">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span className="font-medium">{sent} sent</span>
        </div>
      )}
      {failed > 0 && (
        <div className="flex items-center gap-1 text-red-600">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          <span className="font-medium">{failed} failed</span>
        </div>
      )}
    </div>
  );
};

export default EmailStatusBadge;
