/**
 * Manager API Services
 */

import api from '../../../services/api';
import { Employee, ManagerDepartment } from '../types';
import { KPIReview, Notification } from '../../../types';

const toast = typeof window !== 'undefined' && window.toast ? window.toast : null;

export const managerService = {
  /**
   * Fetch KPI reviews
   */
  fetchReviews: async (): Promise<KPIReview[]> => {
    try {

      const response = await api.get('/kpi-review');
      const reviews = response.data.reviews || [];

      return reviews;
    } catch (error) {
      if (toast) toast.error('Server error. Please try reloading or try later.');
      throw error;
    }
  },

  /**
   * Fetch unread notifications for manager
   */
  fetchNotifications: async (limit: number = 5): Promise<Notification[]> => {
    try {

      const response = await api.get('/notifications', { 
        params: { limit, read: 'false' } 
      });
      const notifications = response.data.notifications || [];

      return notifications;
    } catch (error) {
      if (toast) toast.error('Server error. Please try reloading or try later.');
      throw error;
    }
  },

  /**
   * Fetch recent activity
   */
  fetchRecentActivity: async (): Promise<Notification[]> => {
    try {

      const response = await api.get('/notifications/activity');
      const activities = response.data.activities || [];

      return activities;
    } catch (error) {
      if (toast) toast.error('Server error. Please try reloading or try later.');
      throw error;
    }
  },

  /**
   * Fetch all employees for current manager
   * Backend automatically filters to show only employees in departments assigned to this manager
   * via manager_departments table
   */
  fetchEmployees: async (): Promise<Employee[]> => {
    try {
      // Backend /users/list endpoint automatically filters employees by manager's departments
      // when request comes from a manager role (checks manager_departments table)
      const usersResponse = await api.get('/users/list');
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

      // Filter employees (exclude superadmin=1, managers=2, hr=3)
      const employees = allUsers.filter((user: any) => 
        user.role_id !== 1 && user.role_id !== 2 && user.role_id !== 3
      );

      return employees;
    } catch (error) {
      if (toast) toast.error('Server error. Please try reloading or try later.');
      return []; // Return empty array instead of throwing
    }
  },

  /**
   * Fetch single KPI by ID
   */
  fetchKPIById: async (kpiId: number): Promise<any> => {
    try {

      const response = await api.get(`/kpis/${kpiId}`);
      const kpi = response.data.kpi || response.data.data;

      return kpi;
    } catch (error) {
      if (toast) toast.error('Server error. Please try reloading or try later.');
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

      const response = await api.get(
        `/departments/statistics/${department}/${category}`
      );
      const employees = response.data.data?.employees || response.data.employees || [];

      return employees;
    } catch (error) {
      if (toast) toast.error('Server error. Please try reloading or try later.');
      throw error;
    }
  },

  /**
   * Fetch KPIs by department and category
   */
  fetchKPIsByCategory: async (
    department: string,
    category: string,
    period?: string
  ): Promise<any[]> => {
    try {
      const params = period ? { period } : {};
      const response = await api.get(
        `/departments/kpis/${department}/${category}`,
        { params }
      );
      
      // Backend returns { success: true, data: { kpis: [...] } }
      const kpis = response.data.data?.kpis || response.data.kpis || [];
      return kpis;
    } catch (error) {
      if (toast) toast.error('Server error. Please try reloading or try later.');
      return [];
    }
  },

  /**
   * Fetch recent KPIs (Setting Completed + Reviews Completed) for dashboard card
   */
  fetchRecentKPIs: async (limit: number = 10): Promise<any[]> => {
    try {
      const response = await api.get('/departments/recent-kpis', { 
        params: { limit } 
      });
      const kpis = response.data.data?.kpis || response.data.kpis || [];
      return kpis;
    } catch (error) {
      if (toast) toast.error('Server error. Please try reloading or try later.');
      return [];
    }
  },

  /**
   * Fetch manager's assigned departments
   */
  fetchManagerDepartments: async (): Promise<ManagerDepartment[]> => {
    try {
   

      const response = await api.get('/departments/manager-departments');

   
      
      // Parse response - try multiple possible formats
      let departments = [];
      if (Array.isArray(response.data)) {
        departments = response.data;
      } else if (response.data.departments && Array.isArray(response.data.departments)) {
        departments = response.data.departments;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        departments = response.data.data;
      } else if (response.data.data && response.data.data.departments && Array.isArray(response.data.data.departments)) {
        departments = response.data.data.departments;
      }
      

      return departments;
    } catch (error) {
      if (toast) toast.error('Server error. Please try reloading or try later.');
      return []; // Return empty array instead of throwing
    }
  },

  /**
   * Mark notification as read
   */
  markNotificationRead: async (id: number): Promise<void> => {
    try {

      await api.patch(`/notifications/${id}/read`);

    } catch (error) {
      if (toast) toast.error('Server error. Please try reloading or try later.');
      throw error;
    }
  },

  /**
   * Fetch a specific employee by ID
   */
  fetchEmployeeById: async (employeeId: string): Promise<any> => {
    try {

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

      return employee;
    } catch (error) {
      if (toast) toast.error('Server error. Please try reloading or try later.');
      throw error;
    }
  },

  /**
   * Fetch KPIs for a specific employee
   */
  fetchEmployeeKPIs: async (employeeId: string): Promise<any[]> => {
    try {
      
      const response = await api.get('/kpis');
      const allKPIs = response.data.data?.kpis || response.data.kpis || [];
      const employeeIdNum = parseInt(employeeId);
      const filteredKPIs = allKPIs.filter((kpi: any) => {
        const kpiEmployeeId = typeof kpi.employee_user_id === 'string' 
          ? parseInt(kpi.employee_user_id) 
          : kpi.employee_user_id;
        return kpiEmployeeId === employeeIdNum;
      });
      
      return filteredKPIs;
    } catch (error) {
      if (toast) toast.error('Server error. Please try reloading or try later.');
      return [];
    }
  },
};
