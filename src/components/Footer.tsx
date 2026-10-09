import { 
  Briefcase, 
  Twitter, 
  Linkedin, 
  Instagram, 
  MessageCircle, 
  Send, 
  Mail,
  ArrowRight,
  Facebook,
  Youtube,
  Music2,
  Share2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { CategoryConfig, SiteConfig, SocialLinks } from '../types';

export const Footer = () => {
  return (
    <footer className="bg-[#0a0a0a] text-white py-16 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12 text-center md:text-left">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-baseline justify-center md:justify-start gap-0">
              <span className="font-black text-white text-2xl tracking-tight" style={{fontFamily: "Montserrat, sans-serif"}}>Hub</span>
              <span className="font-black text-amber-400 text-2xl mx-0.5 tracking-tight">&amp;</span>
              <span className="font-black text-white text-2xl tracking-tight" style={{fontFamily: "Montserrat, sans-serif"}}>Jobs</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs mx-auto md:mx-0">
              Nigeria's #1 hub for jobs, scholarships, free courses, internships and opportunities.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col gap-4">
            <h3 className="font-black text-white uppercase tracking-widest text-xs">Quick Links</h3>
            <div className="flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-2 text-sm font-medium text-gray-400">
              <Link to="/about" className="hover:text-white transition-colors">About Us</Link>
              <Link to="/contact" className="hover:text-white transition-colors">Contact us</Link>
              <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="/disclaimer" className="hover:text-white transition-colors">Disclaimer</Link>
            </div>
          </div>

          {/* Sitemap */}
          <div className="space-y-4">
            <h3 className="font-black text-white uppercase tracking-widest text-xs">Sitemap</h3>
            <p className="text-sm text-gray-400">
              View our sitemap at <a href="https://hubandjobs.com/sitemap.xml" className="text-amber-400 font-bold hover:underline">hubandjobs.com</a>
            </p>
          </div>
        </div>
        
        <div className="pt-8 border-t border-white/5 text-center">
          <p className="text-sm text-gray-500">© 2026 Hub & Jobs. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
