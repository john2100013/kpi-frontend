/**
 * Utility functions for KPI List
 */

import React from 'react';
import { FiClock, FiCheckCircle, FiFileText, FiEye } from 'react-icons/fi';
import { KPI, KPIReview } from '../../../types';
import { PeriodSetting } from '../types';

export interface StageInfo {
  stage: string;
  color: string;
  icon: React.ReactNode;
}

export const getKPIStage = (kpi: KPI, reviews: KPIReview[]): StageInfo => {
  // Find ANY review (including drafts) for status checking
  const review = reviews.find(r => r.kpi_id === kpi.id);
  
  // Find SUBMITTED review (excluding drafts) for "Review Pending" check
  const submittedReview = reviews.find(r => r.kpi_id === kpi.id && r.is_draft !== true);

  if (kpi.status === 'pending') {
    return {
      stage: 'KPI Setting - Awaiting Acknowledgement',
      color: 'bg-orange-100 text-orange-700',
      icon: <FiClock className="inline" />
    };
  }

  // Check for SUBMITTED review, not drafts
  if (kpi.status === 'acknowledged' && !submittedReview) {
    return {
      stage: 'KPI Acknowledged - Review Pending',
      color: 'bg-blue-100 text-blue-700',
      icon: <FiFileText className="inline" />
    };
  }

  if (review) {
    if (review.review_status === 'rejected') {
      return {
        stage: 'Review Rejected by Employee',
        color: 'bg-red-100 text-red-700',
        icon: <FiEye className="inline" />
      };
    }

    if (review.review_status === 'employee_submitted') {
      return {
        stage: 'Self-Rating Submitted - Awaiting Manager Review',
        color: 'bg-yellow-100 text-yellow-700',
        icon: <FiClock className="inline" />
      };
    }

    if (review.review_status === 'manager_submitted' || review.review_status === 'completed') {
      return {
        stage: 'KPI Review Completed',
        color: 'bg-green-100 text-green-700',
        icon: <FiCheckCircle className="inline" />
      };
    }

    if (review.review_status === 'pending') {
      return {
        stage: 'KPI Review - Self-Rating Required',
        color: 'bg-purple-100 text-purple-700',
        icon: <FiFileText className="inline" />
      };
    }
  }

  return {
    stage: 'In Progress',
    color: 'bg-gray-100 text-gray-700',
    icon: <FiClock className="inline" />
  };
};

export const getPeriodLabel = (kpi: KPI): string => {
  if (kpi.period === 'quarterly' && kpi.quarter) {
    return `${kpi.quarter} ${kpi.year} • Quarterly KPI`;
  }
  return `${kpi.year} • Annual KPI`;
};

export const getPeriodValue = (setting: PeriodSetting): string => {
  return `${setting.period_type}|${setting.quarter || ''}|${setting.year}`;
};

export const getPeriodLabelFromSetting = (setting: PeriodSetting): string => {
  if (setting.period_type === 'quarterly') {
    return `${setting.quarter} ${setting.year}`;
  }
  return `${setting.year}`;
};

export const exportToCSV = (kpis: KPI[], reviews: KPIReview[]) => {
  const headers = ['Employee Name', 'Department', 'Payroll Number', 'Manager', 'Period', 'KPI Status', 'Review Date'];
  const csvData = kpis.map(kpi => {
    const stageInfo = getKPIStage(kpi, reviews);
    return [
      kpi.employee_name,
      kpi.employee_department,
      kpi.employee_payroll_number || 'N/A',
      kpi.manager_name,
      getPeriodLabel(kpi),
      stageInfo.stage,
      new Date(kpi.updated_at).toLocaleDateString()
    ];
  });

  const csvContent = [
    headers.join(','),
    ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `kpi_overview_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
};

export const exportToExcel = (kpis: KPI[], reviews: KPIReview[]) => {
  const headers = ['Employee Name', 'Department', 'Payroll Number', 'Manager', 'Period', 'KPI Status', 'Review Date'];
  const excelData = kpis.map(kpi => {
    const stageInfo = getKPIStage(kpi, reviews);
    return [
      kpi.employee_name,
      kpi.employee_department,
      kpi.employee_payroll_number || 'N/A',
      kpi.manager_name,
      getPeriodLabel(kpi),
      stageInfo.stage,
      new Date(kpi.updated_at).toLocaleDateString()
    ];
  });

  // Create Excel-compatible HTML with inline styles
  let html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
  html += '<head><meta charset="utf-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>';
  html += '<x:Name>KPI Overview</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet>';
  html += '</x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body>';
  html += '<table border="1" style="border-collapse:collapse;">';
  
  // Headers with styling
  html += '<thead><tr>';
  headers.forEach(header => {
    html += `<th style="background-color:#4472C4;color:#FFFFFF;font-weight:bold;padding:8px;border:1px solid #000;">${header}</th>`;
  });
  html += '</tr></thead>';
  
  // Data rows
  html += '<tbody>';
  excelData.forEach(row => {
    html += '<tr>';
    row.forEach(cell => {
      const cellValue = String(cell).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      html += `<td style="padding:6px;border:1px solid #000;">${cellValue}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table></body></html>';

  const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `kpi_overview_${new Date().toISOString().split('T')[0]}.xls`;
  link.click();
};
