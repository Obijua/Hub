import { useEffect, useRef, useState } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { MonetizationConfig } from '../types';

interface AdUnitProps {
  slot: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal';
  className?: string;
  responsive?: boolean;
  label?: string;
}

const AdUnit = ({ 
  slot, 
  format = 'auto',
  className = '',
  responsive = true,
  label = 'Advertisement'
}: AdUnitProps) => {
  const [adConfig, setAdConfig] = useState<MonetizationConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const adRef = useRef<HTMLModElement>(null);
  const initialized = useRef(false);

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

  useEffect(() => {
    if (!adConfig || initialized.current || !adConfig.masterSwitch) return;
    const clientId = adConfig.adsensePublisherId;
    if (!clientId || !slot) return;

    const pushAd = () => {
      if (initialized.current) return;
      if (!adRef.current || adRef.current.offsetWidth === 0) return;
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
        initialized.current = true;
      } catch (e) {
        console.error('AdSense error:', e);
      }
    };

    const checkWidth = () => {
      if (adRef.current && adRef.current.offsetWidth >= 120) {
        pushAd();
        return true;
      }
      return false;
    };

    if (checkWidth()) return;

    const observer = new ResizeObserver(() => {
      if (checkWidth()) observer.disconnect();
    });

    if (adRef.current) observer.observe(adRef.current);

    const timeout = setTimeout(() => {
      if (!initialized.current) checkWidth();
      observer.disconnect();
    }, 3000);

    return () => {
      observer.disconnect();
      clearTimeout(timeout);
    };
  }, [adConfig]);

  // Still loading from Firestore
  if (loading) return null;

  // Ads are disabled globally
  if (!adConfig || !adConfig.masterSwitch) return null;

  const clientId = adConfig.adsensePublisherId;

  // Ads enabled but no credentials yet — show placeholder
  if (!clientId || !slot) {
    return (
      <div
        className={`my-4 ${className}`}
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
          gap: '6px'
        }}
      >
        <p style={{
          fontSize: '10px',
          color: '#94a3b8',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          fontWeight: 700
        }}>
          {label}
        </p>
        <p style={{
          fontSize: '11px',
          color: '#cbd5e1',
          fontStyle: 'italic'
        }}>
          Ad space — configure in Admin → Monetization
        </p>
      </div>
    );
  }

  // Real AdSense ad
  return (
    <div className={`ad-container my-4 ${className}`}>
      <p className="text-[10px] text-gray-400 text-center mb-1 uppercase tracking-widest">
        {label}
      </p>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={clientId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive.toString()}
      />
    </div>
  );
};

export default AdUnit;
