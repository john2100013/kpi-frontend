import React from 'react';
import { Route } from 'react-router-dom';
import {
  ManagerDashboard,
  KPISetting,
  ManagerKPIReview,
  EmployeeSelection,
  ReviewsList,
  ManagerKPIList,
  ManagerKPIDetails,
  EmployeeKPIs,
  KPITemplates,
  KPITemplateForm,
  ApplyKPITemplate,
  MeetingScheduler,
} from '../features/manager';
import {
  AcknowledgedKPIs,
  KPISettingCompleted,
  CompletedReviews,
  Notifications,
  Employees,
} from '../features/shared';
import { DepartmentDashboard } from '../features/hr';

/**
 * Manager Routes
 * 
 * Route definitions for manager-specific pages.
 */

interface ProtectedRouteProps {
  allowedRoles?: string[];
  children: React.ReactNode;
}

interface LayoutProps {
  children: React.ReactNode;
}

export const getManagerRoutes = (
  ProtectedRoute: React.FC<ProtectedRouteProps>,
  Layout: React.FC<LayoutProps>
) => {
  // Wrapper component to log route matching
  const ManagerKPIReviewWrapper: React.FC = () => {
    console.log('🎯 [ManagerKPIReviewWrapper] Component rendered!');
    console.log('🎯 [ManagerKPIReviewWrapper] Current URL:', window.location.href);
    console.log('🎯 [ManagerKPIReviewWrapper] Pathname:', window.location.pathname);
    return <ManagerKPIReview />;
  };

  return (
    <>
      {/* Dashboard */}
      <Route
        path="/manager/dashboard"
        element={
          <ProtectedRoute allowedRoles={['manager']}>
            <Layout>
              <ManagerDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* KPI Setting */}
      <Route
        path="/manager/kpi-setting/:employeeId"
        element={
          <ProtectedRoute allowedRoles={['manager']}>
            <Layout>
              <KPISetting />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Start Review from KPI (must be before :reviewId route) */}
      <Route
        path="/manager/kpi-review/kpi/:kpiId"
        element={
          <ProtectedRoute allowedRoles={['manager']}>
            <Layout>
              <ManagerKPIReviewWrapper />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* KPI Review */}
      <Route
        path="/manager/kpi-review/:reviewId"
        element={
          <ProtectedRoute allowedRoles={['manager']}>
            <Layout>
              <ManagerKPIReviewWrapper />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Employee Selection & Management */}
      <Route
        path="/manager/select-employee"
        element={
          <ProtectedRoute allowedRoles={['manager']}>
            <Layout>
              <EmployeeSelection />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/kpi-management"
        element={
          <ProtectedRoute allowedRoles={['manager']}>
            <Layout>
              <EmployeeSelection />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/employees"
        element={
          <ProtectedRoute allowedRoles={['manager']}>
            <Layout>
              <Employees />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Reviews */}
      <Route
        path="/manager/reviews"
        element={
          <ProtectedRoute allowedRoles={['manager']}>
            <Layout>
              <ReviewsList />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* KPI List & Details */}
      <Route
        path="/manager/kpi-list"
        element={
          <ProtectedRoute allowedRoles={['manager']}>
            <Layout>
              <ManagerKPIList />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/kpi-details/:kpiId"
        element={
          <ProtectedRoute allowedRoles={['manager']}>
            <Layout>
              <ManagerKPIDetails />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* KPI Templates */}
      <Route
        path="/manager/kpi-templates"
        element={
          <ProtectedRoute allowedRoles={['manager']}>
            <Layout>
              <KPITemplates />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/kpi-templates/create"
        element={
          <ProtectedRoute allowedRoles={['manager']}>
            <Layout>
              <KPITemplateForm />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/kpi-templates/:id/edit"
        element={
          <ProtectedRoute allowedRoles={['manager']}>
            <Layout>
              <KPITemplateForm />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      {/* Apply KPI Template - THIS IS THE KEY ROUTE */}
      <Route
        path="/manager/kpi-templates/:templateId/apply"
        element={
          <ProtectedRoute allowedRoles={['manager']}>
            <Layout>
              <ApplyKPITemplate />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Employee KPIs */}
      <Route
        path="/manager/employee-kpis/:employeeId"
        element={
          <ProtectedRoute allowedRoles={['manager']}>
            <Layout>
              <EmployeeKPIs />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Status Pages */}
      <Route
        path="/manager/acknowledged-kpis"
        element={
          <ProtectedRoute allowedRoles={['manager']}>
            <Layout>
              <AcknowledgedKPIs />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/kpi-setting-completed"
        element={
          <ProtectedRoute allowedRoles={['manager']}>
            <Layout>
              <KPISettingCompleted />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/completed-reviews"
        element={
          <ProtectedRoute allowedRoles={['manager']}>
            <Layout>
              <CompletedReviews />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Meeting Scheduler */}
      <Route
        path="/manager/schedule-meeting"
        element={
          <ProtectedRoute allowedRoles={['manager']}>
            <Layout>
              <MeetingScheduler />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/schedule-meeting/kpi/:kpiId"
        element={
          <ProtectedRoute allowedRoles={['manager']}>
            <Layout>
              <MeetingScheduler />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/schedule-meeting/review/:reviewId"
        element={
          <ProtectedRoute allowedRoles={['manager']}>
            <Layout>
              <MeetingScheduler />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Departments */}
      <Route
        path="/manager/departments"
        element={
          <ProtectedRoute allowedRoles={['manager']}>
            <Layout>
              <DepartmentDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Notifications */}
      <Route
        path="/manager/notifications"
        element={
          <ProtectedRoute allowedRoles={['manager']}>
            <Layout>
              <Notifications />
            </Layout>
          </ProtectedRoute>
        }
      />
    </>
  );
};
