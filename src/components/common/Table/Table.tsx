/**
 * Reusable Table Component
 * 
 * A flexible table component with sorting, pagination, and custom cell rendering.
 */

import React, { useState } from 'react';
import LoadingSpinner from '../LoadingSpinner';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export interface TableColumn<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  width?: string;
  sortable?: boolean;
  className?: string;
}

export interface PaginationConfig {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  rowsPerPage?: number;
}

interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  hover?: boolean;
  striped?: boolean;
  /**
   * @deprecated Use paginationConfig instead for server-side pagination
   */
  pagination?: boolean;
  rowsPerPage?: number;
  /**
   * Server-side pagination configuration.
   * When provided, the table will display pagination controls using server data.
   * The `data` prop should contain only the current page's data.
   */
  paginationConfig?: PaginationConfig;
}

export function Table<T>({
  data,
  columns,
  loading = false,
  onRowClick,
  emptyMessage = 'No data available',
  hover = true,
  striped = false,
  pagination = false,
  rowsPerPage = 20,
  paginationConfig,
}: TableProps<T>) {
  // Local state for deprecated client-side pagination only
  const [currentPage, setCurrentPage] = useState(1);

  // Use server-side pagination config if provided, otherwise fall back to client-side (deprecated)
  const isServerPagination = !!paginationConfig;
  const showPagination = isServerPagination || pagination;

  // Server-side pagination values
  const serverCurrentPage = paginationConfig?.currentPage || 1;
  const serverTotalPages = paginationConfig?.totalPages || 1;
  const serverTotalCount = paginationConfig?.totalCount || 0;
  const serverRowsPerPage = paginationConfig?.rowsPerPage || rowsPerPage;

  // Client-side pagination calculations (DEPRECATED - only for backward compatibility)
  const totalPages = isServerPagination ? serverTotalPages : Math.ceil(data.length / rowsPerPage);
  const startIndex = isServerPagination 
    ? (serverCurrentPage - 1) * serverRowsPerPage 
    : (currentPage - 1) * rowsPerPage;
  const endIndex = isServerPagination 
    ? startIndex + data.length  // data already contains only current page
    : startIndex + rowsPerPage;
  
  // CRITICAL: Only slice data for client-side pagination (deprecated)
  // For server-side pagination, data is already paginated by the backend
  const paginatedData = isServerPagination ? data : (pagination ? data.slice(startIndex, endIndex) : data);

  const activePage = isServerPagination ? serverCurrentPage : currentPage;

  const handlePageChange = (page: number) => {
    if (isServerPagination) {
      paginationConfig.onPageChange(page);
    } else {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (activePage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (activePage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(activePage - 1);
        pages.push(activePage);
        pages.push(activePage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="text-center py-12 text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  style={{ width: col.width }}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={`bg-white divide-y divide-gray-200 ${striped ? 'divide-y-0' : ''}`}>
            {paginatedData.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                onClick={() => onRowClick?.(row)}
                className={`
                  ${onRowClick ? 'cursor-pointer' : ''}
                  ${hover ? 'hover:bg-gray-50' : ''}
                  ${striped && rowIdx % 2 === 1 ? 'bg-gray-50' : ''}
                  transition-colors duration-150
                `}
              >
                {columns.map((col, colIdx) => {
                  const cellValue = typeof col.accessor === 'function'
                    ? col.accessor(row)
                    : String(row[col.accessor] ?? '');
                  
                  return (
                    <td
                      key={colIdx}
                      className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${col.className || ''}`}
                    >
                      {cellValue}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showPagination && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200">
          <div className="flex items-center text-sm text-gray-700">
            {isServerPagination ? (
              <>Showing {startIndex + 1} to {endIndex} of {serverTotalCount} results</>
            ) : (
              <>Showing {startIndex + 1} to {Math.min(endIndex, data.length)} of {data.length} results</>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(activePage - 1)}
              disabled={activePage === 1}
              className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiChevronLeft />
            </button>
            
            {getPageNumbers().map((page, idx) => (
              page === '...' ? (
                <span key={`ellipsis-${idx}`} className="px-2 text-gray-500">...</span>
              ) : (
                <button
                  key={page}
                  onClick={() => handlePageChange(page as number)}
                  className={`px-4 py-1 border rounded-md ${
                    activePage === page
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              )
            ))}
            
            <button
              onClick={() => handlePageChange(activePage + 1)}
              disabled={activePage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiChevronRight />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Table;
