import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { isEmployee } from '../utils/roleUtils';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchKPIsAndReviews, selectAllKPIs, selectAllReviews, selectKPILoading } from '../store/slices/kpiSlice';
import api from '../services/api';
import { KPI, KPIReview } from '../types';

interface EmployeeDataContextType {
  sharedKpis: KPI[];
  sharedReviews: KPIReview[];
  sharedDepartmentFeatures: any;
  dataFetched: boolean;
  loading: boolean;
  refetch: () => void;
}

const EmployeeDataContext = createContext<EmployeeDataContextType | undefined>(undefined);

export const EmployeeDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sharedKpis, setSharedKpis] = useState<KPI[]>([]);
  const [sharedReviews, setSharedReviews] = useState<KPIReview[]>([]);
  const [sharedDepartmentFeatures, setSharedDepartmentFeatures] = useState<any>(null);
  const [dataFetched, setDataFetched] = useState(false);
  const [loading, setLoading] = useState(true);
  const hasFetchedRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    try {
      setLoading(true);

      const [kpisRes, reviewsRes, featuresRes] = await Promise.all([
        api.get('/kpis', { signal }),
        api.get('/kpi-review', { signal }),
        api.get('/department-features/my-department', { signal }),
      ]);

      setSharedKpis(kpisRes?.data?.data?.kpis || []);
      setSharedReviews(reviewsRes.data.reviews || []);
      setSharedDepartmentFeatures(featuresRes.data);
      setDataFetched(true);
      hasFetchedRef.current = true;
    } catch (error) {
        setDataFetched(false);
    } finally {
      setLoading(false);
    }
  };

  // Track user ID changes to prevent refetch on same user object recreation
  useEffect(() => {
    if (hasFetchedRef.current) {
      return;
    }
    fetchData();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const refetch = () => {
    hasFetchedRef.current = false;
    fetchData();
  };

  return (
    <EmployeeDataContext.Provider
      value={{
        sharedKpis: kpis,
        sharedReviews: reviews,
        sharedDepartmentFeatures,
        dataFetched,
        loading,
        refetch,
      }}
    >
      {children}
    </EmployeeDataContext.Provider>
  );
};

export const useEmployeeData = () => {
  const context = useContext(EmployeeDataContext);
  if (!context) {
    throw new Error('useEmployeeData must be used within EmployeeDataProvider');
  }
  return context;
};
