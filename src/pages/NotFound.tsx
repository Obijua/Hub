import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, Home } from 'lucide-react';

export const NotFound = () => {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-20">
      <div className="max-w-md w-full text-center">
        {/* Animated Bridge Illustration */}
        <div className="mb-12 flex justify-center">
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="relative w-48 h-24"
          >
            <svg viewBox="0 0 100 50" className="w-full h-full">
              {/* Left Pillar */}
              <rect x="10" y="30" width="8" height="20" rx="2" fill="#1E3A8A" />
              {/* Right Pillar */}
              <rect x="82" y="30" width="8" height="20" rx="2" fill="#1E3A8A" />
              {/* Left Road */}
              <rect x="5" y="35" width="35" height="6" rx="3" fill="#1E3A8A" />
              {/* Right Road */}
              <rect x="60" y="35" width="35" height="6" rx="3" fill="#1E3A8A" />
              {/* Broken Gap */}
              <motion.path
                d="M40 35 Q50 45 60 35"
                fill="none"
                stroke="#1E3A8A"
                strokeWidth="2"
                strokeDasharray="4 4"
                initial={{ opacity: 0.3 }}
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              {/* Warning Sign */}
              <motion.g
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 5, repeat: Infinity }}
                style={{ transformOrigin: '50% 25%' }}
              >
                <path d="M50 10 L58 25 L42 25 Z" fill="#F59E0B" />
                <text x="49" y="22" fontSize="10" fontWeight="bold" fill="white">!</text>
              </motion.g>
            </svg>
          </motion.div>
        </div>

        <h1 className="text-8xl font-black text-primary mb-4 tracking-tighter">404</h1>
        <h2 className="text-3xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Opportunity Not Found
        </h2>
        <p className="text-gray-500 text-lg mb-10 leading-relaxed">
          This page may have been removed or the link is incorrect. 
          Don't worry — Hub & Jobs has plenty of other opportunities waiting for you!
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/blog"
            className="inline-flex items-center justify-center px-8 py-4 bg-primary text-white font-bold rounded-2xl hover:bg-blue-900 transition-all shadow-lg shadow-primary/20"
          >
            Browse Opportunities
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center px-8 py-4 bg-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-200 transition-all"
          >
            <Home className="mr-2 h-5 w-5" />
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
};
