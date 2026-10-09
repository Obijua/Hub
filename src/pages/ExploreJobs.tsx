import { useState, useEffect } from 'react';
import { Search, Briefcase, ChevronRight, XCircle } from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Post } from '../types';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { PostCard } from '../components/PostCard';

export const ExploreJobs = () => {
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [jobs, setJobs] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const tabs = ['ALL', 'FULL-TIME', 'PART-TIME', 'REMOTE'];

  useEffect(() => {
    const q = query(
      collection(db, 'posts'),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      const allPosts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
      // Filter for jobs
      const onlyJobs = allPosts.filter(p => {
        const cat = p.category?.toLowerCase() || '';
        return cat.includes('job') || cat.includes('internship') || cat.includes('opportunity');
      });
      setJobs(onlyJobs);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          job.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === 'ALL') return matchesSearch;
    
    // Simple mock classification for demo if missing specific tags
    const desc = job.description.toLowerCase();
    if (activeTab === 'FULL-TIME') return matchesSearch && desc.includes('full-time');
    if (activeTab === 'PART-TIME') return matchesSearch && desc.includes('part-time');
    if (activeTab === 'REMOTE') return matchesSearch && (desc.includes('remote') || desc.includes('work from home'));
    
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white px-6 pt-10 pb-6 rounded-b-[3rem] shadow-sm">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Explore Jobs</h1>
        
        <div className="mt-8 relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
            <Search size={20} />
          </div>
          <input 
            type="text"
            placeholder="Search by role or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-sm font-medium"
          />
        </div>

        <div className="mt-6 flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                activeTab === tab 
                  ? "bg-primary text-white shadow-lg shadow-primary/20" 
                  : "bg-white border border-gray-100 text-gray-400 hover:border-gray-200"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 mt-8">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl h-32 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : filteredJobs.length > 0 ? (
          <div className="space-y-6">
            {filteredJobs.map((job) => (
              <PostCard key={job.id} post={job} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center text-gray-300 mb-6">
              <Briefcase size={40} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-400 text-sm max-w-[200px] font-medium leading-relaxed">
              Try adjusting your filters or search term
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
