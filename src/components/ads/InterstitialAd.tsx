import React, { useEffect, useState } from 'react';
import { db, auth } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { MonetizationConfig } from '../../types';

export const InterstitialAd = () => {
  const [config, setConfig] = useState<MonetizationConfig | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'settings', 'monetization'));
        if (docSnap.exists()) {
          const data = docSnap.data() as MonetizationConfig;
          setConfig(data);
          
          const isAdmin = !!(localStorage.getItem('cb_admin_session') || auth.currentUser);
          const zoneConfig = data.zones?.['interstitial-popunder'];
          const adCode = zoneConfig?.adCode || '';
          const shouldShow = zoneConfig?.enabled && adCode.trim() !== '' &&
                            (!isAdmin || !data.hideAdsForAdmin);
          
          if (shouldShow) {
            const lastShown = sessionStorage.getItem('interstitial-last-shown');
            const now = Date.now();
            
            if (!lastShown || (now - parseInt(lastShown)) > 10 * 60 * 1000) {
              const container = document.createElement('div');
              container.id = 'interstitial-container';
              container.style.position = 'fixed';
              container.style.top = '0';
              container.style.left = '0';
              container.style.width = '100vw';
              container.style.height = '100vh';
              container.style.backgroundColor = 'rgba(0,0,0,0.5)';
              container.style.zIndex = '99999';
              container.style.display = 'flex';
              container.style.justifyContent = 'center';
              container.style.alignItems = 'center';

              const iframe = document.createElement('iframe');
              iframe.srcdoc = `<!DOCTYPE html><html><head><style>body{margin:0;display:flex;justify-content:center;align-items:center;background:#fff;}</style></head><body>${adCode}</body></html>`;
              iframe.style.width = '300px';
              iframe.style.height = '250px';
              iframe.style.border = 'none';
              iframe.sandbox.add('allow-scripts', 'allow-same-origin', 'allow-popups', 'allow-forms');

              const closeBtn = document.createElement('button');
              closeBtn.textContent = '✕ Close';
              closeBtn.style.position = 'absolute';
              closeBtn.style.top = '20px';
              closeBtn.style.right = '20px';
              closeBtn.style.padding = '8px 16px';
              closeBtn.style.background = '#fff';
              closeBtn.style.border = 'none';
              closeBtn.style.cursor = 'pointer';
              closeBtn.style.fontWeight = 'bold';
              closeBtn.onclick = () => container.remove();

              container.appendChild(iframe);
              container.appendChild(closeBtn);
              document.body.appendChild(container);
              
              sessionStorage.setItem('interstitial-last-shown', now.toString());
            }
          }
        }
      } catch (error) {
        console.error('Error fetching monetization config:', error);
      }
    };

    fetchConfig();
  }, []);

  return null;
};
