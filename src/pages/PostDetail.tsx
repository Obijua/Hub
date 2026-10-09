import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  Calendar, 
  Tag, 
  Share2, 
  ArrowLeft, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Copy, 
  Clock,
  TrendingUp,
  Bookmark,
  ChevronRight,
  Github,
  Search,
  ArrowRight,
  MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getPostBySlug, incrementViews } from '../lib/posts';
import { Post } from '../types';
import { Helmet } from 'react-helmet-async';
import { format } from 'date-fns';
import { toast } from 'sonner';

export const PostDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) return;
      
      try {
        setLoading(true);
        const data = await getPostBySlug(slug);
        if (data) {
          setPost(data);
          // Increment views
          incrementViews(data.id);
        }
      } catch (error) {
        console.error('Error fetching post:', error);
        toast.error('Failed to load post content');
      } finally {
        setLoading(false);
        window.scrollTo(0, 0);
      }
    };

    fetchPost();
  }, [slug]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    try {
      const d = date.toDate ? date.toDate() : new Date(date);
      return format(d, 'MMMM dd, yyyy');
    } catch (e) {
      return 'N/A';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-950 p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Post not found</h2>
        <Link to="/" className="text-primary font-bold flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-black pb-20">
      <Helmet>
        <title>{post.seoTitle || post.title} | Hub & Jobs</title>
        <meta name="description" content={post.metaDescription || post.title} />
        {post.ogImage && <meta property="og:image" content={post.ogImage} />}
      </Helmet>

      {/* 1. PROGRESS BAR */}
      <motion.div 
        className="fixed top-0 left-0 h-1 bg-emerald-500 z-[60] origin-left"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1 }}
      />

      <div className="max-w-4xl mx-auto px-6 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl shadow-gray-200/20 dark:shadow-none border border-gray-100 dark:border-gray-800 overflow-hidden"
        >
          {/* IMAGE HEADER */}
          {post.thumbnail && (
            <div className="relative aspect-[21/9]">
              <img 
                src={post.thumbnail} 
                alt={post.title} 
                className="w-full h-full object-cover"
              />
              <div className="absolute top-6 left-6">
                <span className="px-4 py-2 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg">
                  {post.category}
                </span>
              </div>
            </div>
          )}

          {/* 3. POST HEADER */}
          <div className="p-8 md:p-14 min-w-0">
            <div className="flex flex-wrap items-center gap-4 mb-8">
              <div className="flex items-center text-[10px] font-bold text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-2xl uppercase tracking-widest">
                <Calendar className="h-3.5 w-3.5 mr-2 text-emerald-500" />
                {formatDate(post.createdAt)}
              </div>
              <div className="flex items-center text-[10px] font-bold text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-2xl uppercase tracking-widest">
                <Clock className="h-3.5 w-3.5 mr-2 text-primary" />
                5 min read
              </div>
            </div>

            <h1 className="post-title break-words text-3xl md:text-5xl font-black text-gray-900 dark:text-white leading-[1.1] mb-10 tracking-tight">
              {post.title}
            </h1>

            {/* 5. POST CONTENT */}
            <div className="w-full max-w-full">
              <style>{`
                .post-content {
                  width: 100%;
                  max-width: 100%;
                  line-height: 1.8;
                }
                
                .post-content * {
                  max-width: 100%;
                  word-break: normal !important;
                  overflow-wrap: break-word !important;
                  text-align: justify;
                }

                .post-content p {
                  margin-bottom: 2rem;
                  font-size: 1.125rem;
                  font-weight: 500;
                  color: #475569; /* Slate 600 */
                }
                .dark .post-content p {
                  color: #e2e8f0; /* Slate 200 - Very visible */
                }
                
                .post-content h2 {
                  font-size: 2.25rem;
                  font-weight: 900;
                  color: #0f172a; /* Slate 900 */
                  margin: 3.5rem 0 1.5rem;
                  letter-spacing: -0.04em;
                  line-height: 1.1;
                }
                .dark .post-content h2 {
                  color: #f8fafc; /* Slate 50 - Very visible */
                }

                .post-content h3 {
                  font-size: 1.75rem;
                  font-weight: 800;
                  color: #1e293b;
                  margin: 2.5rem 0 1.25rem;
                  letter-spacing: -0.02em;
                }
                .dark .post-content h3 {
                  color: #f1f5f9;
                }

                .post-content a {
                  color: #1e3b8b; /* Primary color */
                  text-decoration: underline;
                  text-underline-offset: 4px;
                  font-weight: 700;
                }

                .post-content ul, .post-content ol {
                  margin-bottom: 2rem;
                  padding-left: 1.5rem;
                  color: #475569;
                }
                .dark .post-content ul, .dark .post-content ol {
                  color: #e2e8f0;
                }
                .post-content li {
                  margin-bottom: 0.75rem;
                }

                .post-content img {
                  border-radius: 1.5rem;
                  margin: 3rem 0;
                  box-shadow: 0 20px 40px -20px rgba(0,0,0,0.1);
                }
              `}</style>
              <div 
                className="post-content"
                dangerouslySetInnerHTML={{ __html: post.description }}
              />
            </div>

            {/* APPLY BUTTONS - MOVED BELOW CONTENT */}
            {(post.externalLink || post.whatsappNumber) && (
              <div className="mt-12 pt-12 border-t border-gray-100 dark:border-gray-800 flex flex-col md:flex-row gap-4">
                {post.externalLink && (
                  <a 
                    href={post.externalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-10 py-5 bg-primary text-white font-black text-sm uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex-1 text-center"
                  >
                    {post.ctaText || post.externalLinkText || 'Apply Now'}
                    <ArrowRight className="ml-3 h-5 w-5" />
                  </a>
                )}
                
                {post.whatsappNumber && (
                  <a 
                    href={`https://wa.me/${post.whatsappNumber.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-10 py-5 bg-green-500 text-white font-black text-sm uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-green-500/20 hover:scale-[1.02] active:scale-95 transition-all flex-1 text-center"
                  >
                    {post.whatsappButtonText || 'Contact on WhatsApp'}
                    <MessageCircle className="ml-3 h-5 w-5" />
                  </a>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PostDetail;
