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
          
          const isAdmin = !!auth.currentUser;
          const shouldShow = data.zones['interstitial-popunder']?.enabled && 
                            (!isAdmin || !data.hideAdsForAdmin);
          
          if (shouldShow) {
            // Check if shown in this session
            const lastShown = sessionStorage.getItem('interstitial-last-shown');
            const now = Date.now();
            
            // Show every 10 minutes or once per session
            if (!lastShown || (now - parseInt(lastShown)) > 10 * 60 * 1000) {
              const container = document.createElement('div');
              container.id = 'interstitial-container';
              container.innerHTML = data.zones['interstitial-popunder'].adCode;
              
              // Execute scripts
              const scripts = container.getElementsByTagName('script');
              for (let i = 0; i < scripts.length; i++) {
                const s = document.createElement('script');
                const original = scripts[i];
                for (let j = 0; j < original.attributes.length; j++) {
                  const attr = original.attributes[j];
                  s.setAttribute(attr.name, attr.value);
                }
                s.textContent = original.textContent;
                document.body.appendChild(s);
              }
              
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
