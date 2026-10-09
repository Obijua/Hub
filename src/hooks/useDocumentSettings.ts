import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export const useDocumentSettings = () => {
  const [settings, setSettings] = useState({
    pricing: {
      cv: 2000,
      proposal: 2000,
      businessPlan: 3000,
      startupBundle: 5000,
      coverLetter: 500,
      showOriginalPrice: true,
      discountBadge: true,
      badgeText: '50% OFF'
    },
    availability: {
      cv: true,
      proposal: true,
      businessPlan: true,
      startupBundle: true,
      coverLetter: true,
      masterToggle: true
    },
    payment: {
      paystackPublicKey: '',
      paystackSecretKey: '',
      testMode: true,
      successMessage: 'Payment successful! Your document is ready.',
      failureMessage: 'Payment failed. Please try again.'
    },
    appearance: {
      pageTitle: 'Professional Document Builder',
      pageSubtitle: 'Create high-quality professional documents in minutes with AI assistance.',
      cvBadge: 'Popular',
      proposalBadge: 'New',
      businessPlanBadge: 'Best Value',
      hideAllBadges: false,
      blurIntensity: 5,
      visiblePercentage: 30
    },
    ai: {
      enabled: true,
      geminiApiKey: '',
      dailyLimitPerUser: 5
    },
    notifications: {
      notifyOnPurchase: true,
      adminEmail: '',
      whatsappSupport: '',
      supportButtonText: 'Chat with Support'
    },
    referral: {
      enabled: true,
      rewardAmount: 500,
      cookieDuration: 30
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Use onSnapshot for real-time updates
    const unsub = onSnapshot(doc(db, 'settings', 'documents'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setSettings(prev => ({ 
          ...prev, 
          ...data 
        }));
      }
      setLoading(false);
    }, (error) => {
      console.error('Settings error:', error);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  return { settings, loading };
};
