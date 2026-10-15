import { useEffect, useState } from 'react';
import { db, auth } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { AdRenderer } from './ads/AdRenderer';

interface InArticleAdProps {
  position: number;
}

const InArticleAd = ({ position }: InArticleAdProps) => {
  const [adConfig, setAdConfig] = useState<any>(null);

  useEffect(() => {
    const fetchAdConfig = async () => {
      try {
        const snap = await getDoc(
          doc(db, 'settings', 'monetization')
        );
        if (snap.exists()) {
          setAdConfig(snap.data());
        }
      } catch (e) {
        console.error('Ad config error:', e);
      }
    };
    fetchAdConfig();
  }, []);

  if (!adConfig || !adConfig.masterSwitch || !adConfig.articleAdsEnabled) return null;
  if (adConfig.articleAdNetwork === 'Off') return null;

  const maxAds = Number(adConfig.articleMaxAds ?? adConfig.maxAdsPerArticle ?? 2);
  if (position > maxAds) {
    return null;
  }

  const isAdmin = !!(localStorage.getItem('cb_admin_session') || auth.currentUser);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  if (adConfig.hideAdsOnMobile && isMobile) {
    return null;
  }

  const code = adConfig.articleAdCode;
  const hasCode = code && typeof code === 'string' && code.trim() !== '';

  // For normal visitors, if no code exists, render nothing
  if (!hasCode && !isAdmin) {
    return null;
  }

  return (
    <div className="my-8 overflow-hidden">
      <div className="flex items-center justify-center space-x-4 mb-3">
        <div className="h-[1px] flex-1 bg-gray-100 dark:bg-gray-800"></div>
        <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Advertisement</span>
        <div className="h-[1px] flex-1 bg-gray-100 dark:bg-gray-800"></div>
      </div>

      <div className="flex justify-center min-h-[100px]">
        {hasCode ? (
          <AdRenderer adCode={code} className="w-full" />
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
              Advertisement (Slot {position})
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
    </div>
  );
};

export default InArticleAd;
