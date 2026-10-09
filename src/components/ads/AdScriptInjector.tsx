import { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { MonetizationConfig } from '../../types';

export const AdScriptInjector = () => {
  const [config, setConfig] = useState<MonetizationConfig | null>(null);

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

  useEffect(() => {
    if (!config) return;

    const head = document.head;

    // Helper to inject script fragments
    const injectFragment = (id: string, html: string) => {
      if (!html || document.getElementById(id)) return;
      const container = document.createElement('div');
      container.id = id;
      container.style.display = 'none';
      document.body.appendChild(container);
      
      const range = document.createRange();
      const fragment = range.createContextualFragment(html);
      container.appendChild(fragment);
    };

    // Adsterra Social Bar
    if (config.adsterraEnabled && config.adsterraSocialBarCode) {
      injectFragment('adsterra-social-bar', config.adsterraSocialBarCode);
    }

    // Adsterra Popunder
    if (config.adsterraEnabled && config.adsterraPopunderCode) {
      injectFragment('adsterra-popunder', config.adsterraPopunderCode);
    }

    // Monetag In-Page Push
    if (config.monetagEnabled && config.monetagInPagePushCode) {
      injectFragment('monetag-in-page-push', config.monetagInPagePushCode);
    }

    // Monetag Push Notifications
    if (config.monetagEnabled && config.monetagPushNotificationsEnabled && config.monetagSiteId) {
      const pushId = 'monetag-push-notif';
      if (!document.getElementById(pushId)) {
        const script = document.createElement('script');
        script.id = pushId;
        script.src = `https://growthpush.com/js/push.js?site=${config.monetagSiteId}`;
        script.async = true;
        head.appendChild(script);
      }
    }

    // AdSense Global Script (Auto Ads)
    if (config.adsenseEnabled && config.adsensePublisherId) {
      const adsenseId = 'adsense-global';
      if (!document.getElementById(adsenseId)) {
        const script = document.createElement('script');
        script.id = adsenseId;
        script.async = true;
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${config.adsensePublisherId}`;
        script.crossOrigin = 'anonymous';
        head.appendChild(script);
      }
    }

    // AdsTarget Global Script
    if (config.adsTargetGlobalScript) {
      injectFragment('adstarget-global', config.adsTargetGlobalScript);
    }
  }, [config]);

  return null;
};
