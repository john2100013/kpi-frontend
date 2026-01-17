import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Company } from '../types/index';
import api from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  companies: Company[];
  hasMultipleCompanies: boolean;
  selectedCompany: Company | null;
  login: (payrollNumber: string, password: string) => Promise<{ hasMultipleCompanies: boolean; passwordChangeRequired: boolean }>;
  loginWithEmail: (email: string, password: string) => Promise<{ hasMultipleCompanies: boolean; passwordChangeRequired: boolean }>;
  selectCompany: (companyId: number) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [hasMultipleCompanies, setHasMultipleCompanies] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth data
    console.log('[AuthContext] 🔄 Initializing auth context...');
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    const storedCompanies = localStorage.getItem('companies');
    const storedSelectedCompany = localStorage.getItem('selectedCompany');

    console.log('[AuthContext] 💾 Stored token exists:', !!storedToken);
    console.log('[AuthContext] 💾 Stored user exists:', !!storedUser);
    console.log('[AuthContext] 💾 Stored companies:', storedCompanies);

    // Load companies first (independent of token validity)
    if (storedCompanies) {
      try {
        const parsedCompanies = JSON.parse(storedCompanies);
        console.log('[AuthContext] 🏢 Parsed companies from localStorage:', parsedCompanies);
        console.log('[AuthContext] 📊 Companies count from localStorage:', parsedCompanies.length);
        setCompanies(parsedCompanies);
        setHasMultipleCompanies(parsedCompanies.length > 1);
      } catch (error) {
        console.error('[AuthContext] ❌ Failed to parse companies from localStorage:', error);
      }
    } else {
      console.log('[AuthContext] ⚠️ No companies in localStorage');
    }

    // Load user and token if available
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      
      if (storedSelectedCompany) {
        setSelectedCompany(JSON.parse(storedSelectedCompany));
      }
    } else {
      console.log('[AuthContext] ⚠️ Token or user missing - user needs to authenticate');
    }

    setIsLoading(false);
  }, []);

  const login = async (payrollNumber: string, password: string) => {
    try {
      console.log('[AuthContext] 🔐 Login attempt with payroll:', payrollNumber);
      const response = await api.post('/auth/login', {
        payrollNumber,
        password,
        loginMethod: 'payroll'
      });

      console.log('[AuthContext] 📦 Login response received:', response.data);
      const { token: newToken, user: newUser, companies: userCompanies, hasMultipleCompanies: multiple, passwordChangeRequired } = response.data;

      console.log('[AuthContext] 🏢 Companies from response:', userCompanies);
      console.log('[AuthContext] 📊 Companies count:', userCompanies?.length || 0);
      console.log('[AuthContext] 🔀 Has multiple companies:', multiple);

      setToken(newToken);
      setUser(newUser);
      setCompanies(userCompanies || []);
      setHasMultipleCompanies(multiple || false);
      
      // Set selected company (primary or first)
      if (userCompanies && userCompanies.length > 0) {
        const primary = userCompanies.find((c: Company) => c.is_primary) || userCompanies[0];
        setSelectedCompany(primary);
        localStorage.setItem('selectedCompany', JSON.stringify(primary));
      }
      
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      localStorage.setItem('companies', JSON.stringify(userCompanies || []));
      localStorage.setItem('passwordChangeRequired', passwordChangeRequired ? 'true' : 'false');
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      return { hasMultipleCompanies: multiple || false, passwordChangeRequired: passwordChangeRequired || false };
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    try {
      console.log('[AuthContext] 🔐 Login attempt with email:', email);
      const response = await api.post('/auth/login', {
        email,
        password,
        loginMethod: 'email'
      });

      console.log('[AuthContext] 📦 Login response received:', response.data);
      const { token: newToken, user: newUser, companies: userCompanies, hasMultipleCompanies: multiple, passwordChangeRequired } = response.data;

      console.log('[AuthContext] 🏢 Companies from response:', userCompanies);
      console.log('[AuthContext] 📊 Companies count:', userCompanies?.length || 0);
      console.log('[AuthContext] 🔀 Has multiple companies:', multiple);

      setToken(newToken);
      setUser(newUser);
      setCompanies(userCompanies || []);
      setHasMultipleCompanies(multiple || false);
      
      // Set selected company (primary or first)
      if (userCompanies && userCompanies.length > 0) {
        const primary = userCompanies.find((c: Company) => c.is_primary) || userCompanies[0];
        setSelectedCompany(primary);
        localStorage.setItem('selectedCompany', JSON.stringify(primary));
      }
      
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      localStorage.setItem('companies', JSON.stringify(userCompanies || []));
      localStorage.setItem('passwordChangeRequired', passwordChangeRequired ? 'true' : 'false');
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      return { hasMultipleCompanies: multiple || false, passwordChangeRequired: passwordChangeRequired || false };
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  };

  const selectCompany = async (companyId: number) => {
    try {
      const response = await api.post('/auth/select-company', { companyId });
      const { token: newToken } = response.data;
      
      setToken(newToken);
      const company = companies.find(c => c.id === companyId);
      if (company) {
        setSelectedCompany(company);
        localStorage.setItem('selectedCompany', JSON.stringify(company));
      }
      
      localStorage.setItem('token', newToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to select company');
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setCompanies([]);
    setHasMultipleCompanies(false);
    setSelectedCompany(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('companies');
    localStorage.removeItem('selectedCompany');
    delete api.defaults.headers.common['Authorization'];
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
      token, 
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

