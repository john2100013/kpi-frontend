import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { User, Company } from '../types/index';
import api, { clearAuthCookies } from '../services/api';

interface AuthContextType {
  user: User | null;
  companies: Company[];
  hasMultipleCompanies: boolean;
  selectedCompany: Company | null;
  login: (payrollNumber: string, password: string) => Promise<{ hasMultipleCompanies: boolean; passwordChangeRequired: boolean }>;
  loginWithEmail: (email: string, password: string) => Promise<{ hasMultipleCompanies: boolean; passwordChangeRequired: boolean }>;
  selectCompany: (companyId: number) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [hasMultipleCompanies, setHasMultipleCompanies] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Auth initialization is now handled by Redux (initializeAuth in App.tsx)
  // AuthContext just manages local state that syncs from Redux via App.tsx
  useEffect(() => {
    setIsLoading(false);
  }, []);

  const login = useCallback(async (payrollNumber: string, password: string) => {
    try {
      const response = await api.post('/auth/login', {
        payrollNumber,
        password,
        loginMethod: 'payroll'
      });

      const { user: newUser, companies: userCompanies, hasMultipleCompanies: multiple, passwordChangeRequired } = response.data;

      setUser(newUser);
      setCompanies(userCompanies || []);
      setHasMultipleCompanies(multiple || false);
      
      // Set selected company (primary or first)
      if (userCompanies && userCompanies.length > 0) {
        const primary = userCompanies.find((c: Company) => c.is_primary) || userCompanies[0];
        setSelectedCompany(primary);
      }
      
      return { hasMultipleCompanies: multiple || false, passwordChangeRequired: passwordChangeRequired || false };
    } catch (error: any) {
      
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  }, [companies]);

  const loginWithEmail = useCallback(async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
        loginMethod: 'email'
      });

      const { user: newUser, companies: userCompanies, hasMultipleCompanies: multiple, passwordChangeRequired } = response.data;

      setUser(newUser);
      setCompanies(userCompanies || []);
      setHasMultipleCompanies(multiple || false);
      
      // Set selected company (primary or first)
      if (userCompanies && userCompanies.length > 0) {
        const primary = userCompanies.find((c: Company) => c.is_primary) || userCompanies[0];
        setSelectedCompany(primary);
      }
      
      return { hasMultipleCompanies: multiple || false, passwordChangeRequired: passwordChangeRequired || false };
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  }, [companies]);

  const selectCompany = useCallback(async (companyId: number) => {
    try {
      await api.post('/auth/select-company', { companyId });
      
      const company = companies.find(c => c.id === companyId);
      if (company) {
        setSelectedCompany(company);
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to select company');
    }
  }, [companies]);

  const logout = useCallback(async () => {
  try {
    // Try with axios first
    await api.post('/auth/logout');
  } catch (error: any) {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
      const response = await fetch(`${apiUrl}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        // Silently handle logout response - user will be logged out anyway
      }
    } catch (fetchError) {
      // Silently handle logout errors - user will be logged out anyway
    }
  } finally {
    clearLocalState();
  }
  }, []);

  const clearLocalState = useCallback(() => {
  setUser(null);
  setCompanies([]);
  setHasMultipleCompanies(false);
  setSelectedCompany(null);
  clearAuthCookies();
  
  try {
    window.dispatchEvent(new Event('auth:logout'));
  } catch (e) {
    // Silently handle event dispatch error
  }
  }, []);

  const updateUser = useCallback((updatedUser: User | null) => {
    setUser(updatedUser);
  }, []);

  const contextValue = useMemo(
    () => ({
      user,
      companies,
      hasMultipleCompanies,
      selectedCompany,
      login,
      loginWithEmail,
      selectCompany,
      logout,
      isLoading,
      setUser: updateUser,
    }),
    [user, companies, hasMultipleCompanies, selectedCompany, login, loginWithEmail, selectCompany, logout, isLoading, updateUser]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

