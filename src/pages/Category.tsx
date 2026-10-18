import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Post, Category as CategoryType, CategoryConfig, MonetizationConfig } from '../types';
import { useSeo } from '../lib/seo';
import { 
  ArrowLeft,
  Search,
  Sparkles, 
  X as CloseIcon, 
  FileText, 
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getAllPosts } from '../lib/posts';
import { JobCard } from '../components/JobCard';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, getDocs, doc, onSnapshot } from 'firebase/firestore';
import { AdSlot } from '../components/ads/AdSlot';

const MobileDocPromo = React.forwardRef<HTMLDivElement, { prices: any }>(({ prices }, ref) => (
  <div ref={ref} className="lg:hidden my-3 p-4 bg-amber-600 text-white" style={{ borderRadius: '2px' }}>
    <div className="flex items-center space-x-2 mb-2">
      <Sparkles className="h-3 w-3 text-yellow-200" />
      <span className="text-[9px] font-black uppercase tracking-widest">Premium Tools</span>
    </div>
    <h3 className="text-base font-black mb-1">Professional Documents</h3>
    <p className="text-amber-50 text-[10px] mb-3 opacity-90">Get hired faster with expert CVs and Plans.</p>
    <div className="grid grid-cols-2 gap-2 mb-3">
      <div className="p-1.5 bg-white/10 text-center" style={{ borderRadius: '2px' }}>
        <div className="text-[9px] opacity-80">CV</div>
        <div className="font-black text-xs">₦{prices?.cvPrice || '1,500'}</div>
      </div>
      <div className="p-1.5 bg-white/10 text-center" style={{ borderRadius: '2px' }}>
        <div className="text-[9px] opacity-80">Plan</div>
        <div className="font-black text-xs">₦{prices?.planPrice || '5,000'}</div>
      </div>
    </div>
    <Link to="/documents" className="block w-full bg-white text-amber-600 text-center font-black py-2.5 text-xs" style={{ borderRadius: '2px' }}>
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
    <div className="fixed inset-x-0 bottom-0 z-[100] p-2 max-w-[430px] mx-auto">
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        className="bg-white shadow-[0_-10px_40px_-12px_rgba(0,0,0,0.3)] p-4 relative"
        style={{ borderRadius: '2px 2px 0 0' }}
      >
        <div className="w-8 h-1 bg-gray-200 mx-auto mb-4" style={{ borderRadius: '2px' }}></div>
        
        <button 
          onClick={() => setIsDismissed(true)}
          className="absolute top-3 right-3 p-1.5 bg-gray-50 text-gray-400"
          style={{ borderRadius: '2px' }}
        >
          <CloseIcon className="h-4 w-4" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="p-3 bg-amber-50" style={{ borderRadius: '2px' }}>
            <FileText className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h3 className="text-base font-black text-gray-900">Need a Professional CV?</h3>
            <p className="text-xs text-gray-500">Stand out from the crowd today!</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="p-2 bg-gray-50 text-center" style={{ borderRadius: '2px' }}>
            <div className="text-[9px] text-gray-400 font-bold uppercase">CV</div>
            <div className="font-black text-[#1E3B8B] text-sm">₦{prices?.cvPrice || '1,500'}</div>
          </div>
          <div className="p-2 bg-gray-50 text-center" style={{ borderRadius: '2px' }}>
            <div className="text-[9px] text-gray-400 font-bold uppercase">Plan</div>
            <div className="font-black text-[#1E3B8B] text-sm">₦{prices?.planPrice || '5,000'}</div>
          </div>
          <div className="p-2 bg-gray-50 text-center" style={{ borderRadius: '2px' }}>
            <div className="text-[9px] text-gray-400 font-bold uppercase">Bundle</div>
            <div className="font-black text-[#1E3B8B] text-sm">₦{prices?.bundlePrice || '7,500'}</div>
          </div>
        </div>

        <Link 
          to="/documents"
          className="w-full bg-[#1E3B8B] text-white font-black py-3 flex items-center justify-center space-x-2 shadow-lg shadow-[#1E3B8B]/20 text-sm"
          style={{ borderRadius: '2px' }}
        >
          <span>Build My Document ✨</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </motion.div>
    </div>
  );
};

export const Category = () => {
  const { slug } = useParams<{ slug: string }>();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'deadline'>('newest');
  const [visibleCount, setVisibleCount] = useState(12);
  const [meta, setMeta] = useState<CategoryConfig | null>(null);

  useSeo({
    title: meta ? `${meta.name} Opportunities in Nigeria | Hub & Jobs` : `${slug?.toUpperCase() || 'Category'} | Hub & Jobs`,
    description: meta?.description || `Explore latest ${meta?.name || slug} opportunities, jobs, and updates in Nigeria on Hub & Jobs.`,
    path: `/category/${slug}`
  });
  const [monetization, setMonetization] = useState<MonetizationConfig | null>(null);
  const [docPrices, setDocPrices] = useState<any>(null);

  useEffect(() => {
    const unsubDocs = onSnapshot(doc(db, 'settings', 'documents'), (doc) => {
      if (doc.exists()) setDocPrices(doc.data());
    });
    return () => unsubDocs();
  }, []);

  useEffect(() => {
    const unsubMonetization = onSnapshot(doc(db, 'settings', 'monetization'), (doc) => {
      if (doc.exists()) setMonetization(doc.data() as MonetizationConfig);
    });
    return () => unsubMonetization();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        const qMeta = query(collection(db, 'categories'), where('slug', '==', slug));
        const snapMeta = await getDocs(qMeta);
        if (!snapMeta.empty) {
          setMeta({ id: snapMeta.docs[0].id, ...snapMeta.docs[0].data() } as CategoryConfig);
        } else {
          setMeta(null);
        }

        const fetchedPosts = await getAllPosts({ 
          category: slug as CategoryType,
          limitCount: 100
        });
        setPosts(fetchedPosts || []);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'categories/posts');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    setVisibleCount(12);
  }, [slug]);

  const filteredAndSortedPosts = useMemo(() => {
    let result = [...posts];

    if (searchTerm) {
      result = result.filter(post => 
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    result.sort((a, b) => {
      if (sortBy === 'newest') return (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0);
      if (sortBy === 'oldest') return (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0);
      if (sortBy === 'deadline') {
        const dateA = a.deadline?.toMillis?.() || Infinity;
        const dateB = b.deadline?.toMillis?.() || Infinity;
        return dateA - dateB;
      }
      return 0;
    });

    return result;
  }, [posts, searchTerm, sortBy]);

  if (!meta) {
    return (
      <div style={{ maxWidth: '430px', margin: '0 auto', padding: '48px 16px', backgroundColor: '#EEF2FF', minHeight: '100vh', textAlign: 'center' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0F172A', marginBottom: '12px' }}>Category not found</h2>
        <Link to="/blog" style={{ color: '#1E3B8B', fontWeight: 600, fontSize: '14px', textDecoration: 'underline' }}>Back to all opportunities</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '430px', margin: '0 auto', backgroundColor: '#EEF2FF', minHeight: '100vh', paddingBottom: '96px' }}>
      {/* Header Band */}
      <div style={{ backgroundColor: '#1E3B8B', padding: '16px' }}>
        <Link to="/blog" style={{ color: 'white', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '12px', textDecoration: 'none', opacity: 0.9 }}>
          <ArrowLeft size={16} /> All opportunities
        </Link>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '6px', lineHeight: '1.2' }}>
          {meta.name}
        </h1>
        {meta.description && (
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)', marginBottom: '12px', lineHeight: '1.4' }}>
            {meta.description}
          </p>
        )}
        <div style={{ display: 'inline-block', backgroundColor: 'rgba(255,255,255,0.15)', color: 'white', fontSize: '12px', padding: '4px 8px', borderRadius: '2px', fontWeight: 500 }}>
          {filteredAndSortedPosts.length} opportunities
        </div>
      </div>

      {/* Search & Sort Controls */}
      <div style={{ padding: '16px' }}>
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <Search style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: '#94A3B8' }} />
          <input
            type="text"
            placeholder={`Search ${meta.name}`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              height: '44px',
              backgroundColor: 'white',
              border: '1px solid #E2E8F0',
              borderRadius: '2px',
              paddingLeft: '44px',
              paddingRight: '16px',
              fontSize: '16px',
              color: '#0F172A',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', color: '#64748B', marginBottom: '4px', fontWeight: 500 }}>Sort by</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            style={{
              width: '100%',
              height: '44px',
              backgroundColor: 'white',
              border: '1px solid #E2E8F0',
              borderRadius: '2px',
              padding: '0 12px',
              fontSize: '16px',
              color: '#0F172A',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="deadline">Closest Deadline</option>
          </select>
        </div>
      </div>

      {/* Main Content List */}
      <div style={{ padding: '0 16px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse bg-white" style={{ height: '140px', border: '1px solid #E2E8F0', borderRadius: '2px' }}></div>
            ))}
          </div>
        ) : filteredAndSortedPosts.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <AnimatePresence mode="popLayout">
              {filteredAndSortedPosts.slice(0, visibleCount).flatMap((post, index) => {
                const items = [
                  <JobCard key={post.id} post={post} showExcerpt={true} />
                ];
                
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
                    >
                      <AdSlot zone="between-posts" />
                    </motion.div>
                  );
                }
                
                return items;
              })}
            </AnimatePresence>

            {visibleCount < filteredAndSortedPosts.length && (
              <div style={{ textAlign: 'center', marginTop: '24px' }}>
                <button 
                  onClick={() => setVisibleCount(prev => prev + 12)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: 'white',
                    color: '#1E3B8B',
                    fontWeight: 'bold',
                    border: '1px solid #1E3B8B',
                    borderRadius: '2px',
                    cursor: 'pointer'
                  }}
                >
                  Load More {meta.name}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '48px 16px', backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: '2px' }}>
            <p style={{ fontSize: '15px', color: '#334155', fontWeight: 600, marginBottom: '12px' }}>No opportunities in this category yet.</p>
            <Link to="/blog" style={{ fontSize: '14px', color: '#1E3B8B', fontWeight: 600, textDecoration: 'underline' }}>Back to all opportunities</Link>
          </div>
        )}
      </div>

      <MobilePopup prices={docPrices} />
    </div>
  );
};

export default Category;
