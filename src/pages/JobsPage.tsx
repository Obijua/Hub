import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search 
} from 'lucide-react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Post } from '../types';
import { useSeo } from '../lib/seo';
import { JobCard } from '../components/JobCard';

export const JobsPage = () => {
  const currentYear = new Date().getFullYear();
  useSeo({
    title: `Latest Jobs in Nigeria (${currentYear}) | Hub & Jobs`,
    description: `Browse and apply for the latest job openings across Lagos, Abuja, Port Harcourt and remote locations in Nigeria.`,
    path: '/jobs'
  });
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'deadline'>('newest');

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

  const filteredJobs = useMemo(() => {
    let result = posts.filter(job => {
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
  }, [posts, searchQuery, activeTab, sortBy]);

  return (
    <div style={{ backgroundColor: '#EEF2FF', minHeight: '100vh', paddingBottom: '96px', maxWidth: '430px', margin: '0 auto' }}>
      {/* 1. Hero */}
      <div style={{ backgroundColor: '#1E3B8B', padding: '16px 16px 20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>
          Explore Opportunities
        </h1>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)', marginBottom: '16px' }}>
          Discover the latest job openings, internships, and remote roles.
        </p>
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input 
            type="text"
            placeholder="Search roles, companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              height: '44px',
              backgroundColor: 'white',
              border: 'none',
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
      </div>

      {/* 2. Category Chips */}
      <div style={{ display: 'flex', overflowX: 'auto', gap: '8px', padding: '16px', scrollbarWidth: 'none', msOverflowStyle: 'none' }} className="no-scrollbar">
        {tabs.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                height: '36px',
                padding: '0 16px',
                fontSize: '14px',
                borderRadius: '2px',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                backgroundColor: isActive ? '#1E3B8B' : 'white',
                color: isActive ? 'white' : '#475569',
                border: isActive ? 'none' : '1px solid #E2E8F0',
                fontWeight: isActive ? 600 : 500
              }}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* 3. Sort Select & Results Count Row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 16px 16px' }}>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          style={{
            flex: 1,
            minWidth: 0,
            height: '40px',
            backgroundColor: 'white',
            border: '1px solid #E2E8F0',
            borderRadius: '2px',
            padding: '0 12px',
            fontSize: '14px',
            color: '#0F172A',
            outline: 'none',
            boxSizing: 'border-box'
          }}
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="deadline">Closest Deadline</option>
        </select>
        <span style={{ fontSize: '14px', color: '#64748B', whiteSpace: 'nowrap', flexShrink: 0 }}>
          {filteredJobs.length} results
        </span>
      </div>

      {/* 4. Job List using JobCard with 12px gaps */}
      <div style={{ padding: '0 16px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[1, 2, 3].map((n) => (
              <div key={n} style={{ backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: '2px', height: '120px' }} className="animate-pulse" />
            ))}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div style={{ backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: '2px', padding: '48px 16px', textAlign: 'center' }}>
            <Search size={48} style={{ color: '#CBD5E1', margin: '0 auto 12px' }} />
            <p style={{ fontWeight: 600, color: '#334155', fontSize: '16px', marginBottom: '4px' }}>No jobs found</p>
            <p style={{ fontSize: '14px', color: '#94A3B8' }}>Try a different search or filter</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredJobs.map((post) => (
              <JobCard key={post.id} post={post} showExcerpt={false} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobsPage;
