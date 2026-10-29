import React, { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { MonetizationConfig } from '../../types';
import { motion } from 'motion/react';
import { AdRenderer } from './AdRenderer';
import { useAuth } from '../AuthProvider';

interface AdSlotProps {
  zone: string;
  className?: string;
}

export const AdSlot: React.FC<AdSlotProps> = ({ zone, className = '' }) => {
  const [config, setConfig] = useState<MonetizationConfig | null>(null);
  const [isEmpty, setIsEmpty] = useState(false);
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

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
  }, []);

  if (!config || !config.masterSwitch) return null;

  // Determine if we should show ads for this zone
  let zoneEnabled = false;
  let adNetwork = 'Off';
  let adCode = '';

  if (zone === 'between-posts') {
    zoneEnabled = !!config.masterSwitch && config.blogAdsEnabled !== false;
    adCode = config.zones?.['between-posts']?.adCode || config.articleAdCode || '';
    adNetwork = config.zones?.['between-posts']?.network || config.articleAdNetwork || 'Custom Code';
  } else if (zone === 'homepage-hero-bottom') {
    zoneEnabled = !!config.heroAdEnabled;
    adCode = config.heroAdCode || '';
    adNetwork = config.homepageAdNetwork || 'Custom Code';
  } else if (zone === 'sidebar') {
    zoneEnabled = !!config.sidebarAdEnabled;
    adCode = config.sidebarAdCode || '';
    adNetwork = config.articleAdNetwork || 'Custom Code';
  } else if (zone === 'navbar-banner-after' || zone === 'before-footer') {
    zoneEnabled = !!config.masterSwitch;
    adCode = config.zones?.[zone]?.adCode || '';
    adNetwork = config.zones?.[zone]?.network || 'Custom Code';
  } else if (zone === 'post-detail-top' || zone === 'post-detail-bottom') {
    zoneEnabled = config.articleAdsEnabled;
    adNetwork = config.articleAdNetwork;
    adCode = config.articleAdCode;
    
    if (zone === 'post-detail-top' && !config.aboveArticleAdEnabled) zoneEnabled = false;
    if (zone === 'post-detail-bottom' && !config.belowArticleAdEnabled) zoneEnabled = false;
  } else if (zone.startsWith('homepage')) {
    zoneEnabled = config.homepageAdsEnabled;
    adNetwork = config.homepageAdNetwork;
    adCode = config.homepageAdCode;
    
    if (zone === 'homepage-hero-bottom') {
      zoneEnabled = config.heroAdEnabled;
      adCode = config.heroAdCode;
    }
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

  if (!hasCode) {
    return null;
  }

  return (
    <motion.div 
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`${isEmpty ? '' : 'my-8'} flex flex-col items-center overflow-hidden ${className}`}
      style={isEmpty ? { display: 'none' } : undefined}
    >
      {!isEmpty && (
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Advertisement</span>
      )}
      <AdRenderer adCode={adCode} className="w-full" onEmpty={setIsEmpty} />
    </motion.div>
  );
};
