import React, { useEffect, useState } from 'react';
import { db, auth } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { MonetizationConfig } from '../../types';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AdRenderer } from './AdRenderer';

export const FloatingAd = () => {
  const [config, setConfig] = useState<MonetizationConfig | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'settings', 'monetization'));
        if (docSnap.exists()) {
          const data = docSnap.data() as MonetizationConfig;
          setConfig(data);
          
          const isMobile = window.innerWidth < 768;
          const isAdmin = !!(localStorage.getItem('cb_admin_session') || auth.currentUser);
          const adCode = data.zones?.['floating-sticky']?.adCode || '';
          const shouldShow = data.zones?.['floating-sticky']?.enabled && 
                            isMobile && 
                            (isAdmin || adCode.trim() !== '') &&
                            (!isAdmin || !data.hideAdsForAdmin);
          
          if (shouldShow) {
            setIsVisible(true);
          }
        }
      } catch (error) {
        console.error('Error fetching monetization config:', error);
      }
    };

    fetchConfig();
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    setTimeout(() => {
      setIsDismissed(false);
      setIsVisible(true);
    }, 5 * 60 * 1000);
  };

  if (!isVisible || isDismissed || !config) return null;
  const adCode = config.zones?.['floating-sticky']?.adCode || '';
  if (!adCode.trim()) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        exit={{ y: 100 }}
        className="fixed bottom-0 left-0 right-0 z-[100] bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shadow-2xl p-2 flex flex-col items-center"
      >
        <button 
          onClick={handleDismiss}
          className="absolute -top-10 right-4 p-2 bg-white dark:bg-gray-900 rounded-full shadow-lg border border-gray-100 dark:border-gray-800 text-gray-500"
        >
          <X className="h-4 w-4" />
        </button>
        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Advertisement</span>
        <div className="w-full max-w-md flex justify-center overflow-hidden">
          <AdRenderer adCode={adCode} className="w-full" />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
