import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { SiteConfig } from '../types';

interface SiteConfigContextType {
  config: SiteConfig | null;
  loading: boolean;
}

const SiteConfigContext = createContext<SiteConfigContextType>({
  config: null,
  loading: true,
});

export const useSiteConfig = () => useContext(SiteConfigContext);

export const SiteConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial fetch
    const fetchConfig = async () => {
      try {
        const docRef = doc(db, 'settings', 'siteConfig');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setConfig(docSnap.data() as SiteConfig);
        }
      } catch (error) {
        console.error('Error fetching site config:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();

    // Listen for real-time updates
    const unsubscribe = onSnapshot(doc(db, 'settings', 'siteConfig'), (doc) => {
      if (doc.exists()) {
        setConfig(doc.data() as SiteConfig);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <SiteConfigContext.Provider value={{ config, loading }}>
      {children}
    </SiteConfigContext.Provider>
  );
};
