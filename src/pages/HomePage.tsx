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
import { Post } from '../types';
import AdUnit from '../components/AdUnit';

export const HomePage = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [savedPostIds, setSavedPostIds] = useState<string[]>([]);
  const [adConfig, setAdConfig] = useState<any>(null);

  const categories = ['All', 'Technology', 'Finance', 'Marketing', 'Design', 'Sales', 'Engineering'];

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
    const matchesCategory = selectedCategory === 'All' || 
                            (post.category && post.category.toLowerCase() === selectedCategory.toLowerCase());
    return matchesSearch && matchesCategory;
  });

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
        {categories.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-sm rounded-sm whitespace-nowrap transition-all ${
                isActive 
                  ? 'bg-[#1E3B8B] text-white font-semibold' 
                  : 'bg-white text-slate-600 shadow-sm hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          );
        })}
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
      ) : filteredPosts.length === 0 ? (
        <div className="bg-white shadow-sm rounded-sm p-8 text-center mt-4">
          <Briefcase size={40} className="mx-auto text-slate-300 mb-2" />
          <p className="font-semibold text-slate-700 text-sm">No jobs found</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your search criteria</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPosts.map((post, index) => {
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

      <AdUnit slot="homepage-bottom" label="Advertisement" />
    </div>
  );
};

export default HomePage;
