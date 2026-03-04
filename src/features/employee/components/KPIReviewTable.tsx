import React from 'react';
import { KPIItem } from '../../../types';

interface ItemRatings {
  [key: number]: number;
}

interface ItemComments {
  [key: number]: string;
}

interface KPIReviewTableProps {
  items: KPIItem[];
  employeeRatings: ItemRatings;
  employeeComments: ItemComments;
  managerRatings?: ItemRatings;
  managerComments?: ItemComments;
  onViewText: (title: string, value: string) => void;
  showManagerColumns?: boolean;
}

const getRatingLabel = (rating: number): string => {
  if (rating === 1.00) return 'Below Expectation';
  if (rating === 1.25) return 'Meets Expectation';
  if (rating === 1.50) return 'Exceeds Expectation';
  if (rating === 0) return 'Not Rated';
  return 'Custom';
};

export const KPIReviewTable: React.FC<KPIReviewTableProps> = ({
  items,
  employeeRatings,
  employeeComments,
  managerRatings = {},
  managerComments = {},
  onViewText,
  showManagerColumns = false,
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full" style={{ minWidth: showManagerColumns ? '1800px' : '1400px' }}>
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase sticky left-0 bg-gray-50 z-10" style={{ minWidth: '50px' }}>
              #
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase" style={{ minWidth: '200px' }}>
              KPI TITLE
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase" style={{ minWidth: '250px' }}>
              DESCRIPTION
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase" style={{ minWidth: '150px' }}>
              TARGET VALUE
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase" style={{ minWidth: '120px' }}>
              MEASURE UNIT
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase" style={{ minWidth: '120px' }}>
              GOAL WEIGHT
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase" style={{ minWidth: '150px' }}>
              YOUR RATING
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase" style={{ minWidth: '200px' }}>
              YOUR COMMENT
            </th>
            {showManagerColumns && (
              <>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase" style={{ minWidth: '150px' }}>
                  MANAGER RATING
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase" style={{ minWidth: '200px' }}>
                  MANAGER COMMENT
                </th>
              </>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {items.map((item, index) => {
            const empRating = employeeRatings[item.id] || 0;
            const empComment = employeeComments[item.id] || '';
            const mgrRating = managerRatings[item.id] || 0;
            const mgrComment = managerComments[item.id] || '';

            return (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-4 sticky left-0 bg-white z-10">
                  <span className="font-semibold text-gray-900">{index + 1}</span>
                </td>
                <td className="px-4 py-4">
                  <button
                    onClick={() => onViewText('KPI Title', item.title || 'N/A')}
                    className="text-left font-semibold text-gray-900 hover:text-purple-600 transition-colors"
                  >
                    <p className="truncate max-w-[200px]" title={item.title}>
                      {item.title}
                    </p>
                  </button>
                </td>
                <td className="px-4 py-4">
                  <button
                    onClick={() => onViewText('Description', item.description || 'N/A')}
                    className="text-left text-sm text-gray-700 hover:text-purple-600 transition-colors"
                  >
                    <p className="truncate max-w-[250px]" title={item.description || 'N/A'}>
                      {item.description || 'N/A'}
                    </p>
                  </button>
                </td>
                <td className="px-4 py-4">
                  <p className="text-sm text-gray-900">{item.target_value || 'N/A'}</p>
                </td>
                <td className="px-4 py-4">
                  <span className="inline-flex items-center px-2 py-1 rounded bg-blue-100 text-blue-700 text-sm">
                    {item.measure_unit || 'N/A'}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <p className="text-sm text-gray-700">{item.goal_weight || 'N/A'}</p>
                </td>
                <td className="px-4 py-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-semibold text-purple-600">
                        {empRating.toFixed(2)}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({((empRating * 100) / 1.25).toFixed(1)}%)
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{getRatingLabel(empRating)}</p>
                  </div>
                </td>
                <td className="px-4 py-4">
                  {empComment ? (
                    <button
                      onClick={() => onViewText('Your Comment', empComment)}
                      className="text-left text-sm text-gray-700 hover:text-purple-600 transition-colors"
                    >
                      <p className="truncate max-w-[200px]" title={empComment}>
                        {empComment.length > 40 ? empComment.substring(0, 40) + '...' : empComment}
                      </p>
                    </button>
                  ) : (
                    <span className="text-sm text-gray-400">No comment</span>
                  )}
                </td>
                {showManagerColumns && (
                  <>
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-semibold text-yellow-600">
                            {mgrRating.toFixed(2)}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({((mgrRating * 100) / 1.25).toFixed(1)}%)
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">{getRatingLabel(mgrRating)}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {mgrComment ? (
                        <button
                          onClick={() => onViewText('Manager Comment', mgrComment)}
                          className="text-left text-sm text-gray-700 hover:text-purple-600 transition-colors"
                        >
                          <p className="truncate max-w-[200px]" title={mgrComment}>
                            {mgrComment.length > 40 ? mgrComment.substring(0, 40) + '...' : mgrComment}
                          </p>
                        </button>
                      ) : (
                        <span className="text-sm text-gray-400">No comment</span>
                      )}
                    </td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};