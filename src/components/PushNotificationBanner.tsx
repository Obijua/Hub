import { useState, useEffect } from 'react';
import { getToken } from 'firebase/messaging';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { messaging, db } from '../lib/firebase';
import { toast } from 'sonner';

const PushNotificationBanner = () => {
  const [show, setShow] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('push_dismissed');
    const alreadySubscribed = localStorage.getItem('push_subscribed');
    if (!dismissed && !alreadySubscribed && 'Notification' in window) {
      setTimeout(() => setShow(true), 3000);
    }
    if (alreadySubscribed) setSubscribed(true);
  }, []);

  const subscribe = async () => {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      toast.error(
        'Your browser does not support notifications. ' +
        'Try Chrome or Firefox.'
      );
      return;
    }

    // Check if already denied
    if (Notification.permission === 'denied') {
      toast.error(
        '🔕 Notifications are blocked. To enable: ' +
        'tap the 🔒 lock icon in your browser address bar → ' +
        'Notifications → Allow, then refresh the page.'
      );
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const token = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
        });
        if (token) {
          await addDoc(collection(db, 'push_subscribers'), {
            token,
            subscribedAt: serverTimestamp(),
            platform: navigator.platform,
            userAgent: navigator.userAgent.slice(0, 100)
          });
          localStorage.setItem('push_subscribed', 'true');
          setSubscribed(true);
          setShow(false);
          toast.success('🔔 You will now get alerts for new opportunities!');
        }
      } else if (permission === 'denied') {
        toast.error(
          '🔕 You blocked notifications. To re-enable: ' +
          'go to browser Settings → Site Settings → ' +
          'Notifications → find this site → Allow.'
        );
      } else {
        // permission === 'default' (dismissed without choosing)
        toast.info('Please tap Allow when the browser asks.');
      }
    } catch (err: any) {
      toast.error('Could not request permission: ' + err.message);
    }
  };

  const dismiss = () => {
    localStorage.setItem('push_dismissed', 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 
      md:left-auto md:right-4 md:max-w-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl 
        shadow-2xl border border-gray-100 dark:border-gray-800 
        p-5 flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🔔</span>
          <div>
            <p className="font-black text-gray-900 
              dark:text-white text-sm">
              Get instant job alerts!
            </p>
            <p className="text-gray-500 text-xs mt-0.5">
              Be the first to know when new opportunities 
              are posted. Free, cancel anytime.
            </p>
          </div>
          <button onClick={dismiss}
            className="text-gray-400 hover:text-gray-600 
              ml-auto flex-shrink-0">
            ✕
          </button>
        </div>
        <div className="flex gap-2">
          <button onClick={subscribe}
            className="flex-1 py-2.5 bg-primary text-white 
              font-black rounded-xl text-sm hover:bg-blue-900 
              transition-all">
            Enable Alerts
          </button>
          <button onClick={dismiss}
            className="px-4 py-2.5 bg-gray-100 text-gray-500 
              font-black rounded-xl text-sm hover:bg-gray-200">
            Later
          </button>
        </div>
      </div>
    </div>
  );
};

export default PushNotificationBanner;
