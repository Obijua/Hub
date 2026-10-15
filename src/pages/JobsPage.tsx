import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Briefcase, 
  MapPin, 
  Bookmark, 
  ChevronLeft, 
  SlidersHorizontal 
} from 'lucide-react';
import { collection, query, orderBy, onSnapshot, getDocs, where } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Post } from '../types';
import { useSeo } from '../lib/seo';

export const JobsPage = () => {
  const currentYear = new Date().getFullYear();
  useSeo({
    title: `Latest Jobs in Nigeria (${currentYear}) | Hub & Jobs`,
    description: `Browse and apply for the latest job openings across Lagos, Abuja, Port Harcourt and remote locations in Nigeria.`,
    path: '/jobs'
  });
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');
  const [savedPostIds, setSavedPostIds] = useState<string[]>([]);

  const tabs = ['ALL', 'FULL-TIME', 'PART-TIME', 'REMOTE', 'INTERNSHIP'];

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      
      const onlyJobs = postsData.filter(p => {
        const cat = p.category?.toLowerCase() || '';
        const desc = p.description?.toLowerCase() || '';
        return cat.includes('job') || cat.includes('internship') || cat.includes('opportunity') || desc.includes('job') || desc.includes('salary');
      });
      setPosts(onlyJobs.length > 0 ? onlyJobs : postsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching jobs:", error);
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

  const filteredJobs = posts.filter(job => {
    const pAny = job as any;
    const comp = pAny.company || pAny.employer || '';
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          comp.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (job.description && job.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (!matchesSearch) return false;
    if (activeTab === 'ALL') return true;

    const desc = (job.description || '').toLowerCase();
    const type = (pAny.type || pAny.jobType || pAny.tags?.[0] || '').toLowerCase();
    
    if (activeTab === 'FULL-TIME') return type.includes('full') || desc.includes('full-time');
    if (activeTab === 'PART-TIME') return type.includes('part') || desc.includes('part-time');
    if (activeTab === 'REMOTE') return type.includes('remote') || desc.includes('remote') || desc.includes('work from home');
    if (activeTab === 'INTERNSHIP') return type.includes('intern') || desc.includes('internship');

    return true;
  });

  const getCompanyInitial = (companyName?: string) => {
    if (!companyName) return 'H';
    return companyName.charAt(0).toUpperCase();
  };

  const getBgColor = (str?: string) => {
    const colors = ['bg-[#1E3B8B]', 'bg-blue-700', 'bg-amber-600', 'bg-purple-600', 'bg-rose-600', 'bg-indigo-600'];
    if (!str) return colors[0];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="min-h-screen bg-[#EEF2FF] px-4 pt-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="p-1 bg-white shadow-sm rounded-sm text-slate-600 hover:text-slate-900">
            <ChevronLeft size={20} />
          </button>
          <h1 className="font-bold text-xl text-slate-950">Find Jobs</h1>
        </div>
        <button className="p-2 bg-white shadow-sm rounded-sm text-slate-600 hover:text-slate-900">
          <SlidersHorizontal size={18} />
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-4">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <Search size={18} />
        </div>
        <input 
          type="text"
          placeholder="Search roles, companies..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white shadow-sm rounded-sm pl-10 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none border-none"
        />
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4 pb-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-sm rounded-sm whitespace-nowrap transition-all ${
                isActive 
                  ? 'bg-[#1E3B8B] text-white font-semibold' 
                  : 'bg-white text-slate-600 shadow-sm hover:bg-slate-50'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      <div className="mb-3">
        <p className="text-sm text-slate-500 font-medium">{filteredJobs.length} jobs found</p>
      </div>

      {/* Job Cards */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white shadow-sm rounded-sm p-4 h-32 animate-pulse" />
          ))}
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="bg-white shadow-sm rounded-sm p-12 text-center mt-4 flex flex-col items-center justify-center">
          <Search size={48} className="text-slate-300 mb-3" />
          <p className="font-semibold text-slate-700 text-base mb-1">No jobs found</p>
          <p className="text-sm text-slate-400">Try a different search or filter</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredJobs.map((post) => {
            const isSaved = savedPostIds.includes(post.id);
            const pAny = post as any;
            const companyName = pAny.company || pAny.employer || 'Featured Employer';
            const locationText = post.location || 'Nigeria';
            const rawJobType = pAny?.jobType || pAny?.type || '';
            const VALID_TYPES = ['Full-time', 'Part-time', 'Remote', 'Internship', 'Contract', 'Freelance'];
            const matchedType = VALID_TYPES.find(t => t.toLowerCase() === rawJobType.toLowerCase());
            const jobType = matchedType || rawJobType || '';
            const salaryText = post.salary || 'Competitive';

            return (
              <div 
                key={post.id}
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
                  {jobType && (
                    <>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Briefcase size={14} className="shrink-0" />
                        <span className="line-clamp-1">{jobType}</span>
                      </div>
                    </>
                  )}
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
            );
          })}
        </div>
      )}
    </div>
  );
};

export default JobsPage;
