import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { isEmployee } from '../utils/roleUtils';
import api from '../services/api';

interface EmployeeDataContextType {
  sharedKpis: any[];
  sharedReviews: any[];
  sharedDepartmentFeatures: any | null;
  dataFetched: boolean;
  isLoading: boolean;
  refreshData: () => Promise<void>;
}

const EmployeeDataContext = createContext<EmployeeDataContextType | undefined>(undefined);

export const EmployeeDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [sharedKpis, setSharedKpis] = useState<any[]>([]);
  const [sharedReviews, setSharedReviews] = useState<any[]>([]);
  const [sharedDepartmentFeatures, setSharedDepartmentFeatures] = useState<any>(null);
  const [dataFetched, setDataFetched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fetchingRef = useRef(false);
  const userIdRef = useRef(user?.id);

  // Memoize fetchSharedData to prevent unnecessary re-creation
  const fetchSharedData = useCallback(async (forceRefresh = false) => {
    if (isEmployee(user) && !fetchingRef.current) {
      // Skip if data already fetched and not forcing refresh
      if (!forceRefresh && dataFetched) {
        return;
      }
      
      fetchingRef.current = true;
      setIsLoading(true);
      
      try {
        const [kpisRes, reviewsRes, deptFeaturesRes] = await Promise.all([
          api.get('/kpis'),
          api.get('/kpi-review'),
          api.get('/department-features/my-department')
        ]);

        const kpis = kpisRes.data.data?.kpis || kpisRes.data.kpis || [];
        const reviews = reviewsRes.data.reviews || [];

        setSharedKpis(kpis);
        setSharedReviews(reviews);
        setSharedDepartmentFeatures(deptFeaturesRes.data);
        setDataFetched(true);
      } catch (error) {
        setDataFetched(false);
      } finally {
        setIsLoading(false);
        fetchingRef.current = false;
      }
    }
  }, [user, dataFetched]);

  const refreshData = async () => {
    setDataFetched(false);
    fetchingRef.current = false;
    await fetchSharedData(true);
  };

  // Track user ID changes to prevent refetch on same user object recreation
  useEffect(() => {
    const currentUserId = user?.id;
    
    // Only fetch if user ID changed or data not yet fetched
    if (currentUserId && currentUserId !== userIdRef.current) {
      userIdRef.current = currentUserId;
      setDataFetched(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!dataFetched && user) {
      fetchSharedData();
    }
  }, [dataFetched, user, fetchSharedData]);

  return (
    <EmployeeDataContext.Provider
      value={{
        sharedKpis,
        sharedReviews,
        sharedDepartmentFeatures,
        dataFetched,
        isLoading,
        refreshData,
      }}
    >
      {children}
    </EmployeeDataContext.Provider>
  );
};

export const useEmployeeData = () => {
  const context = useContext(EmployeeDataContext);
  if (context === undefined) {
    throw new Error('useEmployeeData must be used within EmployeeDataProvider');
  }
  return context;
};
