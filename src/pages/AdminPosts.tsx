import { useState, useEffect } from 'react';
import { Post } from '../types';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Eye, 
  Star, 
  CheckCircle2, 
  XCircle,
  ArrowLeft,
  Filter,
  MoreVertical,
  Briefcase,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { getAdminPosts, deletePost, updatePost } from '../lib/posts';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

export const AdminPosts = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const fetchedPosts = await getAdminPosts();
      setPosts(fetchedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(id);
    try {
      await deletePost(id);
      setPosts(posts.filter(p => p.id !== id));
      toast.success('Post deleted successfully');
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post. Please try again.');
    } finally {
      setIsDeleting(null);
    }
  };

  const toggleStatus = async (post: Post, field: 'isActive' | 'isFeatured') => {
    try {
      const newValue = !post[field];
      await updatePost(post.id, { [field]: newValue });
      setPosts(posts.map(p => p.id === post.id ? { ...p, [field]: newValue } : p));
      toast.success(`Post ${field === 'isActive' ? (newValue ? 'published' : 'hidden') : (newValue ? 'featured' : 'unfeatured')} successfully`);
    } catch (error) {
      console.error(`Error toggling ${field}:`, error);
      toast.error(`Failed to update ${field}. Please try again.`);
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || post.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'job', label: 'Jobs' },
    { value: 'scholarship', label: 'Scholarships' },
    { value: 'free-course', label: 'Free Courses' },
    { value: 'udemy-coupon', label: 'Udemy Coupons' },
    { value: 'internship', label: 'Internships' },
    { value: 'opportunity', label: 'Opportunities' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 space-y-6 md:space-y-0">
        <div className="flex items-center space-x-4">
          <Link to="/admin" className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-primary hover:border-primary transition-all">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Manage Posts</h1>
            <p className="text-gray-500 font-medium">Total: {posts.length} listings</p>
          </div>
        </div>
        
        <Link
          to="/admin/posts/new"
          className="flex items-center px-8 py-4 bg-primary text-white font-black rounded-2xl hover:bg-blue-900 transition-all shadow-xl shadow-primary/20"
        >
          <Plus className="mr-2 h-5 w-5" /> Add New Post
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search posts by title or slug..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all shadow-sm"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full pl-12 pr-10 py-4 bg-white border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all shadow-sm appearance-none font-bold text-gray-700"
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Posts List - Responsive */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Mobile List View */}
        <div className="block md:hidden divide-y divide-gray-100">
          <AnimatePresence mode="popLayout">
            {filteredPosts.map((post) => (
              <motion.div
                key={post.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-6 space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                      {post.thumbnail ? (
                        <img src={post.thumbnail} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-gray-300">
                          <Briefcase className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-black text-gray-900 line-clamp-1">{post.title}</p>
                      <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">/{post.slug}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleStatus(post, 'isFeatured')}
                    className={cn(
                      "p-2 rounded-lg transition-all",
                      post.isFeatured 
                        ? "bg-amber-50 text-amber-500" 
                        : "bg-gray-50 text-gray-300"
                    )}
                  >
                    <Star className={cn("h-5 w-5", post.isFeatured && "fill-current")} />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="bg-blue-50 text-primary text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-widest">
                    {post.category.replace('-', ' ')}
                  </span>
                  <div className="flex items-center text-xs font-bold text-gray-400 px-3 py-1">
                    <Eye className="h-3 w-3 mr-1 text-primary" />
                    {post.views || 0}
                  </div>
                  <div className="flex items-center text-xs font-bold text-gray-400 px-3 py-1">
                    <Calendar className="h-3 w-3 mr-1" />
                    {format(post.createdAt.toDate(), 'MMM dd, yyyy')}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => toggleStatus(post, 'isActive')}
                    className={cn(
                      "flex items-center space-x-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                      post.isActive 
                        ? "bg-green-50 text-green-600" 
                        : "bg-gray-100 text-gray-500"
                    )}
                  >
                    {post.isActive ? (
                      <><CheckCircle2 className="h-4 w-4" /> Published</>
                    ) : (
                      <><XCircle className="h-4 w-4" /> Draft</>
                    )}
                  </button>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => navigate(`/admin/posts/edit/${post.id}`)}
                      className="p-3 bg-gray-50 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                    >
                      <Edit2 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(post.id)}
                      disabled={isDeleting === post.id}
                      className="p-3 bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all disabled:opacity-50"
                    >
                      {isDeleting === post.id ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-red-500"></div>
                      ) : (
                        <Trash2 className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="px-8 py-5">Opportunity</th>
                <th className="px-8 py-5">Category</th>
                <th className="px-8 py-5">Views</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5">Featured</th>
                <th className="px-8 py-5">Date</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <AnimatePresence mode="popLayout">
                {filteredPosts.map((post) => (
                  <motion.tr 
                    key={post.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                          {post.thumbnail ? (
                            <img src={post.thumbnail} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-gray-300">
                              <Briefcase className="h-6 w-6" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-900 line-clamp-1">{post.title}</p>
                          <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">/{post.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="bg-blue-50 text-primary text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-widest">
                        {post.category.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center text-sm font-bold text-gray-500">
                        <Eye className="h-4 w-4 mr-2 text-primary" />
                        {post.views || 0}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <button
                        onClick={() => toggleStatus(post, 'isActive')}
                        className={cn(
                          "flex items-center space-x-2 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                          post.isActive 
                            ? "bg-green-50 text-green-600 hover:bg-green-100" 
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        )}
                      >
                        {post.isActive ? (
                          <><CheckCircle2 className="h-3 w-3" /> Published</>
                        ) : (
                          <><XCircle className="h-3 w-3" /> Draft</>
                        )}
                      </button>
                    </td>
                    <td className="px-8 py-6">
                      <button
                        onClick={() => toggleStatus(post, 'isFeatured')}
                        className={cn(
                          "p-2 rounded-lg transition-all",
                          post.isFeatured 
                            ? "bg-amber-50 text-amber-500 hover:bg-amber-100" 
                            : "bg-gray-50 text-gray-300 hover:bg-gray-100"
                        )}
                      >
                        <Star className={cn("h-5 w-5", post.isFeatured && "fill-current")} />
                      </button>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center text-xs font-bold text-gray-400">
                        {format(post.createdAt.toDate(), 'MMM dd, yyyy')}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => navigate(`/admin/posts/edit/${post.id}`)}
                          className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                        >
                          <Edit2 className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(post.id)}
                          disabled={isDeleting === post.id}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                        >
                          {isDeleting === post.id ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-red-500"></div>
                          ) : (
                            <Trash2 className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {filteredPosts.length === 0 && (
          <div className="px-8 py-20 text-center">
            <div className="flex flex-col items-center">
              <div className="p-6 bg-gray-50 rounded-3xl text-gray-300 mb-4">
                <Search className="h-12 w-12" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">No posts found</h3>
              <p className="text-gray-500">Try adjusting your search or filter to find what you're looking for.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
