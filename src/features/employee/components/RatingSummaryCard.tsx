import React from 'react';

interface RatingSummaryCardProps {
  employeeRating: number;
  managerRating: number;
  employeeFinalRating?: number;
  managerFinalRating?: number;
}

const getPerformanceLevel = (rating: number): string => {
  if (rating >= 1.4) return 'Exceeds Expectation';
  if (rating >= 1.15) return 'Meets Expectation';
  return 'Below Expectation';
};

export const RatingSummaryCard: React.FC<RatingSummaryCardProps> = ({
  employeeRating,
  managerRating,
  employeeFinalRating,
  managerFinalRating,
}) => {
  const displayEmployeeFinal = employeeFinalRating || employeeRating;
  const displayManagerFinal = managerFinalRating || managerRating;
  
  return (
    <div className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border-2 border-purple-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Total Rating Summary</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg p-4 border border-purple-200">
          <p className="text-sm text-gray-600 mb-2">Your Rating</p>
          {employeeFinalRating && (
            <div className="mb-2">
              <p className="text-xs text-gray-500">Average:</p>
              <span className="text-lg font-semibold text-gray-700">
                {employeeRating.toFixed(2)}
              </span>
            </div>
          )}
          <div className="flex items-baseline space-x-3">
            <div>
              <p className="text-xs text-gray-500">Final:</p>
              <span className="text-3xl font-bold text-purple-600">
                {displayEmployeeFinal.toFixed(2)}
              </span>
            </div>
            <span className="text-lg text-gray-500">
              ({((displayEmployeeFinal * 100) / 1.5).toFixed(1)}%)
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">{getPerformanceLevel(displayEmployeeFinal)}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-yellow-200">
          <p className="text-sm text-gray-600 mb-2">Manager's Rating</p>
          {managerFinalRating && (
            <div className="mb-2">
              <p className="text-xs text-gray-500">Average:</p>
              <span className="text-lg font-semibold text-gray-700">
                {managerRating.toFixed(2)}
              </span>
            </div>
          )}
          <div className="flex items-baseline space-x-3">
            <div>
              <p className="text-xs text-gray-500">Final:</p>
              <span className="text-3xl font-bold text-yellow-600">
                {displayManagerFinal.toFixed(2)}
              </span>
            </div>
            <span className="text-lg text-gray-500">
              ({((displayManagerFinal * 100) / 1.5).toFixed(1)}%)
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">{getPerformanceLevel(displayManagerFinal)}</p>
        </div>
      </div>
    </div>
  );
};