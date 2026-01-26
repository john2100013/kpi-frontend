import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { isEmployee } from '../utils/roleUtils';

interface EmployeeDataContextType {
  sharedKpis: any[];
  sharedReviews: any[];
  sharedDepartmentFeatures: any | null;
  dataFetched: boolean;
  isLoading: boolean;
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

  useEffect(() => {
    const fetchSharedData = async () => {
      if (isEmployee(user) && !dataFetched && !fetchingRef.current) {
        fetchingRef.current = true;
        setIsLoading(true);
        
        try {
          const token = localStorage.getItem('token');
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
          
          
          const [kpisRes, reviewsRes, deptFeaturesRes] = await Promise.all([
            fetch(`${apiUrl}/kpis`, {
              headers: { Authorization: `Bearer ${token}` }
            }),
            fetch(`${apiUrl}/kpi-review`, {
              headers: { Authorization: `Bearer ${token}` }
            }),
            fetch(`${apiUrl}/department-features/my-department`, {
              headers: { Authorization: `Bearer ${token}` }
            })
          ]);

          const kpisData = await kpisRes.json();
          const reviewsData = await reviewsRes.json();
          const deptFeaturesData = await deptFeaturesRes.json();

         

          const kpis = kpisData.data?.kpis || kpisData.kpis || [];
          const reviews = reviewsData.reviews || [];

          

          setSharedKpis(kpis);
          setSharedReviews(reviews);
          setSharedDepartmentFeatures(deptFeaturesData);
          setDataFetched(true);
        } catch (error) {
          fetchingRef.current = false;
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchSharedData();
  }, [user]);

  return (
    <EmployeeDataContext.Provider
      value={{
        sharedKpis,
        sharedReviews,
        sharedDepartmentFeatures,
        dataFetched,
        isLoading,
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
