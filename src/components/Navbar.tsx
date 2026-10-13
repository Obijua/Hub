import { Link, useNavigate } from 'react-router-dom';
import { Briefcase, Menu, X, Sun, LogOut, Bookmark } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from './ThemeProvider';
import { useAuth } from './AuthProvider';
import { auth, db } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { CategoryConfig } from '../types';
import { useBookmarks } from '../hooks/useBookmarks';

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

  return (
    <nav style={{ backgroundColor: '#1E3B8B' }} className="sticky top-0 z-50 border-b border-white/10 h-16">
      <div className="max-w-7xl mx-auto px-4 h-full">
        <div className="flex items-center justify-between h-full">
          {/* Logo - Top Left */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-sm flex items-center justify-center shadow-sm">
              <Briefcase className="h-5 w-5 text-[#1E3B8B]" />
            </div>
            <span className="font-bold text-white text-lg tracking-tight">
              {(() => {
                const parts = siteName.split('&');
                if (parts.length === 2) {
                  return (
                    <>
                      {parts[0]}<span className="text-[#E8B736]">&</span>{parts[1]}
                    </>
                  );
                }
                return siteName;
              })()}
            </span>
          </Link>

          {/* Icons & Menu - Top Right */}
          <div className="flex items-center space-x-1">
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-sm text-white hover:text-white/80 transition-colors"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Side Drawer Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 top-16 bg-black/40 z-40"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'fixed',
                top: '4rem',
                right: 0,
                bottom: 0,
                width: '50vw',
                minWidth: '220px',
                maxWidth: '300px',
                background: '#fff',
                overflowY: 'auto',
                paddingBottom: '96px',
              }}
              className="z-50 shadow-sm bg-white"
            >
              <div className="p-4 space-y-4">
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-3 py-1">Main Links</h3>
                  {staticLinks.map((link) => (
                    <Link
                      key={link.name}
                      to={link.path}
                      onClick={() => setIsOpen(false)}
                      style={{ fontSize: '15px', paddingTop: '12px', paddingBottom: '12px' }}
                      className="block px-3 rounded-sm text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                    >
                      {link.name}
                    </Link>
                  ))}
                </div>
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-3 py-1">Categories</h3>
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/category/${cat.slug}`}
                      onClick={() => setIsOpen(false)}
                      style={{ fontSize: '15px', paddingTop: '12px', paddingBottom: '12px' }}
                      className="block px-3 rounded-sm text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>

                <div className="pt-4 border-t border-gray-100 space-y-4 px-3">
                  <div className="flex items-center justify-between">
                    <button 
                      onClick={toggleTheme}
                      style={{ fontSize: '15px', paddingTop: '12px', paddingBottom: '12px' }}
                      className="flex items-center gap-2 text-gray-600 font-medium rounded-sm hover:bg-gray-50 px-2 transition-colors"
                    >
                      <Sun className="h-5 w-5" /> Mode Selection
                    </button>
                    <Link 
                      to="/saved" 
                      onClick={() => setIsOpen(false)}
                      className="relative p-2 rounded-sm bg-gray-50 text-gray-600"
                    >
                      <Bookmark className="h-5 w-5" />
                      {bookmarks.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-[10px] rounded-sm flex items-center justify-center">{bookmarks.length}</span>}
                    </Link>
                  </div>

                  {user ? (
                    <div className="flex flex-col gap-2">
                      {profile?.role === 'admin' && (
                        <Link to="/admin" onClick={() => setIsOpen(false)} style={{ fontSize: '15px', paddingTop: '12px', paddingBottom: '12px' }} className="w-full bg-[#1E3B8B] text-white rounded-sm font-bold text-center">
                          Admin Dashboard
                        </Link>
                      )}
                      <button onClick={() => { auth.signOut(); setIsOpen(false); }} style={{ fontSize: '15px', paddingTop: '12px', paddingBottom: '12px' }} className="w-full bg-gray-100 text-gray-600 rounded-sm font-bold flex items-center justify-center gap-2">
                        <LogOut className="h-4 w-4" /> Sign Out
                      </button>
                    </div>
                  ) : (
                    <Link to="/admin/login" onClick={() => setIsOpen(false)} style={{ fontSize: '15px', paddingTop: '12px', paddingBottom: '12px' }} className="block w-full bg-[#1E3B8B] text-white rounded-sm font-bold text-center">
                      Log In
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
