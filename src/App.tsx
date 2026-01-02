import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

// Pages
import Login from './pages/Login';
import ManagerDashboard from './pages/manager/Dashboard';
import KPISetting from './pages/manager/KPISetting';
import ManagerKPIReview from './pages/manager/KPIReview';
import EmployeeSelection from './pages/manager/EmployeeSelection';
import ReviewsList from './pages/manager/ReviewsList';
import ManagerKPIList from './pages/manager/KPIList';
import ManagerKPIDetails from './pages/manager/KPIDetails';
import EmployeeKPIs from './pages/manager/EmployeeKPIs';
import EmployeeDashboard from './pages/employee/Dashboard';
import KPIAcknowledgement from './pages/employee/KPIAcknowledgement';
import SelfRating from './pages/employee/SelfRating';
import KPIList from './pages/employee/KPIList';
import KPIDetails from './pages/employee/KPIDetails';
import HRDashboard from './pages/hr/Dashboard';
import HRKPIList from './pages/hr/KPIList';
import HRKPIDetails from './pages/hr/KPIDetails';
import AcknowledgedKPIs from './pages/shared/AcknowledgedKPIs';
import Notifications from './pages/shared/Notifications';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles,
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Layout Component
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      {/* Manager Routes */}
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
      <Route
        path="/manager/kpi-review/:reviewId"
        element={
          <ProtectedRoute allowedRoles={['manager']}>
            <Layout>
              <ManagerKPIReview />
            </Layout>
          </ProtectedRoute>
        }
      />
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
              <EmployeeSelection />
            </Layout>
          </ProtectedRoute>
        }
      />
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
        path="/manager/notifications"
        element={
          <ProtectedRoute allowedRoles={['manager']}>
            <Layout>
              <Notifications />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Employee Routes */}
      <Route
        path="/employee/dashboard"
        element={
          <ProtectedRoute allowedRoles={['employee']}>
            <Layout>
              <EmployeeDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/my-kpis"
        element={
          <ProtectedRoute allowedRoles={['employee']}>
            <Layout>
              <EmployeeDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/kpi-acknowledgement/:kpiId"
        element={
          <ProtectedRoute allowedRoles={['employee']}>
            <Layout>
              <KPIAcknowledgement />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/self-rating/:kpiId"
        element={
          <ProtectedRoute allowedRoles={['employee']}>
            <Layout>
              <SelfRating />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/kpi-list"
        element={
          <ProtectedRoute allowedRoles={['employee']}>
            <Layout>
              <KPIList />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/kpi-details/:kpiId"
        element={
          <ProtectedRoute allowedRoles={['employee']}>
            <Layout>
              <KPIDetails />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* HR Routes */}
      <Route
        path="/hr/dashboard"
        element={
          <ProtectedRoute allowedRoles={['hr']}>
            <Layout>
              <HRDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/kpi-list"
        element={
          <ProtectedRoute allowedRoles={['hr']}>
            <Layout>
              <HRKPIList />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/kpi-details/:kpiId"
        element={
          <ProtectedRoute allowedRoles={['hr']}>
            <Layout>
              <HRKPIDetails />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/acknowledged-kpis"
        element={
          <ProtectedRoute allowedRoles={['hr']}>
            <Layout>
              <AcknowledgedKPIs />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/notifications"
        element={
          <ProtectedRoute allowedRoles={['hr']}>
            <Layout>
              <Notifications />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
