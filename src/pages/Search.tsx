import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { collection, query, getDocs, where, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Post } from '../types';
import { PostCard } from '../components/PostCard';
import AdUnit from '../components/AdUnit';
import { SkeletonList } from '../components/SkeletonCard';
import { Search as SearchIcon, Briefcase, ArrowRight } from 'lucide-react';
import { SEO } from '../components/SEO';
import { motion } from 'motion/react';
import { trackEvent } from '../lib/analytics';

export const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSearchResults = async () => {
      setLoading(true);
      try {
        trackEvent('Search', 'search', queryParam);
        // Firestore doesn't support full-text search natively without external services
        // So we fetch all active posts and filter client-side for this demo
        // In production, you'd use Algolia or similar
        const q = query(
          collection(db, 'posts'),
          where('isActive', '==', true),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const allPosts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
        
        const filtered = allPosts.filter(post => 
          post.title.toLowerCase().includes(queryParam.toLowerCase()) ||
          post.description.toLowerCase().includes(queryParam.toLowerCase()) ||
          post.tags.some(tag => tag.toLowerCase().includes(queryParam.toLowerCase()))
        );
        
        setPosts(filtered);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    };

    if (queryParam) {
      fetchSearchResults();
    } else {
      setPosts([]);
      setLoading(false);
    }
  }, [queryParam]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <SEO 
        title={`Search results for "${queryParam}"`} 
        description={`Find opportunities related to ${queryParam} on Hub & Jobs.`}
      />

      <div className="mb-12">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-primary text-white rounded-2xl">
            <SearchIcon className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Search Results
          </h1>
        </div>
        <p className="text-gray-500 dark:text-gray-400 font-medium">
          Showing results for <span className="text-primary dark:text-accent font-bold">"{queryParam}"</span>
        </p>
      </div>

      {loading ? (
        <SkeletonList />
      ) : posts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post, index) => (
            <div key={post.id} className="contents">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (index % 12) * 0.1 }}
              >
                <PostCard post={post} />
              </motion.div>
              {(index + 1) % 2 === 0 && (
                <div className="col-span-full">
                  <AdUnit slot={`search_results_${Math.floor(index / 2)}`} />
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-50 dark:bg-gray-900 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
          <div className="inline-flex p-6 bg-white dark:bg-gray-800 rounded-full shadow-xl mb-6">
            <SearchIcon className="h-12 w-12 text-gray-300" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">No results found</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
            We couldn't find any opportunities matching your search. Try using different keywords or browse our categories.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              to="/blog" 
              className="px-8 py-3 bg-primary text-white font-black rounded-2xl hover:bg-blue-900 transition-all shadow-lg"
            >
              Browse All
            </Link>
            <Link 
              to="/" 
              className="px-8 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-white font-black rounded-2xl border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            >
              Back Home
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
