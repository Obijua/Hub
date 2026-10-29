import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { MonetizationConfig } from '../types';
import { AdRenderer } from './ads/AdRenderer';
import { useAuth } from './AuthProvider';

interface AdUnitProps {
  slot: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal';
  className?: string;
  responsive?: boolean;
  label?: string;
}

const AdUnit = ({ 
  slot, 
  className = '',
  label = 'Advertisement'
}: AdUnitProps) => {
  const [adConfig, setAdConfig] = useState<MonetizationConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEmpty, setIsEmpty] = useState(false);
  const { profile } = useAuth();

  useEffect(() => {
    const fetchAdConfig = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'monetization'));
        if (snap.exists()) {
          setAdConfig(snap.data() as MonetizationConfig);
        }
      } catch (e) {
        console.error('Ad config error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchAdConfig();
  }, []);

  if (loading) return null;
  if (!adConfig || !adConfig.masterSwitch) return null;

  if (slot === 'pre_footer') {
    return null;
  }

  // Determine ad code based on slot
  let adCode = '';
  if (slot.includes('article') || slot.includes('detail') || slot.includes('footer')) {
    adCode = adConfig.articleAdCode || adConfig.zones?.[slot]?.adCode || '';
  } else if (slot.includes('sidebar')) {
    adCode = adConfig.sidebarAdCode || adConfig.zones?.[slot]?.adCode || '';
  } else if (slot.includes('homepage') || slot.includes('home')) {
    adCode = adConfig.homepageAdCode || adConfig.zones?.[slot]?.adCode || adConfig.articleAdCode || '';
  } else {
    adCode = adConfig.zones?.[slot]?.adCode || adConfig.articleAdCode || '';
  }

  const hasCode = adCode && typeof adCode === 'string' && adCode.trim() !== '';

  if (!hasCode) {
    return null;
  }

  return (
    <div 
      className={`ad-container ${isEmpty ? '' : 'my-4'} ${className}`}
      style={isEmpty ? { display: 'none' } : undefined}
    >
      {!isEmpty && (
        <p className="text-[10px] text-gray-400 text-center mb-1 uppercase tracking-widest font-bold">
          {label}
        </p>
      )}
      <AdRenderer adCode={adCode} className="w-full" onEmpty={setIsEmpty} />
    </div>
  );
};

export default AdUnit;
