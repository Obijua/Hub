import React, { useState, useEffect } from 'react';
import { ArrowUp, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { SocialLinks } from '../types';

export const FloatingActions = () => {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [telegramUrl, setTelegramUrl] = useState('https://t.me/your_channel');
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);

    // Fetch telegram link
    const unsub = onSnapshot(doc(db, 'settings', 'socialLinks'), (doc) => {
      if (doc.exists()) {
        const data = doc.data() as SocialLinks;
        if (data.telegram) {
          setTelegramUrl(data.telegram.url);
          setIsVisible(data.telegram.isActive);
        }
      }
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      unsub();
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <div className="fixed bottom-6 left-6 z-[100]">
        <AnimatePresence>
          {isVisible && (
            <motion.a
              initial={{ opacity: 0, scale: 0.8, x: -20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: -20 }}
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 p-2.5 bg-[#0088cc] text-white rounded-2xl shadow-lg hover:bg-[#0077b5] transition-all group"
              aria-label="Join Telegram"
            >
              <Send className="h-5 w-5" />
              <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 font-bold whitespace-nowrap text-xs">
                Join our Telegram
              </span>
            </motion.a>
          )}
        </AnimatePresence>
      </div>

      <div className="fixed bottom-6 right-6 z-[100]">
        <AnimatePresence>
          {showBackToTop && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              onClick={scrollToTop}
              className="p-3 bg-primary text-white rounded-2xl shadow-xl hover:bg-blue-900 transition-all border border-white/20"
              aria-label="Back to top"
            >
              <ArrowUp className="h-5 w-5" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};
