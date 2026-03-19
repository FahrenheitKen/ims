import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSettings } from '../api/admin';

interface AppSettings {
  appName: string;
  appLogo: string | null;
  logoUrl: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const SettingsContext = createContext<AppSettings>({
  appName: 'KAP IMS',
  appLogo: null,
  logoUrl: null,
  loading: true,
  refresh: async () => {},
});

const STORAGE_BASE = 'http://localhost:8000/storage/';

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appName, setAppName] = useState('KAP IMS');
  const [appLogo, setAppLogo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { data } = await getSettings();
      setAppName(data.app_name || 'KAP IMS');
      setAppLogo(data.app_logo || null);
    } catch {
      // Keep defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const logoUrl = appLogo ? `${STORAGE_BASE}${appLogo}` : null;

  return (
    <SettingsContext.Provider value={{ appName, appLogo, logoUrl, loading, refresh }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
