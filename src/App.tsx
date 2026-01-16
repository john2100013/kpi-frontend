import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { initializeAuth } from './store/slices/authSlice';
import { ROLE_IDS, isManager, isSuperAdmin, isHR, isEmployee } from './utils/roleUtils';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

// Auth Pages
import { Login } from './features/auth';

// Manager Pages
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
} from './features/manager';

// Employee Pages
import {
  EmployeeDashboard,
  KPIAcknowledgement,
  KPIConfirmation,
  SelfRating,
  KPIList,
  KPIDetails,
  Reviews,
} from './features/employee';
import AcknowledgeList from './features/employee/pages/AcknowledgeList';

// HR Pages
import {
  HRDashboard,
  HRKPIList,
  HRKPIDetails,
  HRSettings,
  DepartmentDashboard,
  EmailTemplates,
  RejectedKPIManagement,
  EmployeePerformance,
} from './features/hr';

// Shared Pages
import {
  AcknowledgedKPIs,
  KPISettingCompleted,
  CompletedReviews,
  Notifications,
  EditProfile,
  Employees,
  Profile,
} from './features/shared';

// Super Admin Pages
import {
  SuperAdminDashboard,
  CompanySelection,
  CompanyOnboarding,
  AssignHrToCompany,
  CompanyManagement,
  UserManagement,
  DepartmentManagement,
  DepartmentCalculationSettings,
  AssignManagerDepartments,
} from './features/superadmin';

// Protected Route Component (Using Redux)
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: number[] }> = ({
  children,
  allowedRoles,
}) => {
  const { user, isLoading } = useAppSelector((state) => state.auth);
  const { user: contextUser, isLoading: contextLoading } = useAuth();

  // Use Redux state if available, fallback to context during migration
  const currentUser = user || contextUser;
  const loading = isLoading || contextLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role_id)) {
    // Redirect to user's appropriate dashboard instead of causing a loop
    let redirectPath = '/login';
    if (isSuperAdmin(currentUser)) {
      redirectPath = '/super-admin/dashboard';
    } else if (isManager(currentUser)) {
      redirectPath = '/manager/dashboard';
    } else if (isHR(currentUser)) {
      redirectPath = '/hr/dashboard';
    } else if (isEmployee(currentUser)) {
      redirectPath = '/employee/dashboard';
    }
    return <Navigate to={redirectPath} replace />;
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
  const { user } = useAppSelector((state) => state.auth);
  const { setUser: setAuthContextUser } = useAuth();

  // Sync Redux user to AuthContext whenever it changes
  useEffect(() => {
    console.log('[AppRoutes] Syncing Redux user to AuthContext:', user);
    setAuthContextUser(user);
  }, [user, setAuthContextUser]);

  // Root route handler - redirect based on auth state
  const RootRedirect = () => {
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    
    // User is logged in, redirect to their dashboard
    if (isSuperAdmin(user)) {
      return <Navigate to="/super-admin/dashboard" replace />;
    } else if (isManager(user)) {
      return <Navigate to="/manager/dashboard" replace />;
    } else if (isHR(user)) {
      return <Navigate to="/hr/dashboard" replace />;
    } else if (isEmployee(user)) {
      return <Navigate to="/employee/dashboard" replace />;
    }
    
    // Fallback - should never happen but prevents loops
    return <Navigate to="/login" replace />;
  };

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/select-company" element={<CompanySelection />} />
      
      {/* Super Admin Routes */}
      <Route
        path="/super-admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={[ROLE_IDS.SUPER_ADMIN]}>
            <Layout>
              <SuperAdminDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/assign-hr"
        element={
          <ProtectedRoute allowedRoles={[ROLE_IDS.SUPER_ADMIN]}>
            <Layout>
              <AssignHrToCompany />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/company-management"
        element={
          <ProtectedRoute allowedRoles={[ROLE_IDS.SUPER_ADMIN]}>
            <Layout>
              <CompanyManagement />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/user-management"
        element={
          <ProtectedRoute allowedRoles={[ROLE_IDS.SUPER_ADMIN]}>
            <Layout>
              <UserManagement />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/assign-manager-departments"
        element={
          <ProtectedRoute allowedRoles={[ROLE_IDS.SUPER_ADMIN]}>
            <Layout>
              <AssignManagerDepartments />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/department-management"
        element={
          <ProtectedRoute allowedRoles={[ROLE_IDS.SUPER_ADMIN]}>
            <Layout>
              <DepartmentManagement />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/calculation-settings"
        element={
          <ProtectedRoute allowedRoles={[ROLE_IDS.SUPER_ADMIN]}>
            <Layout>
              <DepartmentCalculationSettings />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/onboard"
        element={
          <ProtectedRoute allowedRoles={[ROLE_IDS.SUPER_ADMIN]}>
            <Layout>
              <CompanyOnboarding />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      {/* Manager Routes */}
      {isManager(user) && (
        <>
          <Route
            path="/manager/dashboard"
            element={
              <ProtectedRoute allowedRoles={[ROLE_IDS.MANAGER]}>
                <Layout>
                  <ManagerDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/kpi-setting/:employeeId"
            element={
              <ProtectedRoute allowedRoles={[ROLE_IDS.MANAGER]}>
                <Layout>
                  <KPISetting />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/kpi-review/:reviewId"
            element={
              <ProtectedRoute allowedRoles={[ROLE_IDS.MANAGER]}>
                <Layout>
                  <ManagerKPIReview />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/select-employee"
            element={
              <ProtectedRoute allowedRoles={[ROLE_IDS.MANAGER]}>
                <Layout>
                  <EmployeeSelection />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/kpi-management"
            element={
              <ProtectedRoute allowedRoles={[ROLE_IDS.MANAGER]}>
                <Layout>
                  <EmployeeSelection />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/employees"
            element={
              <ProtectedRoute allowedRoles={[ROLE_IDS.MANAGER]}>
                <Layout>
                  <EmployeeSelection />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/reviews"
            element={
              <ProtectedRoute allowedRoles={[ROLE_IDS.MANAGER]}>
                <Layout>
                  <ReviewsList />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/kpi-list"
            element={
              <ProtectedRoute allowedRoles={[ROLE_IDS.MANAGER]}>
                <Layout>
                  <ManagerKPIList />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/kpi-details/:kpiId"
            element={
              <ProtectedRoute allowedRoles={[ROLE_IDS.MANAGER]}>
                <Layout>
                  <ManagerKPIDetails />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/kpi-templates"
            element={
              <ProtectedRoute allowedRoles={[ROLE_IDS.MANAGER]}>
                <Layout>
                  <KPITemplates />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/kpi-templates/create"
            element={
              <ProtectedRoute allowedRoles={[ROLE_IDS.MANAGER]}>
                <Layout>
                  <KPITemplateForm />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/kpi-templates/:id/edit"
            element={
              <ProtectedRoute allowedRoles={[ROLE_IDS.MANAGER]}>
                <Layout>
                  <KPITemplateForm />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/kpi-templates/:templateId/apply"
            element={
              <ProtectedRoute allowedRoles={[ROLE_IDS.MANAGER]}>
                <Layout>
                  <ApplyKPITemplate />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/employee-kpis/:employeeId"
            element={
              <ProtectedRoute allowedRoles={[ROLE_IDS.MANAGER]}>
                <Layout>
                  <EmployeeKPIs />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/acknowledged-kpis"
            element={
              <ProtectedRoute allowedRoles={[ROLE_IDS.MANAGER]}>
                <Layout>
                  <AcknowledgedKPIs />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/kpi-setting-completed"
            element={
              <ProtectedRoute allowedRoles={[ROLE_IDS.MANAGER]}>
                <Layout>
                  <KPISettingCompleted />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/completed-reviews"
            element={
              <ProtectedRoute allowedRoles={[ROLE_IDS.MANAGER]}>
                <Layout>
                  <CompletedReviews />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/schedule-meeting"
            element={
              <ProtectedRoute allowedRoles={[ROLE_IDS.MANAGER]}>
                <Layout>
                  <MeetingScheduler />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/schedule-meeting/kpi/:kpiId"
            element={
              <ProtectedRoute allowedRoles={[ROLE_IDS.MANAGER]}>
                <Layout>
                  <MeetingScheduler />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/schedule-meeting/review/:reviewId"
            element={
              <ProtectedRoute allowedRoles={[ROLE_IDS.MANAGER]}>
                <Layout>
                  <MeetingScheduler />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/notifications"
            element={
              <ProtectedRoute allowedRoles={[ROLE_IDS.MANAGER]}>
                <Layout>
                  <Notifications />
                </Layout>
              </ProtectedRoute>
            }
          />
        </>
      )}

      {/* Employee Routes */}
      <Route
        path="/employee/dashboard"
        element={
          <ProtectedRoute allowedRoles={[ROLE_IDS.EMPLOYEE]}>
            <Layout>
              <EmployeeDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/my-kpis"
        element={
          <ProtectedRoute allowedRoles={[ROLE_IDS.EMPLOYEE]}>
            <Layout>
              <EmployeeDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/acknowledge"
        element={
          <ProtectedRoute allowedRoles={[ROLE_IDS.EMPLOYEE]}>
            <Layout>
              <AcknowledgeList />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/kpi-acknowledgement/:kpiId"
        element={
          <ProtectedRoute allowedRoles={[ROLE_IDS.EMPLOYEE]}>
            <Layout>
              <KPIAcknowledgement />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/kpi-confirmation/:reviewId"
        element={
          <ProtectedRoute allowedRoles={[ROLE_IDS.EMPLOYEE]}>
            <Layout>
              <KPIConfirmation />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/self-rating/:kpiId"
        element={
          <ProtectedRoute allowedRoles={[ROLE_IDS.EMPLOYEE]}>
            <Layout>
              <SelfRating />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/kpi-list"
        element={
          <ProtectedRoute allowedRoles={[ROLE_IDS.EMPLOYEE]}>
            <Layout>
              <KPIList />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/kpi-details/:kpiId"
        element={
          <ProtectedRoute allowedRoles={[ROLE_IDS.EMPLOYEE]}>
            <Layout>
              <KPIDetails />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/reviews"
        element={
          <ProtectedRoute allowedRoles={[ROLE_IDS.EMPLOYEE]}>
            <Layout>
              <Reviews />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/kpi-setting-completed"
        element={
          <ProtectedRoute allowedRoles={[ROLE_IDS.EMPLOYEE]}>
            <Layout>
              <KPISettingCompleted />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/completed-reviews"
        element={
          <ProtectedRoute allowedRoles={[ROLE_IDS.EMPLOYEE]}>
            <Layout>
              <CompletedReviews />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* HR Routes */}
      <Route
        path="/hr/dashboard"
        element={
          <ProtectedRoute allowedRoles={[ROLE_IDS.HR]}>
            <Layout>
              <HRDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/kpi-list"
        element={
          <ProtectedRoute allowedRoles={[ROLE_IDS.HR]}>
            <Layout>
              <HRKPIList />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/kpi-details/:kpiId"
        element={
          <ProtectedRoute allowedRoles={[ROLE_IDS.HR]}>
            <Layout>
              <HRKPIDetails />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/acknowledged-kpis"
        element={
          <ProtectedRoute allowedRoles={[ROLE_IDS.HR]}>
            <Layout>
              <AcknowledgedKPIs />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/kpi-setting-completed"
        element={
          <ProtectedRoute allowedRoles={[ROLE_IDS.HR]}>
            <Layout>
              <KPISettingCompleted />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/completed-reviews"
        element={
          <ProtectedRoute allowedRoles={[ROLE_IDS.HR]}>
            <Layout>
              <CompletedReviews />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/notifications"
        element={
          <ProtectedRoute allowedRoles={[ROLE_IDS.HR]}>
            <Layout>
              <Notifications />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/settings"
        element={
          <ProtectedRoute allowedRoles={[ROLE_IDS.HR]}>
            <Layout>
              <HRSettings />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/email-templates"
        element={
          <ProtectedRoute allowedRoles={[ROLE_IDS.HR]}>
            <Layout>
              <EmailTemplates />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/rejected-kpis"
        element={
          <ProtectedRoute allowedRoles={[ROLE_IDS.HR]}>
            <Layout>
              <RejectedKPIManagement />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/departments"
        element={
          <ProtectedRoute allowedRoles={[ROLE_IDS.HR]}>
            <Layout>
              <DepartmentDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/departments"
        element={
          <ProtectedRoute allowedRoles={[ROLE_IDS.MANAGER]}>
            <Layout>
              <DepartmentDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/employee-performance/:employeeId"
        element={
          <ProtectedRoute allowedRoles={[ROLE_IDS.HR]}>
            <Layout>
              <EmployeePerformance />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/employees"
        element={
          <ProtectedRoute allowedRoles={[ROLE_IDS.HR]}>
            <Layout>
              <Employees />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/employees"
        element={
          <ProtectedRoute allowedRoles={[ROLE_IDS.MANAGER]}>
            <Layout>
              <Employees />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees"
        element={
          <ProtectedRoute allowedRoles={[ROLE_IDS.HR, ROLE_IDS.MANAGER, ROLE_IDS.SUPER_ADMIN]}>
            <Layout>
              <Employees />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Shared Routes */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Layout>
              <Profile />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/edit"
        element={
          <ProtectedRoute allowedRoles={[ROLE_IDS.HR, ROLE_IDS.MANAGER]}>
            <Layout>
              <EditProfile />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <Layout>
              <Notifications />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Default redirect - smart redirect based on auth state */}
      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}

function App() {
  const dispatch = useAppDispatch();

  // Initialize Redux auth state from localStorage on app mount
  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
