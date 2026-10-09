import { Link, useNavigate } from 'react-router-dom';
import { Briefcase, Menu, X, Search, Sun, Moon, User, LayoutDashboard, LogOut, Bookmark, Files } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useTheme } from './ThemeProvider';
import { useAuth } from './AuthProvider';
import { auth, db } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { CategoryConfig, SiteConfig } from '../types';
import { useBookmarks } from '../hooks/useBookmarks';
import { trackEvent } from '../lib/analytics';

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { toggleTheme } = useTheme();
  const { user, profile } = useAuth();
  const { bookmarks } = useBookmarks();
  const [categories, setCategories] = useState<CategoryConfig[]>([]);
  const [siteName, setSiteName] = useState('Hub & Jobs');

  useEffect(() => {
    // Fetch active categories
    const q = query(
      collection(db, 'categories'), 
      where('isActive', '==', true),
      orderBy('displayOrder', 'asc')
    );
    const unsubCategories = onSnapshot(q, (snap) => {
      setCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as CategoryConfig)));
    }, (error) => {
      console.error('Error fetching categories:', error);
    });

    // Fetch site name
    const unsubSite = onSnapshot(doc(db, 'settings', 'siteConfig'), (doc) => {
      if (doc.exists()) {
        setSiteName(doc.data().siteName || 'Hub & Jobs');
      }
    }, (error) => {
      console.error('Error fetching site config:', error);
    });

    return () => {
      unsubCategories();
      unsubSite();
    };
  }, []);

  const staticLinks = [
    { name: 'Home', path: '/' },
    { name: 'Jobs', path: '/jobs' },
    { name: 'Blog', path: '/blog' },
    { name: 'Documents', path: '/documents' },
    { name: 'About', path: '/about' },
  ];

  const navLinks = [
    ...staticLinks,
    ...categories.map(cat => ({
      name: cat.name,
      path: `/category/${cat.slug}`
    }))
  ];

  return (
    <nav className="bg-white dark:bg-gray-900 sticky top-0 z-50 border-b border-gray-100 dark:border-gray-800 h-16">
      <div className="max-w-7xl mx-auto px-4 h-full">
        <div className="flex items-center justify-between h-full">
          {/* Logo - Top Left */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white text-lg tracking-tight">
              {siteName}
            </span>
          </Link>

          {/* Icons & Menu - Top Right */}
          <div className="flex items-center space-x-1">
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Slide-down Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-16 left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shadow-xl lg:max-w-7xl lg:mx-auto"
          >
            <div className="px-4 py-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-3">Main Links</h3>
                  {staticLinks.map((link) => (
                    <Link
                      key={link.name}
                      to={link.path}
                      onClick={() => setIsOpen(false)}
                      className="block px-3 py-2 rounded-xl text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      {link.name}
                    </Link>
                  ))}
                </div>
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-3">Categories</h3>
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/category/${cat.slug}`}
                      onClick={() => setIsOpen(false)}
                      className="block px-3 py-2 rounded-xl text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-4">
                <div className="flex items-center justify-between">
                  <button 
                    onClick={toggleTheme}
                    className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-300 font-medium"
                  >
                    <Sun className="h-5 w-5" /> Mode Selection
                  </button>
                  <Link 
                    to="/saved" 
                    onClick={() => setIsOpen(false)}
                    className="relative p-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                  >
                    <Bookmark className="h-5 w-5" />
                    {bookmarks.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-[10px] rounded-full flex items-center justify-center">{bookmarks.length}</span>}
                  </Link>
                </div>

                {user ? (
                  <div className="flex flex-col gap-2">
                    {profile?.role === 'admin' && (
                      <Link to="/admin" onClick={() => setIsOpen(false)} className="w-full py-3 px-4 bg-accent text-white rounded-xl font-bold text-center">
                        Admin Dashboard
                      </Link>
                    )}
                    <button onClick={() => { auth.signOut(); setIsOpen(false); }} className="w-full py-3 px-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl font-bold flex items-center justify-center gap-2">
                      <LogOut className="h-4 w-4" /> Sign Out
                    </button>
                  </div>
                ) : (
                  <Link to="/admin/login" onClick={() => setIsOpen(false)} className="block w-full py-3 px-4 bg-primary text-white rounded-xl font-bold text-center shadow-lg shadow-primary/20 dark:shadow-none">
                    Log In
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
