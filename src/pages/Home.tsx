import React, { useState, useEffect, useRef } from 'react';
import { Post, Category, CategoryConfig, SiteConfig, MonetizationConfig } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  Calendar, 
  Briefcase, 
  TrendingUp, 
  Search, 
  GraduationCap, 
  BookOpen, 
  Ticket, 
  Building2, 
  Star,
  Clock,
  ChevronRight,
  Mail,
  Send,
  Music2,
  Facebook,
  Youtube,
  MessageCircle,
  Twitter,
  Linkedin,
  Instagram
} from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'motion/react';
import { getAllPosts, subscribe } from '../lib/posts';
import { cn } from '../lib/utils';
import { collection, query, orderBy, limit, onSnapshot, where, doc, getDocs, addDoc, serverTimestamp, startAfter } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { AdSlot } from '../components/ads/AdSlot';
import { toast } from 'sonner';
import { sendWelcomeEmail } from '../lib/email';
import { trackEvent } from '../lib/analytics';
import AdUnit from '../components/AdUnit';

import { PostCard } from '../components/PostCard';
import { Sidebar } from '../components/Sidebar';
import { Sparkles, X as CloseIcon, FileText } from 'lucide-react';

const MobileDocPromo = React.forwardRef<HTMLDivElement, { prices: any }>(({ prices }, ref) => (
  <div ref={ref} className="lg:hidden my-6 p-4 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl text-white shadow-lg">
    <div className="flex items-center space-x-2 mb-2">
      <Sparkles className="h-3 w-3 text-yellow-200" />
      <span className="text-[9px] font-black uppercase tracking-widest">Premium Tools</span>
    </div>
    <h3 className="text-base font-black mb-1">Professional Documents</h3>
    <p className="text-amber-50 text-[10px] mb-3 opacity-90">Get hired faster with expert CVs and Plans.</p>
    <div className="grid grid-cols-2 gap-2 mb-3">
      <div className="p-1.5 bg-white/10 rounded-lg text-center">
        <div className="text-[9px] opacity-80">CV</div>
        <div className="font-black text-xs">₦{prices?.cvPrice || '1,500'}</div>
      </div>
      <div className="p-1.5 bg-white/10 rounded-lg text-center">
        <div className="text-[9px] opacity-80">Plan</div>
        <div className="font-black text-xs">₦{prices?.planPrice || '5,000'}</div>
      </div>
    </div>
    <Link to="/documents" className="block w-full bg-white text-amber-600 text-center font-black py-2.5 rounded-xl text-xs">
      Build My Document ✨
    </Link>
  </div>
));

const MobilePopup = ({ prices }: { prices: any }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const hasSeen = sessionStorage.getItem('mobile_doc_popup_seen');
    if (hasSeen) return;

    const handleScroll = () => {
      if (window.scrollY > 600 && !isVisible && !isDismissed) {
        setIsVisible(true);
        sessionStorage.setItem('mobile_doc_popup_seen', 'true');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isVisible, isDismissed]);

  if (!isVisible || isDismissed) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] p-2 lg:hidden">
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        className="bg-white rounded-t-xl shadow-[0_-10px_40px_-12px_rgba(0,0,0,0.3)] p-4 relative"
      >
        {/* Drag Handle */}
        <div className="w-8 h-1 bg-gray-200 rounded-full mx-auto mb-4"></div>
        
        <button 
          onClick={() => setIsDismissed(true)}
          className="absolute top-3 right-3 p-1.5 bg-gray-50 rounded-full text-gray-400"
        >
          <CloseIcon className="h-4 w-4" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="p-3 bg-amber-50 rounded-xl">
            <FileText className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h3 className="text-base font-black text-gray-900">Need a Professional CV?</h3>
            <p className="text-xs text-gray-500">Stand out from the crowd today!</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="p-2 bg-gray-50 rounded-xl text-center">
            <div className="text-[9px] text-gray-400 font-bold uppercase">CV</div>
            <div className="font-black text-primary text-sm">₦{prices?.cvPrice || '1,500'}</div>
          </div>
          <div className="p-2 bg-gray-50 rounded-xl text-center">
            <div className="text-[9px] text-gray-400 font-bold uppercase">Plan</div>
            <div className="font-black text-primary text-sm">₦{prices?.planPrice || '5,000'}</div>
          </div>
          <div className="p-2 bg-gray-50 rounded-xl text-center">
            <div className="text-[9px] text-gray-400 font-bold uppercase">Bundle</div>
            <div className="font-black text-primary text-sm">₦{prices?.bundlePrice || '7,500'}</div>
          </div>
        </div>

        <Link 
          to="/documents"
          className="w-full bg-primary text-white font-black py-3 rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-primary/20 text-sm"
        >
          <span>Build My Document ✨</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </motion.div>
    </div>
  );
};

import InArticleAd from '../components/InArticleAd';

const SkeletonCard = () => (
  <div className="rounded-2xl p-3.5 md:p-5 border border-gray-100 bg-white space-y-2.5 md:space-y-3 animate-pulse">
    <div className="h-3 md:h-4 bg-gray-100 rounded-full w-16"/>
    <div className="h-4 md:h-6 bg-gray-100 rounded-full w-full"/>
    <div className="h-4 md:h-6 bg-gray-100 rounded-full w-3/4"/>
    <div className="space-y-1.5 md:space-y-2">
      <div className="h-2.5 md:h-3 bg-gray-100 rounded-full"/>
      <div className="h-2.5 md:h-3 bg-gray-100 rounded-full w-4/5"/>
      <div className="h-2.5 md:h-3 bg-gray-100 rounded-full w-3/5"/>
    </div>
    <div className="h-8 md:h-10 bg-gray-100 rounded-xl"/>
  </div>
);

export const Home = () => {
  const [featuredPosts, setFeaturedPosts] = useState<Post[]>([]);
  const [latestPosts, setLatestPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<CategoryConfig[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [monetization, setMonetization] = useState<MonetizationConfig | null>(null);
  const [docPrices, setDocPrices] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const navigate = useNavigate();
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch profile if logged in
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        onSnapshot(doc(db, 'profiles', user.uid), (doc) => {
          if (doc.exists()) setProfile(doc.data());
        });
      } else {
        setProfile(null);
      }
    });

    // Fetch doc prices
    const unsubDocs = onSnapshot(doc(db, 'settings', 'documents'), (doc) => {
      if (doc.exists()) setDocPrices(doc.data());
    });

    // Fetch monetization config
    const unsubMonetization = onSnapshot(doc(db, 'settings', 'monetization'), (doc) => {
      if (doc.exists()) setMonetization(doc.data() as MonetizationConfig);
    });

    // Fetch active categories
    const catQuery = query(
      collection(db, 'categories'), 
      where('isActive', '==', true),
      orderBy('displayOrder', 'asc')
    );
    const unsubCategories = onSnapshot(catQuery, (snap) => {
      setCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as CategoryConfig)));
    });

    // Fetch category counts
    const fetchCounts = async () => {
      const counts: Record<string, number> = {};
      const postsSnap = await getDocs(query(collection(db, 'posts'), where('isActive', '==', true)));
      postsSnap.docs.forEach(doc => {
        const cat = doc.data().category;
        counts[cat] = (counts[cat] || 0) + 1;
      });
      setCategoryCounts(counts);
    };
    fetchCounts();

    // Fetch site config
    const unsubSite = onSnapshot(doc(db, 'settings', 'siteConfig'), (doc) => {
      if (doc.exists()) setSiteConfig(doc.data() as SiteConfig);
    });

    // Initial fetch for posts
    const initialQuery = query(
      collection(db, 'posts'),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc'),
      limit(12)
    );

    const unsubPosts = onSnapshot(initialQuery, (snap) => {
      const posts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
      setLatestPosts(posts);
      setLastDoc(snap.docs[snap.docs.length - 1]);
      setHasMore(snap.docs.length === 12);
      setLoading(false);
    });

    // Featured posts
    const featuredQuery = query(
      collection(db, 'posts'),
      where('isActive', '==', true),
      where('isFeatured', '==', true),
      orderBy('createdAt', 'desc'),
      limit(6)
    );
    const unsubFeatured = onSnapshot(featuredQuery, (snap) => {
      setFeaturedPosts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post)));
    });

    return () => {
      unsubAuth();
      unsubCategories();
      unsubSite();
      unsubDocs();
      unsubMonetization();
      unsubPosts();
      unsubFeatured();
    };
  }, []);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, lastDoc]);

  const loadMore = async () => {
    if (!lastDoc || loadingMore) return;
    setLoadingMore(true);
    try {
      const nextQuery = query(
        collection(db, 'posts'),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limit(12)
      );
      const snap = await getDocs(nextQuery);
      const newPosts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
      setLatestPosts(prev => [...prev, ...newPosts]);
      setLastDoc(snap.docs[snap.docs.length - 1]);
      setHasMore(snap.docs.length === 12);
    } catch (e) {
      console.error('Load more error:', e);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery?.trim()) {
      navigate(`/blog?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="h-64 bg-primary/10 animate-pulse mb-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8">
              <div className="grid grid-cols-2 gap-2.5 md:gap-4 px-3 lg:px-0">
                {Array.from({ length: 12 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            </div>
            <div className="lg:col-span-4 space-y-6">
              <div className="h-64 bg-white rounded-2xl animate-pulse border border-gray-100" />
              <div className="h-40 bg-white rounded-2xl animate-pulse border border-gray-100" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isJobCategory = (category: string): boolean => {
    if (!category) return false;
    const cat = category.toLowerCase().trim();
    if (cat === 'blog') return false; 
    return (
      cat === 'job' || cat === 'jobs' ||
      cat === 'internship' || cat === 'internships' ||
      cat.includes('job') || cat.includes('internship')
    );
  };

  const jobPosts = latestPosts.filter(p => isJobCategory(p.category)).slice(0, 5);
  
  const displayCategories = [
    { name: 'Technology', count: '124+', slug: 'technology', color: 'text-primary' },
    { name: 'Finance', count: '86+', slug: 'finance', color: 'text-primary' },
    { name: 'Marketing', count: '42+', slug: 'marketing', color: 'text-primary' },
    { name: 'Design', count: '31+', slug: 'design', color: 'text-primary' },
    { name: 'Sales', count: '59+', slug: 'sales', color: 'text-primary' },
    { name: 'Engineering', count: '72+', slug: 'engineering', color: 'text-primary' },
  ];

  return (
    <div className="min-h-screen bg-gray-50/30 pb-24">
      {/* 1. HEADER SECTION */}
      <div className="bg-white px-6 pt-10 pb-16 rounded-b-2xl shadow-sm">
        <div className="max-w-2xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              Good evening, {profile?.fullName?.split(' ')[0] || 'User'} 👋
            </h1>
          </motion.div>
          <p className="text-gray-400 font-bold mt-1 text-sm">Find your dream job today</p>

          <form onSubmit={handleSearch} className="mt-8 relative group">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
              <Search size={22} />
            </div>
            <input 
              type="text"
              placeholder="Search for jobs, companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-5 bg-white border border-gray-100 rounded-2xl shadow-xl shadow-gray-200/50 outline-none focus:ring-2 focus:ring-primary/20 transition-all text-base font-semibold"
            />
          </form>

          {/* STATS CARDS */}
          <div className="mt-10 grid grid-cols-3 gap-3">
            {[
              { label: 'JOBS', value: '12', active: false },
              { label: 'APPLIED', value: '0', active: false },
              { label: 'INTERVIEWS', value: '0', active: false },
            ].map((stat) => (
              <div key={stat.label} className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center shadow-sm">
                <span className="text-[10px] font-black text-gray-400 tracking-widest">{stat.label}</span>
                <span className="text-2xl font-black text-primary mt-1">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 mt-12 space-y-12">
        {/* 2. RECENT OPPORTUNITIES (Simplified Feed) */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Recent Opportunities</h2>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Live Updates</span>
            </div>
          </div>
          
          <div className="space-y-6">
            {latestPosts.length > 0 ? (
              <>
                {latestPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}

                {hasMore && (
                  <div className="pt-8 pb-12 flex justify-center">
                    <button 
                      onClick={loadMore}
                      disabled={loadingMore}
                      className="px-12 py-5 bg-white border border-gray-100 rounded-2xl text-primary font-black text-xs uppercase tracking-widest shadow-xl shadow-gray-200/50 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {loadingMore ? 'Loading...' : 'Load More Opportunities'}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-2xl p-12 border-2 border-dashed border-gray-100 text-center">
                <p className="text-gray-400 font-bold text-xs uppercase tracking-widest leading-loose">
                  No opportunities found<br/>Check back later
                </p>
              </div>
            )}
          </div>
        </section>

        {/* 4. RECOMMENDED COURSES */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-gray-900 tracking-tight">Recommended Courses</h2>
            <Link to="/blog" className="text-primary font-black text-[10px] tracking-widest uppercase flex items-center">
              EXPLORE ALL <ArrowRight size={14} className="ml-1" />
            </Link>
          </div>
          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-4">
              <GraduationCap size={32} />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Enhance Your Skills</h3>
            <p className="text-gray-400 text-sm font-medium mb-6">Check out our curated list of professional courses to boost your career.</p>
            <button className="px-8 py-3 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
              Browse Courses
            </button>
          </div>
        </section>

        <AdSlot zone="homepage-hero-bottom" />
      </div>

      {/* MOBILE POPUP */}
      <MobilePopup prices={docPrices} />
    </div>
  );
};
