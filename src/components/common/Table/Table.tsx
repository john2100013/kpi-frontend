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

interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  hover?: boolean;
  striped?: boolean;
  pagination?: boolean;
  rowsPerPage?: number;
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
}: TableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);

 

  // Calculate pagination
  const totalPages = Math.ceil(data.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedData = pagination ? data.slice(startIndex, endIndex) : data;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
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

      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200">
          <div className="flex items-center text-sm text-gray-700">
            Showing {startIndex + 1} to {Math.min(endIndex, data.length)} of {data.length} results
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
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
                    currentPage === page
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              )
            ))}
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
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
