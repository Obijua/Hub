import React, { useState, useEffect, useMemo } from 'react';
import { Post, Category, CategoryConfig } from '../types';
import { useSearchParams, Link } from 'react-router-dom';
import { Briefcase, Search, Filter, SlidersHorizontal, ChevronDown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getAllPosts } from '../lib/posts';
import { cn } from '../lib/utils';
import { PostCard } from '../components/PostCard';
import { AdSlot } from '../components/ads/AdSlot';
import AdUnit from '../components/AdUnit';
import { db } from '../lib/firebase';
import { doc, getDoc, getDocs, query, collection, where, orderBy, onSnapshot } from 'firebase/firestore';
import { MonetizationConfig } from '../types';

import { Sidebar } from '../components/Sidebar';
import { Sparkles, X as CloseIcon, FileText, ArrowRight } from 'lucide-react';

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

export const Blog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<CategoryConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'deadline'>('newest');
  const [visibleCount, setVisibleCount] = useState(12);
  const [monetization, setMonetization] = useState<MonetizationConfig | null>(null);
  const [docPrices, setDocPrices] = useState<any>(null);
  
  const categoryFilter = searchParams.get('category');
  const searchParam = searchParams.get('search') || '';

  useEffect(() => {
    const unsubDocs = onSnapshot(doc(db, 'settings', 'documents'), (doc) => {
      if (doc.exists()) setDocPrices(doc.data());
    });
    return () => unsubDocs();
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const q = query(
          collection(db, 'categories'),
          where('isActive', '==', true),
          orderBy('displayOrder', 'asc')
        );
        const snap = await getDocs(q);
        setCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as CategoryConfig)));
      } catch (error) {
        console.error('Error fetching categories:', error);
        // Fallback to basic categories if fetch fails
        setCategories([]);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const unsubMonetization = onSnapshot(doc(db, 'settings', 'monetization'), (doc) => {
      if (doc.exists()) setMonetization(doc.data() as MonetizationConfig);
    });
    return () => unsubMonetization();
  }, []);

  useEffect(() => {
    if (searchParam) {
      setSearchTerm(searchParam);
    }
  }, [searchParam]);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const fetchedPosts = await getAllPosts({ 
          category: categoryFilter || undefined,
          limitCount: 100 // Fetch a larger batch for client-side filtering/sorting
        });
        setPosts(fetchedPosts || []);
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [categoryFilter]);

  const filteredAndSortedPosts = useMemo(() => {
    let result = [...posts];

    // Client-side Search
    if (searchTerm) {
      result = result.filter(post => 
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0);
      }
      if (sortBy === 'oldest') {
        return (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0);
      }
      if (sortBy === 'deadline') {
        const dateA = a.deadline?.toMillis?.() || Infinity;
        const dateB = b.deadline?.toMillis?.() || Infinity;
        return dateA - dateB;
      }
      return 0;
    });

    return result;
  }, [posts, searchTerm, sortBy]);

  const handleCategoryClick = (category: string | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (category) {
      newParams.set('category', category);
    } else {
      newParams.delete('category');
    }
    setSearchParams(newParams);
    setVisibleCount(12);
  };

  const clearFilters = () => {
    setSearchParams({});
    setSearchTerm('');
    setSortBy('newest');
    setVisibleCount(12);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header Section */}
      <div className="bg-primary text-white pt-16 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="max-w-xl">
              <h1 className="text-4xl font-extrabold tracking-tight mb-4">Explore Opportunities</h1>
              <p className="text-blue-100 text-lg">
                Find the latest jobs, scholarships, and courses tailored to your career path.
              </p>
            </div>
            
            <div className="relative w-full md:w-96">
              <div className="flex p-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-200" />
                <input
                  type="text"
                  placeholder="Search opportunities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 text-white bg-transparent outline-none placeholder-blue-200"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="p-2 text-blue-200 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10">
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Categories */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleCategoryClick(null)}
                className={cn(
                  "px-5 py-2 rounded-2xl text-sm font-bold transition-all",
                  !categoryFilter ? "bg-primary text-white shadow-lg" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.slug)}
                  className={cn(
                    "px-5 py-2 rounded-2xl text-sm font-bold transition-all capitalize",
                    categoryFilter === cat.slug ? "bg-primary text-white shadow-lg" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Sort & Stats */}
            <div className="flex items-center justify-between lg:justify-end gap-4 border-t lg:border-t-0 pt-4 lg:pt-0">
              <div className="flex items-center text-sm text-gray-500">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                <span className="font-medium mr-2">Sort by:</span>
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent font-bold text-gray-900 outline-none cursor-pointer hover:text-primary transition-colors"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="deadline">Closest Deadline</option>
                </select>
              </div>
              
              <div className="text-sm font-bold text-primary bg-blue-50 px-4 py-2 rounded-2xl">
                {filteredAndSortedPosts.length} Results
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="animate-pulse bg-white rounded-2xl aspect-[16/10] w-full shadow-sm border border-gray-100"></div>
                ))}
              </div>
            ) : filteredAndSortedPosts.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <AnimatePresence mode="popLayout">
                    {filteredAndSortedPosts.slice(0, visibleCount).flatMap((post, index) => {
                      const items = [
                        <PostCard key={post.id} post={post} />
                      ];
                      
                      // Mobile Doc Promo after every 3rd post
                      if ((index + 1) % 3 === 0) {
                        items.push(<MobileDocPromo key={`promo-${post.id}`} prices={docPrices} />);
                      }

                      if (monetization?.blogAdsEnabled && 
                          (index + 1) % (monetization.homepageAdFrequency || 5) === 0 &&
                          (index + 1) / (monetization.homepageAdFrequency || 5) <= (monetization.homepageMaxAds || 3)) {
                        items.push(
                          <motion.div 
                            key={`ad-${post.id}`}
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="col-span-full"
                          >
                            <AdSlot zone="between-posts" />
                          </motion.div>
                        );
                      }
                      
                      return items;
                    })}
                  </AnimatePresence>
                </div>

                {/* Pagination */}
                {visibleCount < filteredAndSortedPosts.length && (
                  <div className="mt-16 text-center">
                    <button 
                      onClick={() => setVisibleCount(prev => prev + 12)}
                      className="px-10 py-4 bg-white text-primary font-bold rounded-2xl border-2 border-primary hover:bg-primary hover:text-white transition-all shadow-lg hover:shadow-primary/20"
                    >
                      Load More Opportunities
                    </button>
                  </div>
                )}
              </>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-32 bg-white rounded-2xl border border-dashed border-gray-300"
              >
                <div className="inline-flex p-6 bg-gray-50 rounded-full mb-6 text-gray-300">
                  <Briefcase className="h-16 w-16" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">No opportunities found</h3>
                <p className="text-gray-600 mt-2 max-w-sm mx-auto">
                  We couldn't find any opportunities matching your current filters. Try clearing them to see more.
                </p>
                <button 
                  onClick={clearFilters}
                  className="mt-8 px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-blue-900 transition-all"
                >
                  Clear All Filters
                </button>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block">
            <Sidebar />
          </div>
        </div>
      </div>

      {/* Mobile Bottom Sheet Popup */}
      <MobilePopup prices={docPrices} />
    </div>
  );
};
