import { useEffect, useRef, useState } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface InArticleAdProps {
  position: number;
}

const InArticleAd = ({ position }: InArticleAdProps) => {
  const [adConfig, setAdConfig] = useState<any>(null);
  const adRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

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

  useEffect(() => {
    if (!adConfig || initialized.current || !adRef.current) 
      return;
    initialized.current = true;

    if (!adConfig.masterSwitch || !adConfig.articleAdsEnabled) return;

    const container = adRef.current;
    if (!container) return;

    const network = adConfig.articleAdNetwork;
    const code = adConfig.articleAdCode;

    if (network === 'Off' || !code?.trim()) return;

    const range = document.createRange();
    try {
      const fragment = range.createContextualFragment(code);
      container.innerHTML = '';
      container.appendChild(fragment);

      if (network === 'AdSense' || code.includes('adsbygoogle')) {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      }
    } catch (e) {
      console.error('Error injecting ad code:', e);
    }
  }, [adConfig]);

  if (!adConfig || !adConfig.masterSwitch || !adConfig.articleAdsEnabled) return null;
  
  if (adConfig.articleAdNetwork === 'Off') return null;

  // Check max ads limit set by admin
  const maxAds = Number(adConfig.articleMaxAds ?? adConfig.maxAdsPerArticle ?? 2);
  if (position > maxAds) {
    return null;
  }

  const isAdmin = !!localStorage.getItem('cb_admin_session');
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  if (adConfig.hideAdsForAdmin && isAdmin) {
    return (
      <div className="my-8 p-4 border-2 border-dashed border-amber-200 bg-amber-50/50 dark:bg-amber-900/10 dark:border-amber-900/20 rounded-2xl text-center">
        <p className="text-xs font-black text-amber-600 uppercase tracking-widest mb-1">📢 Ad Slot {position}</p>
        <p className="text-[10px] text-amber-500 font-medium">Ads are hidden for Admin. Visitors see real ads here.</p>
      </div>
    );
  }

  if (adConfig.hideAdsOnMobile && isMobile) {
    return null;
  }

  const code = adConfig.articleAdCode;
  const hasCode = code && typeof code === 'string' && code.trim() !== '';

  return (
    <div className="my-8 overflow-hidden">
      <div className="flex items-center justify-center space-x-4 mb-3">
        <div className="h-[1px] flex-1 bg-gray-100 dark:bg-gray-800"></div>
        <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Advertisement</span>
        <div className="h-[1px] flex-1 bg-gray-100 dark:bg-gray-800"></div>
      </div>

      <div className="flex justify-center min-h-[100px]">
        {hasCode ? (
          <div ref={adRef} className="w-full flex justify-center" />
        ) : (
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
        )}
        
        {adConfig.articleAdNetwork === 'AdSense' && !adConfig.articleAdCode && adConfig.adsensePublisherId && adConfig.adsenseInArticleSlot && (
          <ins
            className="adsbygoogle"
            style={{ display: 'block', textAlign: 'center', width: '100%' }}
            data-ad-layout="in-article"
            data-ad-format="fluid"
            data-ad-client={adConfig.adsensePublisherId}
            data-ad-slot={adConfig.adsenseInArticleSlot}
          />
        )}
      </div>
    </div>
  );
};

export default InArticleAd;
