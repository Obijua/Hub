import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { BannerConfig } from '../types';
import { X, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const AnnouncementBanner = () => {
  const [banner, setBanner] = useState<BannerConfig | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'banner'), (doc) => {
      if (doc.exists()) {
        const data = doc.data() as BannerConfig;
        
        // Check if enabled and not expired
        const now = new Date();
        const isExpired = data.expiryDate && data.expiryDate.toDate() < now;
        
        if (data.isEnabled && !isExpired) {
          setBanner(data);
          // Reset visibility if it's a new banner or enabled
          setIsVisible(true);
        } else {
          setBanner(null);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  if (!banner || !isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="relative z-[60] overflow-hidden"
        style={{ backgroundColor: banner.bgColor, color: banner.textColor }}
      >
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-center text-center space-y-2 sm:space-y-0 sm:space-x-4">
            <p className="text-sm font-bold tracking-tight">
              {banner.message}
            </p>
            {banner.link && (
              <a 
                href={banner.link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center px-4 py-1 bg-white/20 rounded-full text-xs font-black hover:bg-white/30 transition-all"
              >
                {banner.linkLabel}
                <ExternalLink className="ml-1.5 h-3 w-3" />
              </a>
            )}
            <button 
              onClick={() => setIsVisible(false)}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-black/10 rounded-lg transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
