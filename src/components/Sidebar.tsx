import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Users, 
  TrendingUp, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

import { AdSlot } from './ads/AdSlot';
import AdUnit from './AdUnit';

export const Sidebar = () => {
  const [docPrices, setDocPrices] = useState<any>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'documents'), (doc) => {
      if (doc.exists()) {
        setDocPrices(doc.data());
      }
    });
    return () => unsub();
  }, []);

  return (
    <div className="space-y-4">
      <AdSlot zone="sidebar" />
      <AdUnit slot="sidebar" />

      {/* 1. Community Stats Card — NOT sticky, scrolls away */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm"
      >
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-primary/10 rounded-2xl">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <h3 className="text-sm font-black text-gray-900 dark:text-white">🇳🇬 Our Community</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600 dark:text-gray-400 text-xs font-medium">Active Jobs</span>
            </div>
            <span className="font-black text-primary dark:text-blue-400 text-xs">1,240+</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-1 h-6 bg-accent rounded-full"></div>
              <span className="text-gray-600 dark:text-gray-400 text-xs font-medium">Scholarships</span>
            </div>
            <span className="font-black text-primary dark:text-blue-400 text-xs">450+</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-1 h-6 bg-green-500 rounded-full"></div>
              <span className="text-gray-600 dark:text-gray-400 text-xs font-medium">Free Courses</span>
            </div>
            <span className="font-black text-primary dark:text-blue-400 text-xs">800+</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-800">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-gray-500">Daily Updates</span>
            <span className="flex items-center text-green-500 font-bold">
              <TrendingUp className="h-3 w-3 mr-1" />
              Live
            </span>
          </div>
        </div>
      </motion.div>

      {/* 2. Document Promotion Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden group"
      >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <FileText className="h-16 w-16 rotate-12" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center space-x-2 mb-3">
              <Sparkles className="h-4 w-4 text-yellow-200" />
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-100">Premium Tools</span>
            </div>
            
            <h3 className="text-lg font-black mb-1 leading-tight">Professional Documents</h3>
            <p className="text-amber-50 text-xs mb-4 opacity-90">Get hired faster with expert-crafted documents.</p>
            
            <div className="space-y-2 mb-6">
              <div className="flex items-center justify-between p-2.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                <span className="text-xs font-bold">Professional CV</span>
                <span className="font-black text-xs">₦{docPrices?.cvPrice || '1,500'}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                <span className="text-xs font-bold">Business Proposal</span>
                <span className="font-black text-xs">₦{docPrices?.proposalPrice || '2,500'}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                <span className="text-xs font-bold">Business Plan</span>
                <span className="font-black text-xs">₦{docPrices?.planPrice || '5,000'}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-amber-900/20 backdrop-blur-md rounded-2xl border border-amber-300/30">
                <span className="text-xs font-bold">Startup Bundle ✨</span>
                <span className="font-black text-xs">₦{docPrices?.bundlePrice || '7,500'}</span>
              </div>
            </div>
            
            <Link 
              to="/documents"
              className="w-full bg-white text-amber-600 font-black py-3 rounded-2xl flex items-center justify-center space-x-2 hover:bg-amber-50 transition-all shadow-md text-sm"
            >
              <span>Build My Document ✨</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>
    </div>
  );
};
