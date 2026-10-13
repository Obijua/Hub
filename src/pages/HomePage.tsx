import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Briefcase, 
  MapPin, 
  Bookmark, 
  ChevronRight 
} from 'lucide-react';
import { collection, query, orderBy, onSnapshot, getDocs, where, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Post, CategoryConfig } from '../types';
import AdUnit from '../components/AdUnit';
import { useSeo, setJsonLd } from '../lib/seo';

export const HomePage = () => {
  const currentYear = new Date().getFullYear();
  useSeo({
    title: `Hub & Jobs | Jobs in Nigeria, Scholarships & Opportunities (${currentYear})`,
    description: `Find the latest job vacancies in Nigeria, remote jobs, scholarships, internships, and free courses. Apply today on Hub & Jobs.`,
    path: '/'
  });

  useEffect(() => {
    return setJsonLd('home-jsonld', {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebSite",
          "name": "Hub & Jobs",
          "url": "https://www.hubandjobs.com/",
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://www.hubandjobs.com/search?q={search_term_string}",
            "query-input": "required name=search_term_string"
          }
        },
        {
          "@type": "Organization",
          "name": "Hub & Jobs",
          "url": "https://www.hubandjobs.com/",
          "logo": "https://www.hubandjobs.com/logo.png"
        }
      ]
    });
  }, []);
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [savedPostIds, setSavedPostIds] = useState<string[]>([]);
  const [adConfig, setAdConfig] = useState<any>(null);

  const [categories, setCategories] = useState<CategoryConfig[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      setPosts(postsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching posts:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, 'categories'),
      where('isActive', '==', true),
      orderBy('displayOrder', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CategoryConfig));
      setCategories(cats);
      setCategoriesLoading(false);
    }, (error) => {
      console.error("Error fetching categories:", error);
      setCategoriesLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchUserInteractions = async () => {
      if (!auth.currentUser) return;
      try {
        const savedQuery = query(collection(db, 'savedPosts'), where('userId', '==', auth.currentUser.uid));
        const savedSnap = await getDocs(savedQuery);
        setSavedPostIds(savedSnap.docs.map(d => d.data().postId));
      } catch (e) {
        console.error(e);
      }
    };
    fetchUserInteractions();
  }, []);

  useEffect(() => {
    const fetchAdConfig = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'monetization'));
        if (snap.exists()) setAdConfig(snap.data());
      } catch (e) {}
    };
    fetchAdConfig();
  }, []);

  const toggleSave = async (e: React.MouseEvent, postId: string) => {
    e.stopPropagation();
    if (!auth.currentUser) {
      return;
    }
    try {
      if (savedPostIds.includes(postId)) {
        setSavedPostIds(prev => prev.filter(id => id !== postId));
      } else {
        setSavedPostIds(prev => [...prev, postId]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredPosts = posts.filter(post => {
    const pAny = post as any;
    const comp = pAny.company || pAny.employer || '';
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          comp.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || (() => {
      if (!post.category) return false;
      const postCat = String(post.category).toLowerCase().trim();
      const sel = selectedCategory.toLowerCase().trim();
      if (postCat === sel) return true;
      const matchedCat = categories.find(c => c.slug.toLowerCase() === sel || c.name.toLowerCase() === sel);
      if (matchedCat) {
        return postCat === matchedCat.slug.toLowerCase() || postCat === matchedCat.name.toLowerCase();
      }
      return false;
    })();
    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredPosts.length / PAGE_SIZE) || 1;
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const currentPosts = filteredPosts.slice(startIndex, startIndex + PAGE_SIZE);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (currentPage > 3) {
        pages.push('...');
      }
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }
      if (currentPage < totalPages - 2) {
        pages.push('...');
      }
      if (!pages.includes(totalPages)) {
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="min-h-screen bg-[#EEF2FF] px-4 pt-4 pb-24">
      {/* Search Bar */}
      <div className="relative mb-4">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <Search size={18} />
        </div>
        <input 
          type="text"
          placeholder="Search jobs, companies..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white shadow-sm rounded-sm pl-10 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none border-none"
        />
      </div>

      <AdUnit slot="homepage-top" label="Advertisement" />

      {/* Category Filter Chips */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4 pb-1">
        <button
          onClick={() => setSelectedCategory('All')}
          className={`px-3 py-1.5 text-sm rounded-sm whitespace-nowrap transition-all ${
            selectedCategory === 'All' 
              ? 'bg-[#1E3B8B] text-white font-semibold' 
              : 'bg-white text-slate-600 shadow-sm hover:bg-slate-50'
          }`}
        >
          All
        </button>
        {categoriesLoading ? (
          <>
            <div className="w-20 h-8 bg-white shadow-sm rounded-sm animate-pulse" />
            <div className="w-24 h-8 bg-white shadow-sm rounded-sm animate-pulse" />
            <div className="w-16 h-8 bg-white shadow-sm rounded-sm animate-pulse" />
          </>
        ) : (
          categories.map((cat) => {
            const isActive = selectedCategory === cat.slug;
            return (
              <button
                key={cat.id || cat.slug}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`px-3 py-1.5 text-sm rounded-sm whitespace-nowrap transition-all ${
                  isActive 
                    ? 'bg-[#1E3B8B] text-white font-semibold' 
                    : 'bg-white text-slate-600 shadow-sm hover:bg-slate-50'
                }`}
              >
                {cat.name}
              </button>
            );
          })
        )}
      </div>

      {/* Section Title */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-base text-slate-900">Recent Opportunities</h2>
          <div className="flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded-sm">
            <div className="w-1.5 h-1.5 rounded-sm bg-[#1E3B8B] animate-pulse" />
            <span className="text-xs font-semibold text-[#1E3B8B]">LIVE</span>
          </div>
        </div>
        <Link to="/jobs" className="text-xs font-semibold text-[#1E3B8B] flex items-center gap-0.5">
          See all <ChevronRight size={14} />
        </Link>
      </div>

      {/* Job Cards List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white shadow-sm rounded-sm p-4 h-32 animate-pulse" />
          ))}
        </div>
      ) : currentPosts.length === 0 ? (
        <div className="bg-white shadow-sm rounded-sm p-8 text-center mt-4">
          <Briefcase size={40} className="mx-auto text-slate-300 mb-2" />
          <p className="font-semibold text-slate-700 text-sm">No jobs found</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your search criteria</p>
        </div>
      ) : (
        <div className="space-y-3">
          {currentPosts.map((post, index) => {
            const isSaved = savedPostIds.includes(post.id);
            const pAny = post as any;
            const companyName = pAny.company || pAny.employer || 'Featured Employer';
            const locationText = post.location || 'Nigeria';
            const salaryText = post.salary || 'Competitive';

            return (
              <div key={post.id || index}>
                <div 
                  onClick={() => navigate(`/jobs/${post.id}`, { state: { job: post } })}
                  className="bg-white shadow-sm rounded-sm p-4 transition-all cursor-pointer hover:bg-slate-50/80"
                >
                  {/* Row 1 */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h3 className="font-semibold text-base text-slate-900 hover:text-[#1E3B8B] line-clamp-1">
                        {post.title}
                      </h3>
                      <p className="text-sm text-slate-500 line-clamp-1">{companyName}</p>
                    </div>
                    <button 
                      onClick={(e) => toggleSave(e, post.id)}
                      className="text-slate-300 hover:text-slate-600 shrink-0 p-1"
                    >
                      <Bookmark size={20} className={isSaved ? "fill-[#1E3B8B] text-[#1E3B8B]" : "text-slate-300"} />
                    </button>
                  </div>

                  {/* Row 2 */}
                  <div className="flex items-center gap-3 text-sm text-slate-500 mb-3">
                    <div className="flex items-center gap-1">
                      <MapPin size={14} className="shrink-0" />
                      <span className="line-clamp-1">{locationText}</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Briefcase size={14} className="shrink-0" />
                      <span className="line-clamp-1">{
                        (() => {
                          const VALID_TYPES = ['Full-time', 'Part-time', 'Remote', 'Internship', 'Contract', 'Freelance'];
                          const rType = pAny.type || pAny.jobType || pAny.tags?.[0];
                          return VALID_TYPES.includes(rType) ? rType : 
                            VALID_TYPES.includes(pAny.jobType) ? pAny.jobType : 'Full-time';
                        })()
                      }</span>
                    </div>
                  </div>

                  {/* Row 3 */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="bg-slate-100 text-slate-700 text-xs font-medium px-2 py-1 rounded-sm">
                      {salaryText}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/jobs/${post.id}`, { state: { job: post } });
                      }}
                      className="text-xs font-semibold px-3 py-1.5 rounded-sm bg-[#1E3B8B] text-white hover:bg-[#162d6e] shadow-sm transition-all"
                    >
                      Easy Apply
                    </button>
                  </div>
                </div>

                {/* In-feed ad injection with CORRECT field names */}
                {adConfig?.masterSwitch && 
                 adConfig?.homepageAdsEnabled && 
                 Number(adConfig?.homepageAdFrequency) > 0 &&
                 (index + 1) % Number(adConfig.homepageAdFrequency) === 0 &&
                 Math.floor((index + 1) / Number(adConfig.homepageAdFrequency)) <= Number(adConfig.homepageMaxAds || 3) && (
                  <AdUnit
                    key={`home-ad-${index}`}
                    slot={`homepage-infeed-${index}`}
                    label="Advertisement"
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && filteredPosts.length > 0 && totalPages > 1 && (
        <div className="mt-6 mb-6">
          <div className="flex items-center justify-center flex-wrap gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className={`min-w-[40px] min-h-[40px] px-3 flex items-center justify-center text-sm font-medium rounded-sm bg-white text-slate-700 border border-slate-200 shadow-sm transition-all ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50'}`}
            >
              Prev
            </button>

            {getPageNumbers().map((p, idx) => {
              if (p === '...') {
                return (
                  <span key={`ellipsis-${idx}`} className="min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-400 text-sm">
                    …
                  </span>
                );
              }
              const pageNum = Number(p);
              const isActive = currentPage === pageNum;
              return (
                <button
                  key={`page-${pageNum}`}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`min-w-[40px] min-h-[40px] flex items-center justify-center text-sm font-semibold rounded-sm shadow-sm transition-all ${
                    isActive
                      ? 'bg-[#1E3B8B] text-white'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`min-w-[40px] min-h-[40px] px-3 flex items-center justify-center text-sm font-medium rounded-sm bg-white text-slate-700 border border-slate-200 shadow-sm transition-all ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50'}`}
            >
              Next
            </button>
          </div>
          <p className="text-xs text-slate-500 text-center mt-2">Page {currentPage} of {totalPages}</p>
        </div>
      )}

      <AdUnit slot="homepage-bottom" label="Advertisement" />
    </div>
  );
};

export default HomePage;
