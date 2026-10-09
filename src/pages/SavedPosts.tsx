import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, where, documentId } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Post } from '../types';
import { PostCard } from '../components/PostCard';
import { useBookmarks } from '../hooks/useBookmarks';
import { Bookmark, Trash2, ArrowLeft, Loader2, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export const SavedPosts = () => {
  const { bookmarks, clearAll } = useBookmarks();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSavedPosts = async () => {
      if (bookmarks.length === 0) {
        setPosts([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Firestore 'in' query limit is 10, so we fetch in chunks
        const chunks = [];
        for (let i = 0; i < bookmarks.length; i += 10) {
          chunks.push(bookmarks.slice(i, i + 10));
        }

        const allFetchedPosts: Post[] = [];
        for (const chunk of chunks) {
          const q = query(
            collection(db, 'posts'),
            where(documentId(), 'in', chunk)
          );
          const snap = await getDocs(q);
          snap.docs.forEach(doc => {
            allFetchedPosts.push({ id: doc.id, ...doc.data() } as Post);
          });
        }

        // Sort by the order in bookmarks (most recent first)
        const sortedPosts = allFetchedPosts.sort((a, b) => {
          return bookmarks.indexOf(b.id) - bookmarks.indexOf(a.id);
        });

        setPosts(sortedPosts);
      } catch (err) {
        console.error('Error fetching saved posts:', err);
        toast.error('Failed to load saved opportunities');
      } finally {
        setLoading(false);
      }
    };

    fetchSavedPosts();
  }, [bookmarks]);

  const handleClearAll = () => {
    clearAll();
    toast.success('All bookmarks cleared');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24 pb-20 px-4 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-2xl">
              <Bookmark className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Saved Opportunities</h1>
              <p className="text-gray-500 dark:text-gray-400">
                {bookmarks.length} {bookmarks.length === 1 ? 'opportunity' : 'opportunities'} saved
              </p>
            </div>
          </div>

          {bookmarks.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-gray-900 border border-red-100 dark:border-red-900/30 text-red-600 rounded-2xl font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-all shadow-sm"
            >
              <Trash2 className="h-4 w-4" />
              Clear All
            </button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
            <p className="text-gray-500">Loading your saved list...</p>
          </div>
        ) : posts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto text-center py-20"
          >
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Bookmark className="h-10 w-10 text-gray-300" />
            </div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">No saved opportunities yet</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8">
              Tap the bookmark icon on any post to save it for later.
            </p>
            <Link 
              to="/blog" 
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-2xl font-black hover:bg-blue-900 transition-all shadow-lg shadow-primary/20"
            >
              <Star className="h-4 w-4" />
              Explore Opportunities
            </Link>
          </motion.div>
        )}

        {/* Back Link */}
        <div className="mt-12 pt-12 border-t border-gray-100 dark:border-gray-800">
          <Link to="/blog" className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-primary transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to all opportunities
          </Link>
        </div>
      </div>
    </div>
  );
};
