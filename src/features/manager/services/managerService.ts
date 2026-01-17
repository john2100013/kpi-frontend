/**
 * Manager API Services
 */

import api from '../../../services/api';
import { Employee, ManagerDepartment } from '../types';
import { KPIReview, Notification } from '../../../types';

export const managerService = {
  /**
   * Fetch KPI reviews
   */
  fetchReviews: async (): Promise<KPIReview[]> => {
    try {
      console.log('[managerService] Fetching reviews from /kpi-review');
      const response = await api.get('/kpi-review');
      const reviews = response.data.reviews || [];
      console.log('[managerService] Reviews fetched successfully:', reviews.length);
      return reviews;
    } catch (error) {
      console.error('[managerService] Error fetching reviews:', error);
      throw error;
    }
  },

  /**
   * Fetch unread notifications for manager
   */
  fetchNotifications: async (limit: number = 5): Promise<Notification[]> => {
    try {
      console.log('[managerService] Fetching notifications, limit:', limit);
      const response = await api.get('/notifications', { 
        params: { limit, read: 'false' } 
      });
      const notifications = response.data.notifications || [];
      console.log('[managerService] Notifications fetched successfully:', notifications.length);
      return notifications;
    } catch (error) {
      console.error('[managerService] Error fetching notifications:', error);
      throw error;
    }
  },

  /**
   * Fetch recent activity
   */
  fetchRecentActivity: async (): Promise<Notification[]> => {
    try {
      console.log('[managerService] Fetching recent activity from /notifications/activity');
      const response = await api.get('/notifications/activity');
      const activities = response.data.activities || [];
      console.log('[managerService] Recent activity fetched successfully:', activities.length);
      return activities;
    } catch (error) {
      console.error('[managerService] Error fetching recent activity:', error);
      throw error;
    }
  },

  /**
   * Fetch all employees for current manager
   * Gets employees assigned to manager's departments
   */
  fetchEmployees: async (): Promise<Employee[]> => {
    try {
      console.log('[managerService] Fetching employees for current manager');
      
      // For now, get all users and filter - backend should implement department-based filtering
      const usersResponse = await api.get('/users/list');
      console.log('[managerService] Users response:', usersResponse.data);
      
      // Parse response - backend returns: { success: true, data: { users: [...], pagination: {...} } }
      let allUsers = [];
      if (usersResponse.data.data && usersResponse.data.data.users && Array.isArray(usersResponse.data.data.users)) {
        allUsers = usersResponse.data.data.users;
      } else if (usersResponse.data.users && Array.isArray(usersResponse.data.users)) {
        allUsers = usersResponse.data.users;
      } else if (usersResponse.data.data && Array.isArray(usersResponse.data.data)) {
        allUsers = usersResponse.data.data;
      } else if (Array.isArray(usersResponse.data)) {
        allUsers = usersResponse.data;
      }
      
      console.log('[managerService] Parsed users:', allUsers.length);
      
      // Filter employees (exclude superadmin=1, managers=2, hr=3)
      const employees = allUsers.filter((user: any) => 
        user.role_id !== 1 && user.role_id !== 2 && user.role_id !== 3
      );
      
      console.log('[managerService] Employees fetched successfully:', employees.length);
      return employees;
    } catch (error) {
      console.error('[managerService] Error fetching employees:', error);
      return []; // Return empty array instead of throwing
    }
  },

  /**
   * Fetch single KPI by ID
   */
  fetchKPIById: async (kpiId: number): Promise<any> => {
    try {
      console.log('[managerService] Fetching KPI with ID:', kpiId);
      const response = await api.get(`/kpis/${kpiId}`);
      const kpi = response.data.kpi || response.data.data;
      console.log('[managerService] KPI fetched successfully');
      return kpi;
    } catch (error) {
      console.error('[managerService] Error fetching KPI:', error);
      throw error;
    }
  },

  /**
   * Fetch employees by department and category
   */
  fetchEmployeesByCategory: async (
    department: string,
    category: string
  ): Promise<Employee[]> => {
    try {
      console.log('[managerService] Fetching employees by category:', { department, category });
      const response = await api.get(
        `/departments/statistics/${department}/${category}`
      );
      const employees = response.data.data?.employees || response.data.employees || [];
      console.log('[managerService] Employees by category fetched:', employees.length);
      return employees;
    } catch (error) {
      console.error('[managerService] Error fetching employees by category:', error);
      throw error;
    }
  },

  /**
   * Fetch manager's assigned departments
   */
  fetchManagerDepartments: async (): Promise<ManagerDepartment[]> => {
    try {
      console.log('[managerService] Fetching manager departments from /departments/manager-departments');
      const response = await api.get('/departments/manager-departments');
      console.log('[managerService] Departments response:', response.data);
      
      // Parse response - try multiple possible formats
      let departments = [];
      if (Array.isArray(response.data)) {
        departments = response.data;
      } else if (response.data.departments && Array.isArray(response.data.departments)) {
        departments = response.data.departments;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        departments = response.data.data;
      }
      
      console.log('[managerService] Manager departments fetched successfully:', departments.length);
      return departments;
    } catch (error) {
      console.error('[managerService] Error fetching manager departments:', error);
      return []; // Return empty array instead of throwing
    }
  },

  /**
   * Mark notification as read
   */
  markNotificationRead: async (id: number): Promise<void> => {
    try {
      console.log('[managerService] Marking notification as read:', id);
      await api.patch(`/notifications/${id}/read`);
      console.log('[managerService] Notification marked as read');
    } catch (error) {
      console.error('[managerService] Error marking notification as read:', error);
      throw error;
    }
  },

  /**
   * Fetch a specific employee by ID
   */
  fetchEmployeeById: async (employeeId: string): Promise<any> => {
    try {
      console.log('[managerService] Fetching employee with ID:', employeeId);
      const response = await api.get(`/users/list`);
      
      // Parse response - backend returns: { success: true, data: { users: [...], pagination: {...} } }
      let users = [];
      if (response.data.data && response.data.data.users && Array.isArray(response.data.data.users)) {
        users = response.data.data.users;
      } else if (response.data.users && Array.isArray(response.data.users)) {
        users = response.data.users;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        users = response.data.data;
      }
      
      const employee = users.find((u: any) => u.id === parseInt(employeeId));
      console.log('[managerService] Employee fetched successfully');
      return employee;
    } catch (error) {
      console.error('[managerService] Error fetching employee:', error);
      throw error;
    }
  },

  /**
   * Fetch KPIs for a specific employee
   */
  fetchEmployeeKPIs: async (employeeId: string): Promise<any[]> => {
    try {
      console.log('[managerService] Fetching KPIs for employee:', employeeId);
      const response = await api.get('/kpis');
      const allKPIs = response.data.data?.kpis || response.data.kpis || [];
      // Filter KPIs for this specific employee
      const filteredKPIs = allKPIs.filter((kpi: any) => kpi.employee_id === parseInt(employeeId));
      console.log('[managerService] Employee KPIs fetched:', filteredKPIs.length);
      return filteredKPIs;
    } catch (error) {
      console.error('[managerService] Error fetching employee KPIs:', error);
      throw error;
    }
  },
};
