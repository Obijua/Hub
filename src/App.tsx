import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { Blog } from './pages/Blog';
import { Category } from './pages/Category';
import { PostDetail } from './pages/PostDetail';
import { SearchPage } from './pages/Search';
import { JobsPage } from './pages/JobsPage';
import { JobDetailPage } from './pages/JobDetailPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminLogin } from './pages/AdminLogin';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminPosts } from './pages/AdminPosts';
import { AdminPostFormPage } from './pages/AdminPostFormPage';
import { AdminSettings } from './pages/AdminSettings';
import { SavedPosts } from './pages/SavedPosts';
import DocumentsPage from './pages/DocumentsPage';
import CVBuilder from './pages/CVBuilder';
import ProposalBuilder from './pages/ProposalBuilder';
import BusinessPlanBuilder from './pages/BusinessPlanBuilder';
import BundleBuilder from './pages/BundleBuilder';
import MyDocuments from './pages/MyDocuments';
import DocumentDownload from './pages/DocumentDownload';
import SuccessPage from './pages/SuccessPage';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { Disclaimer } from './pages/Disclaimer';
import { NotFound } from './pages/NotFound';
import { AuthProvider, useAuth } from './components/AuthProvider';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AnnouncementBanner } from './components/AnnouncementBanner';

import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from './components/ThemeProvider';
import { AdScriptInjector } from './components/ads/AdScriptInjector';
import { FloatingAd } from './components/ads/FloatingAd';
import { InterstitialAd } from './components/ads/InterstitialAd';
import { AdSlot } from './components/ads/AdSlot';
import AdUnit from './components/AdUnit';
import { Toaster } from 'sonner';
import { SiteConfigProvider } from './components/SiteConfigContext';
import PushNotificationBanner from './components/PushNotificationBanner';
import { useState, useEffect } from 'react';
import { doc, getDocFromServer } from 'firebase/firestore';
import { db } from './lib/firebase';
import { initGA, trackPageView } from './lib/analytics';

const AppRoutes = () => {
  const { profile, loading: authLoading } = useAuth();
  const [maintenance, setMaintenance] = useState(false);
  const [maintenanceMsg, setMaintenanceMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [timedOut, setTimedOut] = useState(false);
  const location = useLocation();

  useEffect(() => {
    initGA();
  }, []);

  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimedOut(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Ad script injection is now handled by AdScriptInjector component

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // Use getDocFromServer to bypass cache and verify real connection
        const snap = await getDocFromServer(doc(db, 'settings', 'siteConfig'));
        const data = snap.data();
        if (data?.maintenanceMode && profile?.role !== 'admin') {
          setMaintenance(true);
          setMaintenanceMsg(
            data.maintenanceMessage || 
            'We are performing scheduled maintenance. Back soon!'
          );
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchSettings();
    }
  }, [authLoading, profile]);

  if (!timedOut && (loading || authLoading)) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (maintenance) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center p-6 text-center">
        <div className="max-w-md">
          <div className="text-6xl mb-6">🔧</div>
          <h1 className="text-3xl font-black text-white mb-4" style={{ fontFamily: 'Georgia, serif' }}>
            Under Maintenance
          </h1>
          <p className="text-blue-200 text-lg leading-relaxed mb-8">
            {maintenanceMsg}
          </p>
          <div className="flex justify-center gap-4">
            <a href="https://t.me/HubAndJobs" target="_blank" rel="noopener noreferrer"
              className="px-6 py-3 bg-white text-primary font-black rounded-2xl hover:bg-accent transition-all">
              Join Telegram for Updates
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-950 transition-colors duration-300">
      <AnnouncementBanner />
      <Navbar />
      <AdSlot zone="navbar-banner-after" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/jobs/:jobId" element={<JobDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/category/:slug" element={<Category />} />
          <Route path="/post/:slug" element={<JobDetailPage />} />
          <Route path="/saved" element={<SavedPosts />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/documents/cv" element={<CVBuilder />} />
          <Route path="/documents/proposal" element={<ProposalBuilder />} />
          <Route path="/documents/business-plan" element={<BusinessPlanBuilder />} />
          <Route path="/documents/bundle" element={<BundleBuilder />} />
          <Route path="/my-documents" element={<MyDocuments />} />
          <Route path="/documents/:type/download/:docId" element={<DocumentDownload />} />
          <Route path="/documents/success" element={<SuccessPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/disclaimer" element={<Disclaimer />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/posts" 
            element={
              <ProtectedRoute>
                <AdminPosts />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/posts/new" 
            element={
              <ProtectedRoute>
                <AdminPostFormPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/posts/edit/:id" 
            element={
              <ProtectedRoute>
                <AdminPostFormPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/settings" 
            element={
              <ProtectedRoute>
                <AdminSettings />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <AdSlot zone="before-footer" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AdUnit slot="pre_footer" />
      </div>
      <Footer />
      <BottomNav />
      <FloatingAd />
      <PushNotificationBanner />
    </div>
  );
};

export default function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <AuthProvider>
          <SiteConfigProvider>
            <Toaster position="top-right" richColors />
            <AdScriptInjector />
            <InterstitialAd />
            <Router>
              <AppRoutes />
            </Router>
          </SiteConfigProvider>
        </AuthProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}
