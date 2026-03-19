import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, Investor } from '../types';
import { getAdminUser } from '../api/admin';
import { getInvestorUser } from '../api/investor';

interface AuthContextType {
  adminUser: User | null;
  investorUser: Investor | null;
  loading: boolean;
  setAdminUser: (user: User | null) => void;
  setInvestorUser: (user: Investor | null) => void;
  checkAdminAuth: () => Promise<void>;
  checkInvestorAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [investorUser, setInvestorUser] = useState<Investor | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAdminAuth = useCallback(async () => {
    try {
      const { data } = await getAdminUser();
      setAdminUser(data);
    } catch {
      setAdminUser(null);
    }
  }, []);

  const checkInvestorAuth = useCallback(async () => {
    try {
      const { data } = await getInvestorUser();
      setInvestorUser(data);
    } catch {
      setInvestorUser(null);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      // Only check the relevant auth based on current path to avoid session conflicts
      const path = window.location.pathname;
      if (path.startsWith('/investor')) {
        await checkInvestorAuth();
      } else {
        await checkAdminAuth();
      }
      setLoading(false);
    };
    init();
  }, [checkAdminAuth, checkInvestorAuth]);

  return (
    <AuthContext.Provider value={{ adminUser, investorUser, loading, setAdminUser, setInvestorUser, checkAdminAuth, checkInvestorAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
