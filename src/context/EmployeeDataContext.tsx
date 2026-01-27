import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { isEmployee } from '../utils/roleUtils';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchKPIsAndReviews, selectAllKPIs, selectAllReviews, selectKPILoading } from '../store/slices/kpiSlice';
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
  const dispatch = useAppDispatch();
  
  // Get data from Redux store
  const kpis = useAppSelector(selectAllKPIs);
  const reviews = useAppSelector(selectAllReviews);
  const loading = useAppSelector(selectKPILoading);
  
  const [sharedDepartmentFeatures, setSharedDepartmentFeatures] = useState<any>(null);
  const [dataFetched, setDataFetched] = useState(false);
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
      
      try {
        // Dispatch Redux action to fetch KPIs and reviews (single combined call)
        await dispatch(fetchKPIsAndReviews()).unwrap();
        
        // Fetch department features separately (only once)
        const deptFeaturesRes = await api.get('/department-features/my-department');
        setSharedDepartmentFeatures(deptFeaturesRes.data);
        setDataFetched(true);
      } catch (error) {
        setDataFetched(false);
      } finally {
        fetchingRef.current = false;
      }
    }
  }, [user, dataFetched, dispatch]);

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
        sharedKpis: kpis,
        sharedReviews: reviews,
        sharedDepartmentFeatures,
        dataFetched,
        isLoading: loading,
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
