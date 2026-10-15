import { useEffect, useState } from 'react';
import { db, auth } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { MonetizationConfig } from '../types';
import { AdRenderer } from './ads/AdRenderer';

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

  const isAdmin = !!(localStorage.getItem('cb_admin_session') || auth.currentUser);

  // Determine ad code based on slot
  let adCode = '';
  if (slot.includes('article') || slot.includes('detail') || slot.includes('footer')) {
    adCode = adConfig.articleAdCode || adConfig.zones?.[slot]?.adCode || '';
  } else if (slot.includes('sidebar')) {
    adCode = adConfig.sidebarAdCode || adConfig.zones?.[slot]?.adCode || '';
  } else if (slot.includes('homepage') || slot.includes('home')) {
    adCode = adConfig.homepageAdCode || adConfig.zones?.[slot]?.adCode || '';
  } else {
    adCode = adConfig.zones?.[slot]?.adCode || adConfig.articleAdCode || '';
  }

  const hasCode = adCode && typeof adCode === 'string' && adCode.trim() !== '';

  // For normal visitors, if no code exists, render nothing
  if (!hasCode && !isAdmin) {
    return null;
  }

  return (
    <div className={`ad-container my-4 ${className}`}>
      <p className="text-[10px] text-gray-400 text-center mb-1 uppercase tracking-widest font-bold">
        {label}
      </p>
      {hasCode ? (
        <AdRenderer adCode={adCode} className="w-full" />
      ) : isAdmin ? (
        <div
          style={{
            border: '2px dashed #cbd5e1',
            borderRadius: '4px',
            padding: '20px',
            textAlign: 'center',
            backgroundColor: '#f8fafc',
            minHeight: '100px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            width: '100%'
          }}
        >
          <p style={{
            fontSize: '10px',
            color: '#94a3b8',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontWeight: 700,
            margin: 0
          }}>
            {label} ({slot})
          </p>
          <p style={{
            fontSize: '11px',
            color: '#cbd5e1',
            fontStyle: 'italic',
            margin: 0
          }}>
            Ad space — configure in Admin → Monetization
          </p>
        </div>
      ) : null}
    </div>
  );
};

export default AdUnit;
