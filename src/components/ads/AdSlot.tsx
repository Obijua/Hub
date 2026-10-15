import React, { useEffect, useState } from 'react';
import { db, auth } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { MonetizationConfig } from '../../types';
import { motion } from 'motion/react';
import { Layout } from 'lucide-react';
import { AdRenderer } from './AdRenderer';

interface AdSlotProps {
  zone: string;
  className?: string;
}

export const AdSlot: React.FC<AdSlotProps> = ({ zone, className = '' }) => {
  const [config, setConfig] = useState<MonetizationConfig | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'settings', 'monetization'));
        if (docSnap.exists()) {
          setConfig(docSnap.data() as MonetizationConfig);
        }
      } catch (error) {
        console.error('Error fetching monetization config:', error);
      }
    };

    fetchConfig();

    const checkAdmin = () => {
      const isAdminSession = localStorage.getItem('cb_admin_session');
      if (isAdminSession || auth.currentUser) {
        setIsAdmin(true); 
      }
    };
    checkAdmin();
  }, []);

  if (!config || !config.masterSwitch) return null;

  // Determine if we should show ads for this zone
  let zoneEnabled = false;
  let adNetwork = 'Off';
  let adCode = '';

  if (zone === 'post-detail-top' || zone === 'post-detail-bottom') {
    zoneEnabled = config.articleAdsEnabled;
    adNetwork = config.articleAdNetwork;
    adCode = config.articleAdCode;
    
    if (zone === 'post-detail-top' && !config.aboveArticleAdEnabled) zoneEnabled = false;
    if (zone === 'post-detail-bottom' && !config.belowArticleAdEnabled) zoneEnabled = false;
  } else if (zone === 'sidebar') {
    zoneEnabled = config.sidebarAdEnabled;
    adNetwork = config.articleAdNetwork;
    adCode = config.sidebarAdCode;
  } else if (zone.startsWith('homepage')) {
    zoneEnabled = config.homepageAdsEnabled;
    adNetwork = config.homepageAdNetwork;
    adCode = config.homepageAdCode;
    
    if (zone === 'homepage-hero-bottom') {
      zoneEnabled = config.heroAdEnabled;
      adCode = config.heroAdCode;
    }
  } else if (zone === 'between-posts') {
    zoneEnabled = config.blogAdsEnabled;
    adNetwork = config.articleAdNetwork;
    adCode = config.articleAdCode;
  } else {
    const legacyZone = config.zones?.[zone];
    zoneEnabled = legacyZone?.enabled || false;
    adCode = legacyZone?.adCode || '';
    adNetwork = legacyZone?.network || 'Custom Code';
  }

  const shouldHideOnMobile = config.hideAdsOnMobile && typeof window !== 'undefined' && window.innerWidth < 768;
  const isDesktopOnly = zone === 'sidebar';

  if (!zoneEnabled || adNetwork === 'Off') return null;
  if (shouldHideOnMobile) return null;
  if (isDesktopOnly && typeof window !== 'undefined' && window.innerWidth < 1024) return null;

  const hasCode = adCode && typeof adCode === 'string' && adCode.trim() !== '';

  // For normal visitors, if no code exists, render nothing
  if (!hasCode && !isAdmin) {
    return null;
  }

  // Admin Placeholder when no code exists
  if (isAdmin && (!hasCode || config.hideAdsForAdmin)) {
    return (
      <motion.div 
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`my-8 flex flex-col items-center ${className}`}
      >
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Advertisement Placeholder</span>
        <div className="w-full max-w-4xl min-h-[100px] border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-900/50">
          <Layout className="h-6 w-6 text-gray-300 mb-2" />
          <p className="text-sm font-bold text-gray-400 uppercase tracking-tight">Ad Zone: {String(zone).replace(/-/g, ' ')}</p>
          <p className="text-[10px] text-gray-400 mt-1 italic">{hasCode ? 'Ads are hidden for admins' : 'Ad space — configure in Admin → Monetization'}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`my-8 flex flex-col items-center overflow-hidden ${className}`}
    >
      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Advertisement</span>
      <AdRenderer adCode={adCode} className="w-full" />
    </motion.div>
  );
};
