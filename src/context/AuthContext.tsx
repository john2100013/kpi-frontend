import React, { createContext, useContext, useState, useEffect } from 'react';
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

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedCompanies = localStorage.getItem('companies');
    const storedSelectedCompany = localStorage.getItem('selectedCompany');

    // Load companies
    if (storedCompanies) {
      try {
        const parsedCompanies = JSON.parse(storedCompanies);
        setCompanies(parsedCompanies);
        setHasMultipleCompanies(parsedCompanies.length > 1);
      } catch (error) {
        console.error('Failed to parse companies:', error);
      }
    }

    // Load user
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        if (storedSelectedCompany) {
          setSelectedCompany(JSON.parse(storedSelectedCompany));
        }
      } catch (error) {
        console.error('Failed to parse user:', error);
      }
    }

    setIsLoading(false);
  }, []);

  const login = async (payrollNumber: string, password: string) => {
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
        localStorage.setItem('selectedCompany', JSON.stringify(primary));
      }
      
      localStorage.setItem('user', JSON.stringify(newUser));
      localStorage.setItem('companies', JSON.stringify(userCompanies || []));
      localStorage.setItem('passwordChangeRequired', passwordChangeRequired ? 'true' : 'false');
      
      return { hasMultipleCompanies: multiple || false, passwordChangeRequired: passwordChangeRequired || false };
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
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
        localStorage.setItem('selectedCompany', JSON.stringify(primary));
      }
      
      localStorage.setItem('user', JSON.stringify(newUser));
      localStorage.setItem('companies', JSON.stringify(userCompanies || []));
      localStorage.setItem('passwordChangeRequired', passwordChangeRequired ? 'true' : 'false');
      
      return { hasMultipleCompanies: multiple || false, passwordChangeRequired: passwordChangeRequired || false };
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  };

  const selectCompany = async (companyId: number) => {
    try {
      await api.post('/auth/select-company', { companyId });
      
      const company = companies.find(c => c.id === companyId);
      if (company) {
        setSelectedCompany(company);
        localStorage.setItem('selectedCompany', JSON.stringify(company));
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to select company');
    }
  };

const logout = async () => {
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
        console.warn('Fetch logout response:', response.status);
      }
    } catch (fetchError) {
      console.error('Both axios and fetch logout failed:', {
        axiosError: error.message,
        fetchError: (fetchError as Error).message,
      });
    }
  } finally {
    clearLocalState();
  }
};

const clearLocalState = () => {
  setUser(null);
  setCompanies([]);
  setHasMultipleCompanies(false);
  setSelectedCompany(null);
  localStorage.removeItem('user');
  localStorage.removeItem('companies');
  localStorage.removeItem('selectedCompany');
  localStorage.removeItem('passwordChangeRequired');
  clearAuthCookies();
  
  try {
    window.dispatchEvent(new Event('auth:logout'));
  } catch (e) {
    console.error('Failed to dispatch logout event:', e);
  }
};

  const updateUser = (updatedUser: User | null) => {
    setUser(updatedUser);
    if (updatedUser) {
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      companies,
      hasMultipleCompanies,
      selectedCompany,
      login, 
      loginWithEmail, 
      selectCompany,
      logout, 
      isLoading,
      setUser: updateUser
    }}>
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

