import { useState, useEffect } from 'react';
import { db, storage, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  Timestamp,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'sonner';
import { 
  Settings, 
  FolderTree, 
  Share2, 
  Globe, 
  Megaphone, 
  Mail, 
  User, 
  Save, 
  Plus, 
  Star,
  Trash2, 
  Edit2, 
  Check, 
  X, 
  ExternalLink, 
  Download,
  FileText,
  Eye,
  EyeOff,
  AlertTriangle,
  Loader2,
  ChevronRight,
  ChevronLeft,
  DollarSign,
  Layout,
  Smartphone,
  ShieldCheck,
  Send,
  TrendingUp,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CategoryConfig, SocialLinks, SiteConfig, BannerConfig, Subscriber, UserProfile, MonetizationConfig } from '../types';
import { format } from 'date-fns';

import { DocumentSettings } from '../components/admin/DocumentSettings';

type Tab = 'categories' | 'social' | 'site' | 'banner' | 'monetization' | 'documents' | 'newsletter' | 'push' | 'account';

export const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const saved = localStorage.getItem('admin_settings_tab');
    if (saved && ['categories', 'social', 'site', 'banner', 'monetization', 'documents', 'newsletter', 'push', 'account'].includes(saved)) {
      return saved as Tab;
    }
    return 'categories';
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Categories State
  const [categories, setCategories] = useState<CategoryConfig[]>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryConfig | null>(null);

  // Social Links State
  const [socialLinks, setSocialLinks] = useState<SocialLinks | null>(null);

  // Site Config State
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);

  // Banner State
  const [banner, setBanner] = useState<BannerConfig | null>(null);

  // Newsletter State
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [newsletterEnabled, setNewsletterEnabled] = useState(true);

  // Account State
  const [adminProfile, setAdminProfile] = useState<UserProfile | null>(null);

  // Push Subscribers State
  const [pushSubscribers, setPushSubscribers] = useState<any[]>([]);

  // Monetization State
  const [monetization, setMonetization] = useState<MonetizationConfig | null>(null);

  // Documents State
  const [documentSettings, setDocumentSettings] = useState<any>(null);
  const [promoCodes, setPromoCodes] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'categories') {
        const q = query(collection(db, 'categories'), orderBy('displayOrder', 'asc'));
        const snap = await getDocs(q);
        setCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as CategoryConfig)));
      } else if (activeTab === 'social') {
        const docSnap = await getDoc(doc(db, 'settings', 'socialLinks'));
        if (docSnap.exists()) setSocialLinks(docSnap.data() as SocialLinks);
      } else if (activeTab === 'site') {
        const docSnap = await getDoc(doc(db, 'settings', 'siteConfig'));
        if (docSnap.exists()) setSiteConfig(docSnap.data() as SiteConfig);
      } else if (activeTab === 'banner') {
        const docSnap = await getDoc(doc(db, 'settings', 'banner'));
        if (docSnap.exists()) setBanner(docSnap.data() as BannerConfig);
      } else if (activeTab === 'monetization') {
        const docSnap = await getDoc(doc(db, 'settings', 'monetization'));
        if (docSnap.exists()) setMonetization(docSnap.data() as MonetizationConfig);
      } else if (activeTab === 'documents') {
        const [settingsSnap, promoSnap] = await Promise.all([
          getDoc(doc(db, 'settings', 'documents')),
          getDocs(query(collection(db, 'promo_codes'), orderBy('createdAt', 'desc')))
        ]);
        if (settingsSnap.exists()) setDocumentSettings(settingsSnap.data());
        setPromoCodes(promoSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } else if (activeTab === 'newsletter') {
        const q = query(collection(db, 'subscribers'), orderBy('subscribedAt', 'desc'));
        const snap = await getDocs(q);
        setSubscribers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subscriber)));
      } else if (activeTab === 'push') {
        const q = query(collection(db, 'push_subscribers'), orderBy('subscribedAt', 'desc'));
        const snap = await getDocs(q);
        setPushSubscribers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } else if (activeTab === 'account') {
        if (auth.currentUser) {
          const docSnap = await getDoc(doc(db, 'users', auth.currentUser.uid));
          if (docSnap.exists()) setAdminProfile(docSnap.data() as UserProfile);
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, activeTab === 'categories' ? 'categories' : activeTab === 'newsletter' ? 'subscribers' : `settings/${activeTab}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (tab: Tab, data: any) => {
    setSaving(true);
    try {
      if (tab === 'social') {
        await setDoc(doc(db, 'settings', 'socialLinks'), data);
      } else if (tab === 'site') {
        await setDoc(doc(db, 'settings', 'siteConfig'), data);
      } else if (tab === 'banner') {
        await setDoc(doc(db, 'settings', 'banner'), data);
      } else if (tab === 'monetization') {
        await setDoc(doc(db, 'settings', 'monetization'), data);
      } else if (tab === 'documents') {
        await setDoc(doc(db, 'settings', 'documents'), data);
      } else if (tab === 'account') {
        if (auth.currentUser) {
          await updateDoc(doc(db, 'users', auth.currentUser.uid), data);
        }
      }
      setHasUnsavedChanges(false);
      toast.success('Settings saved successfully!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `settings/${tab}`);
    } finally {
      setSaving(false);
    }
  };

  const exportSubscribers = () => {
    const csv = [
      ['Email', 'Subscribed At'],
      ...subscribers.map(s => [s.email, format(s.subscribedAt.toDate(), 'yyyy-MM-dd HH:mm:ss')])
    ].map(e => e.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `subscribers_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const deleteSubscriber = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'subscribers', id));
      setSubscribers(subscribers.filter(s => s.id !== id));
      toast.success('Subscriber deleted');
    } catch (error) {
      console.error('Error deleting subscriber:', error);
      toast.error('Failed to delete subscriber');
    }
  };

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'categories', label: 'Categories', icon: FolderTree },
    { id: 'social', label: 'Social Links', icon: Share2 },
    { id: 'site', label: 'Site Config', icon: Globe },
    { id: 'monetization', label: 'Monetization', icon: DollarSign },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'banner', label: 'Banner', icon: Megaphone },
    { id: 'newsletter', label: 'Newsletter', icon: Mail },
    { id: 'push', label: 'Push Alerts', icon: Bell },
    { id: 'account', label: 'Account', icon: User },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-20 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center space-x-4 mb-8">
          <div className="p-3 bg-primary/10 rounded-2xl">
            <Settings className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Admin Settings</h1>
            <p className="text-gray-500 dark:text-gray-400">Configure your platform preferences</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto pb-4 mb-8 no-scrollbar space-x-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                localStorage.setItem('admin_settings_tab', tab.id);
                setHasUnsavedChanges(false);
              }}
              className={`flex items-center space-x-2 px-6 py-3 rounded-2xl font-bold text-sm whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 p-4 sm:p-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                  <p className="text-gray-500">Loading settings...</p>
                </div>
              ) : (
                <>
                  {activeTab === 'categories' && (
                    <CategoryManagement 
                      categories={categories} 
                      onRefresh={fetchData} 
                    />
                  )}
                  {activeTab === 'social' && (
                    <SocialSettings 
                      initialData={socialLinks} 
                      onSave={(data) => handleSave('social', data)}
                      saving={saving}
                      onChange={() => setHasUnsavedChanges(true)}
                    />
                  )}
                  {activeTab === 'site' && (
                    <SiteSettings 
                      initialData={siteConfig} 
                      onSave={(data) => handleSave('site', data)}
                      saving={saving}
                      onChange={() => setHasUnsavedChanges(true)}
                    />
                  )}
                  {activeTab === 'banner' && (
                    <BannerSettings 
                      initialData={banner} 
                      onSave={(data) => handleSave('banner', data)}
                      saving={saving}
                      onChange={() => setHasUnsavedChanges(true)}
                    />
                  )}
                  {activeTab === 'monetization' && (
                    <MonetizationSettings 
                      initialData={monetization} 
                      onSave={(data) => handleSave('monetization', data)}
                      saving={saving}
                      onChange={() => setHasUnsavedChanges(true)}
                    />
                  )}
                  {activeTab === 'documents' && (
                    <DocumentSettings 
                      initialData={documentSettings} 
                      promoCodes={promoCodes}
                      onSave={(data) => handleSave('documents', data)}
                      onRefreshPromoCodes={fetchData}
                      saving={saving}
                      onChange={() => setHasUnsavedChanges(true)}
                    />
                  )}
                  {activeTab === 'newsletter' && (
                    <NewsletterSettings 
                      subscribers={subscribers} 
                      onDelete={deleteSubscriber}
                      onExport={exportSubscribers}
                    />
                  )}
                  {activeTab === 'push' && (
                    <PushSettings 
                      subscribers={pushSubscribers}
                      onRefresh={fetchData}
                    />
                  )}
                  {activeTab === 'account' && (
                    <AccountSettings 
                      profile={adminProfile} 
                      onSave={(data) => handleSave('account', data)}
                      saving={saving}
                      onChange={() => setHasUnsavedChanges(true)}
                    />
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

// --- Sub-components ---

const MonetizationSettings = ({ initialData, onSave, saving, onChange }: any) => {
  const [data, setData] = useState<MonetizationConfig>(initialData || {
    masterSwitch: true,
    homepageAdsEnabled: true,
    homepageAdNetwork: 'AdSense',
    homepageAdCode: '',
    homepageAdFrequency: 3,
    homepageMaxAds: 5,
    heroAdEnabled: false,
    heroAdCode: '',
    articleAdsEnabled: true,
    articleAdNetwork: 'AdSense',
    articleAdCode: '',
    articleAdFrequency: 2,
    articleMaxAds: 6,
    aboveArticleAdEnabled: true,
    belowArticleAdEnabled: true,
    sidebarAdEnabled: true,
    sidebarAdCode: '',
    blogAdsEnabled: true,
    adsTargetGlobalScript: '',
    adsenseEnabled: false,
    adsensePublisherId: '',
    adsenseInArticleSlot: '',
    adsenseAutoAdsEnabled: false,
    adsterraEnabled: false,
    adsterraInArticleCode: '',
    adsterraSocialBarCode: '',
    adsterraPopunderCode: '',
    monetagEnabled: false,
    monetagSiteId: '',
    monetagInPagePushCode: '',
    monetagInArticleCode: '',
    monetagPushNotificationsEnabled: false,
    adFrequency: 2,
    maxAdsPerArticle: 6,
    hideAdsOnMobile: false,
    hideAdsForAdmin: true,
  });

  const handleChange = (field: string, value: any) => {
    const finalValue = typeof value === 'number' && isNaN(value) ? 0 : value;
    setData({ ...data, [field as keyof MonetizationConfig]: finalValue });
    onChange();
  };

  const networks = ['AdSense', 'Adsterra', 'AdsTarget', 'Monetag', 'Custom Code', 'Off'];

  return (
    <div className="space-y-12">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-amber-100 dark:bg-amber-900/20 rounded-2xl">
            <DollarSign className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white">Ad Monetization</h2>
            <p className="text-sm text-gray-500">Manage your ad networks and placements</p>
          </div>
        </div>
        <button 
          onClick={() => onSave(data)}
          disabled={saving}
          className="flex items-center space-x-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-blue-900 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span>Save Ad Settings</span>
        </button>
      </div>

      {/* Global Switch */}
      <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-primary/10 rounded-2xl">
            <Megaphone className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-black text-gray-900 dark:text-white">Enable Ads on Site</h3>
            <p className="text-xs text-gray-500">Master switch to turn all ads on or off</p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            checked={data.masterSwitch}
            onChange={(e) => handleChange('masterSwitch', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
        </label>
      </div>

      {/* Homepage Ads */}
      <div className="p-8 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-8">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center space-x-2">
            <Layout className="h-5 w-5 text-primary" />
            <span>Homepage Ads</span>
          </h3>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={data.homepageAdsEnabled}
              onChange={(e) => handleChange('homepageAdsEnabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Ad Network</label>
            <select 
              value={data.homepageAdNetwork}
              onChange={(e) => handleChange('homepageAdNetwork', e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all font-bold"
            >
              {networks.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">In-Feed Frequency</label>
              <input 
                type="number"
                value={isNaN(Number(data.homepageAdFrequency)) ? '' : data.homepageAdFrequency}
                onChange={(e) => handleChange('homepageAdFrequency', parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Max In-Feed Ads</label>
              <input 
                type="number"
                value={isNaN(Number(data.homepageMaxAds)) ? '' : data.homepageMaxAds}
                onChange={(e) => handleChange('homepageMaxAds', parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all font-bold"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Homepage Ad Code</label>
          <textarea 
            placeholder="Paste ad code here..."
            value={data.homepageAdCode}
            onChange={(e) => handleChange('homepageAdCode', e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all h-24 font-mono text-xs resize-none"
          />
        </div>

        <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">Hero Section Ad</p>
              <p className="text-[10px] text-gray-500">Show ad at the top of homepage</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={data.heroAdEnabled}
                onChange={(e) => handleChange('heroAdEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </label>
          </div>
          <textarea 
            placeholder="Hero ad code..."
            value={data.heroAdCode}
            onChange={(e) => handleChange('heroAdCode', e.target.value)}
            className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all h-20 font-mono text-xs resize-none"
          />
        </div>
      </div>

      {/* Post Detail Ads */}
      <div className="p-8 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-8">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center space-x-2">
            <FileText className="h-5 w-5 text-primary" />
            <span>Post Detail Page Ads</span>
          </h3>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={data.articleAdsEnabled}
              onChange={(e) => handleChange('articleAdsEnabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Ad Network</label>
            <select 
              value={data.articleAdNetwork}
              onChange={(e) => handleChange('articleAdNetwork', e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all font-bold"
            >
              {networks.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">In-Article Frequency</label>
              <input 
                type="number"
                value={isNaN(Number(data.articleAdFrequency)) ? '' : data.articleAdFrequency}
                onChange={(e) => handleChange('articleAdFrequency', parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Max Ads</label>
              <input 
                type="number"
                value={isNaN(Number(data.articleMaxAds)) ? '' : data.articleMaxAds}
                onChange={(e) => handleChange('articleMaxAds', parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all font-bold"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Article Ad Code</label>
          <textarea 
            placeholder="Paste ad code here..."
            value={data.articleAdCode}
            onChange={(e) => handleChange('articleAdCode', e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all h-24 font-mono text-xs resize-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <span className="text-xs font-bold">Above Content</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={data.aboveArticleAdEnabled}
                onChange={(e) => handleChange('aboveArticleAdEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </label>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <span className="text-xs font-bold">Below Content</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={data.belowArticleAdEnabled}
                onChange={(e) => handleChange('belowArticleAdEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </label>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <span className="text-xs font-bold">Sidebar Ad</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={data.sidebarAdEnabled}
                onChange={(e) => handleChange('sidebarAdEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>

        {data.sidebarAdEnabled && (
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Sidebar Ad Code</label>
            <textarea 
              placeholder="Sidebar ad code..."
              value={data.sidebarAdCode}
              onChange={(e) => handleChange('sidebarAdCode', e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all h-24 font-mono text-xs resize-none"
            />
          </div>
        )}
      </div>

      {/* Blog/Category Ads */}
      <div className="p-8 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-8">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center space-x-2">
            <FolderTree className="h-5 w-5 text-primary" />
            <span>Blog & Category Page Ads</span>
          </h3>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={data.blogAdsEnabled}
              onChange={(e) => handleChange('blogAdsEnabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
          </label>
        </div>
        <p className="text-sm text-gray-500">Enable or disable ads on blog listing and category pages.</p>
      </div>

      {/* Google AdSense Section */}
      <div className="p-8 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center font-black text-amber-600">
              G
            </div>
            <div>
              <h4 className="font-black text-gray-900 dark:text-white text-lg">Google AdSense</h4>
              <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Auto Ads & Units</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={data.adsenseEnabled}
              onChange={(e) => handleChange('adsenseEnabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
          </label>
        </div>

        {data.adsenseEnabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Publisher ID (ca-pub-xxx)</label>
              <input 
                type="text"
                value={data.adsensePublisherId}
                onChange={(e) => handleChange('adsensePublisherId', e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">In-Article Ad Slot</label>
              <input 
                type="text"
                value={data.adsenseInArticleSlot}
                onChange={(e) => handleChange('adsenseInArticleSlot', e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all font-mono"
              />
            </div>
          </div>
        )}
      </div>

      {/* Adsterra Settings */}
      <div className="p-8 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center font-black text-orange-600 text-xl">
              A
            </div>
            <div>
              <h4 className="font-black text-gray-900 dark:text-white text-lg">Adsterra Settings</h4>
              <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Social Bar, Popunder & In-Article</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={data.adsterraEnabled}
              onChange={(e) => handleChange('adsterraEnabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-orange-600"></div>
          </label>
        </div>

        {data.adsterraEnabled && (
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Social Bar Code (SocialBar ad unit)</label>
              <textarea 
                placeholder="Paste Social Bar code..."
                value={data.adsterraSocialBarCode}
                onChange={(e) => handleChange('adsterraSocialBarCode', e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-orange-600 transition-all h-24 font-mono text-xs resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Popunder Code</label>
              <textarea 
                placeholder="Paste Popunder code..."
                value={data.adsterraPopunderCode}
                onChange={(e) => handleChange('adsterraPopunderCode', e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-orange-600 transition-all h-24 font-mono text-xs resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">In-Article Ad Code</label>
              <textarea 
                placeholder="Paste In-Article code..."
                value={data.adsterraInArticleCode}
                onChange={(e) => handleChange('adsterraInArticleCode', e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-orange-600 transition-all h-24 font-mono text-xs resize-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Monetag Settings */}
      <div className="p-8 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center font-black text-blue-600 text-xl">
              M
            </div>
            <div>
              <h4 className="font-black text-gray-900 dark:text-white text-lg">Monetag Settings</h4>
              <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Push Notifications & In-Page Push</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={data.monetagEnabled}
              onChange={(e) => handleChange('monetagEnabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {data.monetagEnabled && (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Monetag Site ID (Project ID)</label>
              <input 
                type="text"
                placeholder="e.g. 123456"
                value={data.monetagSiteId}
                onChange={(e) => handleChange('monetagSiteId', e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-blue-600 transition-all font-bold"
              />
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">Push Notifications</p>
                <p className="text-[10px] text-gray-500">Enable native browser push notifications</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={data.monetagPushNotificationsEnabled}
                  onChange={(e) => handleChange('monetagPushNotificationsEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">In-Page Push Code</label>
              <textarea 
                placeholder="Paste In-Page Push code..."
                value={data.monetagInPagePushCode}
                onChange={(e) => handleChange('monetagInPagePushCode', e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-blue-600 transition-all h-24 font-mono text-xs resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">In-Article Code</label>
              <textarea 
                placeholder="Paste In-Article code..."
                value={data.monetagInArticleCode}
                onChange={(e) => handleChange('monetagInArticleCode', e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-blue-600 transition-all h-24 font-mono text-xs resize-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* AdsTarget Section */}
      <div className="p-8 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center font-black text-indigo-600">
            T
          </div>
          <div>
            <h4 className="font-black text-gray-900 dark:text-white text-lg">AdsTarget</h4>
            <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Global Ad Network</p>
          </div>
        </div>
        <div>
          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">AdsTarget Global Script</label>
          <textarea 
            placeholder="Paste AdsTarget global script here..."
            value={data.adsTargetGlobalScript}
            onChange={(e) => handleChange('adsTargetGlobalScript', e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all h-24 font-mono text-xs resize-none"
          />
          <p className="mt-2 text-[10px] text-gray-500">This script will be added to the head of every page.</p>
        </div>
      </div>

      {/* Visibility Settings */}
      <div className="p-8 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border border-gray-100 dark:border-gray-800">
        <h3 className="text-lg font-black text-gray-900 dark:text-white mb-8 flex items-center space-x-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          <span>General Visibility Settings</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Hide ads on mobile</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={data.hideAdsOnMobile}
                onChange={(e) => handleChange('hideAdsOnMobile', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </label>
          </div>
          <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Hide ads for admin</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={data.hideAdsForAdmin}
                onChange={(e) => handleChange('hideAdsForAdmin', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

const CategoryManagement = ({ categories, onRefresh }: { categories: CategoryConfig[], onRefresh: () => void }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryConfig | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<CategoryConfig>>({
    name: '',
    slug: '',
    icon: '💼',
    color: '#3b82f6',
    description: '',
    displayOrder: categories.length + 1,
    isActive: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateDoc(doc(db, 'categories', editing.id), formData);
      } else {
        await addDoc(collection(db, 'categories'), formData);
      }
      setIsModalOpen(false);
      setEditing(null);
      onRefresh();
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'categories', id));
      setDeletingId(null);
      onRefresh();
      toast.success('Category deleted successfully!');
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black text-gray-900 dark:text-white">Category Management</h2>
        <button 
          onClick={() => {
            setEditing(null);
            setFormData({ name: '', slug: '', icon: '💼', color: '#3b82f6', description: '', displayOrder: categories.length + 1, isActive: true });
            setIsModalOpen(true);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-xl font-bold text-sm hover:bg-blue-900 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Add New</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <th className="pb-4 font-black text-xs uppercase tracking-widest text-gray-400">Icon</th>
              <th className="pb-4 font-black text-xs uppercase tracking-widest text-gray-400">Name</th>
              <th className="pb-4 font-black text-xs uppercase tracking-widest text-gray-400">Slug</th>
              <th className="pb-4 font-black text-xs uppercase tracking-widest text-gray-400">Order</th>
              <th className="pb-4 font-black text-xs uppercase tracking-widest text-gray-400">Status</th>
              <th className="pb-4 font-black text-xs uppercase tracking-widest text-gray-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {categories.map((cat) => (
              <tr key={cat.id} className="group">
                <td className="py-4">
                  <span className="text-2xl">{cat.icon}</span>
                </td>
                <td className="py-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
                    <span className="font-bold text-gray-900 dark:text-white">{cat.name}</span>
                  </div>
                </td>
                <td className="py-4 text-sm text-gray-500">{cat.slug}</td>
                <td className="py-4 text-sm font-mono">{cat.displayOrder}</td>
                <td className="py-4">
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                    cat.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {cat.isActive ? 'Active' : 'Hidden'}
                  </span>
                </td>
                <td className="py-4 text-right">
                  <div className="flex justify-end space-x-2">
                    {deletingId === cat.id ? (
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleDelete(cat.id)}
                          className="px-3 py-1 bg-red-500 text-white text-[10px] font-black uppercase rounded-lg hover:bg-red-600 transition-all"
                        >
                          Confirm
                        </button>
                        <button 
                          onClick={() => setDeletingId(null)}
                          className="px-3 py-1 bg-gray-100 text-gray-500 text-[10px] font-black uppercase rounded-lg hover:bg-gray-200 transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <button 
                          onClick={() => {
                            setEditing(cat);
                            setFormData(cat);
                            setIsModalOpen(true);
                          }}
                          className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => setDeletingId(cat.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md p-8"
          >
            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-6">
              {editing ? 'Edit Category' : 'Add New Category'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Name</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Slug</label>
                  <input 
                    type="text" 
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Icon (Emoji)</label>
                  <input 
                    type="text" 
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Color</label>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="color" 
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-12 h-12 p-1 bg-gray-50 dark:bg-gray-800 rounded-xl cursor-pointer"
                    />
                    <span className="text-sm font-mono text-gray-500 uppercase">{formData.color}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Description</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all h-24 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Display Order</label>
                  <input 
                    type="number" 
                    value={formData.displayOrder || ''}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setFormData({ ...formData, displayOrder: isNaN(val) ? 0 : val });
                    }}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>
                <div className="flex items-end pb-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Is Active</span>
                  </label>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-xl font-bold hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-blue-900 transition-all"
                >
                  {editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const SocialSettings = ({ initialData, onSave, saving, onChange }: any) => {
  const [data, setData] = useState<SocialLinks>(initialData || {
    whatsappGroup: { id: 'whatsappGroup', label: 'WhatsApp Group', url: '', icon: 'MessageCircle', isActive: true },
    whatsappChannel: { id: 'whatsappChannel', label: 'WhatsApp Channel', url: '', icon: 'MessageCircle', isActive: true },
    telegramGroup: { id: 'telegramGroup', label: 'Telegram Group', url: '', icon: 'Send', isActive: true },
    telegramChannel: { id: 'telegramChannel', label: 'Telegram Channel', url: '', icon: 'Send', isActive: true },
    twitter: { id: 'twitter', label: 'Twitter/X', url: '', icon: 'Twitter', isActive: true },
    instagram: { id: 'instagram', label: 'Instagram', url: '', icon: 'Instagram', isActive: true },
    facebook: { id: 'facebook', label: 'Facebook', url: '', icon: 'Facebook', isActive: true },
    youtube: { id: 'youtube', label: 'YouTube', url: '', icon: 'Youtube', isActive: true },
    linkedin: { id: 'linkedin', label: 'LinkedIn', url: '', icon: 'Linkedin', isActive: true },
    tiktok: { id: 'tiktok', label: 'TikTok', url: '', icon: 'Music2', isActive: true },
    telegramBot: { botToken: '', channelId: '', isAutoPostEnabled: false, messageTemplate: '<b>{title}</b>\n\n{description}\n\n🔗 <a href="{link}">Apply Here</a>\n\n#HubAndJobs #{category}' }
  });

  const updateLink = (key: keyof SocialLinks, field: string, value: any) => {
    setData({
      ...data,
      [key]: { ...data[key], [field]: value }
    });
    onChange();
  };

  const updateBot = (field: string, value: any) => {
    setData({
      ...data,
      telegramBot: { ...data.telegramBot!, [field]: value }
    });
    onChange();
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black text-gray-900 dark:text-white">Social & Community Links</h2>
        <button 
          onClick={() => onSave(data)}
          disabled={saving}
          className="flex items-center space-x-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-blue-900 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span>Save Changes</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(data)
          .filter(([key]) => key !== 'telegramBot')
          .map(([key, link]: [any, any]) => (
          <div key={key} className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                  <Share2 className="h-4 w-4 text-primary" />
                </div>
                <input 
                  type="text"
                  value={link.label}
                  onChange={(e) => updateLink(key, 'label', e.target.value)}
                  className="bg-transparent font-bold text-gray-900 dark:text-white outline-none border-b border-transparent focus:border-primary"
                />
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={link.isActive}
                  onChange={(e) => updateLink(key, 'isActive', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
              </label>
            </div>
            <div className="flex space-x-2">
              <input 
                type="url"
                placeholder="https://..."
                value={link.url}
                onChange={(e) => updateLink(key, 'url', e.target.value)}
                className="flex-1 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
              />
              <a 
                href={link.url} 
                target="_blank" 
                rel="noreferrer"
                className="p-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl hover:text-primary transition-all"
              >
                <ExternalLink className="h-5 w-5" />
              </a>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 pt-12 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center space-x-3 mb-8">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-2xl">
            <Send className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-black text-gray-900 dark:text-white">Telegram Auto-Post Bot</h3>
            <p className="text-xs text-gray-500">Automatically post new jobs to your Telegram channel</p>
          </div>
        </div>

        <div className="p-8 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border border-gray-100 dark:border-gray-800 space-y-6">
          <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-50 dark:bg-green-900/10 rounded-lg">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">Auto-Post Enabled</p>
                <p className="text-[10px] text-gray-500">New posts will be sent to Telegram automatically</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={data.telegramBot?.isAutoPostEnabled}
                onChange={(e) => updateBot('isAutoPostEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Bot Token</label>
              <input 
                type="password"
                placeholder="123456789:ABCDEF..."
                value={data.telegramBot?.botToken}
                onChange={(e) => updateBot('botToken', e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Channel ID</label>
              <input 
                type="text"
                placeholder="@mychannel or -100..."
                value={data.telegramBot?.channelId}
                onChange={(e) => updateBot('channelId', e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Message Template</label>
            <textarea 
              value={data.telegramBot?.messageTemplate}
              onChange={(e) => updateBot('messageTemplate', e.target.value)}
              placeholder="<b>{title}</b>\n\n{description}..."
              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all text-sm h-32 resize-none font-mono"
            />
            <p className="mt-2 text-[10px] text-gray-500">
              Available placeholders: <code className="text-primary">{'{title}'}</code>, <code className="text-primary">{'{description}'}</code>, <code className="text-primary">{'{link}'}</code>, <code className="text-primary">{'{category}'}</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const SiteSettings = ({ initialData, onSave, saving, onChange }: any) => {
  const [data, setData] = useState<SiteConfig>(initialData || {
    siteName: 'Hub & Jobs',
    tagline: 'Your Hub for Jobs & Opportunities',
    logoUrl: '',
    faviconUrl: '',
    contactEmail: 'support@hubandjobs.com',
    copyrightText: `© ${new Date().getFullYear()} Hub & Jobs. All rights reserved.`,
    metaDescription: "Hub & Jobs is Nigeria's #1 platform for the latest job vacancies, scholarships, free courses, Udemy coupons, internships and opportunities. Updated daily.",
    metaKeywords: 'jobs in Nigeria, scholarships for Nigerians, scholarships in Nigeria 2026, free online courses Nigeria, internships in Nigeria, remote jobs Nigeria, Nigerian graduates jobs, NYSC jobs Nigeria, federal government jobs Nigeria, state government jobs Nigeria, NGO jobs Nigeria, oil and gas jobs Nigeria, bank jobs Nigeria, tech jobs Nigeria Lagos, jobs in Lagos, jobs in Abuja, jobs in Port Harcourt, fully funded scholarships for Nigerians, undergraduate scholarships Nigeria, postgraduate scholarships Nigeria, masters scholarship Nigeria, PhD scholarship for Nigerians, Commonwealth scholarship Nigeria, Chevening scholarship Nigeria, MTN scholarship Nigeria, Shell scholarship Nigeria, free Udemy courses Nigeria, Udemy coupon Nigeria, free courses with certificate Nigeria, online courses for Nigerians, Coursera free courses Nigeria, paid internships Nigeria, graduate trainee programs Nigeria, SIWES internship Nigeria, opportunities for Nigerian youths, career opportunities Nigeria, hub and jobs',
    googleAnalyticsId: '',
    isMaintenanceMode: false,
    showFeaturedOnHome: true,
    heroHeadline: '',
    heroSubtitle: '',
    showHeroText: false,
    heroBgColor: '#1E3A8A',
    heroTextColor: '#ffffff',
    googleSearchConsoleId: '',
    bingWebmasterId: '',
    facebookPixelId: ''
  });

  const handleChange = (field: keyof SiteConfig, value: any) => {
    const finalValue = typeof value === 'number' && isNaN(value) ? 0 : value;
    setData({ ...data, [field]: finalValue });
    onChange();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-black text-gray-900 dark:text-white">General Site Settings</h2>
        <button 
          onClick={() => onSave(data)}
          disabled={saving}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-blue-900 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span>Save Changes</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
        <div className="lg:col-span-2 space-y-4 lg:space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Site Name</label>
                <input 
                  type="text"
                  value={data.siteName}
                  onChange={(e) => handleChange('siteName', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Tagline</label>
                <input 
                  type="text"
                  value={data.tagline}
                  onChange={(e) => handleChange('tagline', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Contact Email</label>
                <input 
                  type="email"
                  value={data.contactEmail}
                  onChange={(e) => handleChange('contactEmail', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Copyright Text</label>
                <input 
                  type="text"
                  value={data.copyrightText}
                  onChange={(e) => handleChange('copyrightText', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>

              <div className="p-6 bg-amber-50 dark:bg-amber-900/10 rounded-3xl border border-amber-100 dark:border-amber-900/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Star className="h-5 w-5 text-amber-500" />
                    <span className="font-bold text-gray-900 dark:text-white">Show Featured on Home</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={data.showFeaturedOnHome}
                      onChange={(e) => handleChange('showFeaturedOnHome', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                  </label>
                </div>
                <p className="text-xs text-gray-500">Toggle visibility of the Featured Opportunities section on the homepage.</p>
              </div>

              {/* Hero Banner Settings */}
              <div className="p-8 bg-blue-50 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-900/20 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Megaphone className="h-5 w-5 text-primary" />
                    <span className="font-bold text-gray-900 dark:text-white">Hero Banner Settings</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={data.showHeroText}
                      onChange={(e) => handleChange('showHeroText', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Hero Headline</label>
                    <input 
                      type="text"
                      placeholder="e.g. Your Hub for Jobs & Opportunities"
                      value={data.heroHeadline}
                      onChange={(e) => handleChange('heroHeadline', e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Hero Subtitle</label>
                    <textarea 
                      placeholder="e.g. Hub & Jobs is Nigeria's #1 platform..."
                      value={data.heroSubtitle}
                      onChange={(e) => handleChange('heroSubtitle', e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all h-24 resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Background Color</label>
                      <div className="flex items-center space-x-3">
                        <input 
                          type="color"
                          value={data.heroBgColor || '#1E3A8A'}
                          onChange={(e) => handleChange('heroBgColor', e.target.value)}
                          className="w-12 h-12 p-1 bg-white dark:bg-gray-800 rounded-xl cursor-pointer"
                        />
                        <span className="text-sm font-mono text-gray-500 uppercase">{data.heroBgColor || '#1E3A8A'}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Text Color</label>
                      <div className="flex items-center space-x-3">
                        <input 
                          type="color"
                          value={data.heroTextColor || '#ffffff'}
                          onChange={(e) => handleChange('heroTextColor', e.target.value)}
                          className="w-12 h-12 p-1 bg-white dark:bg-gray-800 rounded-xl cursor-pointer"
                        />
                        <span className="text-sm font-mono text-gray-500 uppercase">{data.heroTextColor || '#ffffff'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Meta Description</label>
                <textarea 
                  value={data.metaDescription}
                  onChange={(e) => handleChange('metaDescription', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all h-24 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Meta Keywords</label>
                <textarea 
                  value={data.metaKeywords}
                  onChange={(e) => handleChange('metaKeywords', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all h-32 resize-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Google Analytics ID</label>
                <input 
                  type="text"
                  placeholder="G-XXXXXXXXXX"
                  value={data.googleAnalyticsId}
                  onChange={(e) => handleChange('googleAnalyticsId', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Google Search Console ID</label>
                <input 
                  type="text"
                  placeholder="google-site-verification=..."
                  value={data.googleSearchConsoleId}
                  onChange={(e) => handleChange('googleSearchConsoleId', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Bing Webmaster ID</label>
                <input 
                  type="text"
                  value={data.bingWebmasterId}
                  onChange={(e) => handleChange('bingWebmasterId', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Facebook Pixel ID</label>
                <input 
                  type="text"
                  value={data.facebookPixelId}
                  onChange={(e) => handleChange('facebookPixelId', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 lg:space-y-8">
          <div className="p-4 sm:p-6 bg-blue-50 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-900/20">
            <h3 className="text-sm font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest mb-4 flex items-center">
              <ShieldCheck className="h-4 w-4 mr-2" />
              SEO Launch Checklist
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start space-x-3">
                <div className="w-5 h-5 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center text-[10px] font-black text-blue-700 dark:text-blue-200 mt-0.5 shrink-0">1</div>
                <p className="text-xs text-blue-800/70 dark:text-blue-300/70 leading-relaxed break-words">
                  Add verification meta tag from Google Search Console (auto-injects into head).
                </p>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-5 h-5 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center text-[10px] font-black text-blue-700 dark:text-blue-200 mt-0.5 shrink-0">2</div>
                <p className="text-xs text-blue-800/70 dark:text-blue-300/70 leading-relaxed break-words">
                  After deploying, submit your sitemap to Search Console: <br />
                  <span className="font-mono font-bold text-blue-900 dark:text-blue-100 break-all">/sitemap.xml</span>
                </p>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-5 h-5 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center text-[10px] font-black text-blue-700 dark:text-blue-200 mt-0.5 shrink-0">3</div>
                <p className="text-xs text-blue-800/70 dark:text-blue-300/70 leading-relaxed break-words">
                  In Search Console → Settings → International Targeting: Set target country to <strong>Nigeria 🇳🇬</strong>.
                </p>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-5 h-5 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center text-[10px] font-black text-blue-700 dark:text-blue-200 mt-0.5 shrink-0">4</div>
                <p className="text-xs text-blue-800/70 dark:text-blue-300/70 leading-relaxed break-words">
                  In Search Console → URL Inspection: Request indexing for homepage immediately after launch.
                </p>
              </li>
            </ul>
          </div>

          <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/20 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm font-bold text-red-700 dark:text-red-400">Maintenance Mode</p>
                <p className="text-xs text-red-600/70 dark:text-red-400/70">Visitors will see a maintenance page</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={data.isMaintenanceMode}
                onChange={(e) => handleChange('isMaintenanceMode', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-red-500"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

const BannerSettings = ({ initialData, onSave, saving, onChange }: any) => {
  const [data, setData] = useState<BannerConfig>(initialData || {
    message: 'Welcome to Hub & Jobs! Join our Telegram for instant updates.',
    link: 'https://t.me/HubAndJobs',
    linkLabel: 'Join Now',
    bgColor: '#3b82f6',
    textColor: '#ffffff',
    isEnabled: false,
    expiryDate: null
  });

  const handleChange = (field: keyof BannerConfig, value: any) => {
    const finalValue = typeof value === 'number' && isNaN(value) ? 0 : value;
    setData({ ...data, [field]: finalValue });
    onChange();
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black text-gray-900 dark:text-white">Announcement Banner</h2>
        <button 
          onClick={() => onSave(data)}
          disabled={saving}
          className="flex items-center space-x-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-blue-900 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span>Save Changes</span>
        </button>
      </div>

      <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Megaphone className="h-6 w-6 text-primary" />
            <span className="font-bold text-gray-900 dark:text-white">Banner Configuration</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={data.isEnabled}
              onChange={(e) => handleChange('isEnabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
          </label>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Banner Message</label>
            <input 
              type="text"
              value={data.message}
              onChange={(e) => handleChange('message', e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Link URL</label>
              <input 
                type="url"
                value={data.link}
                onChange={(e) => handleChange('link', e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Link Label</label>
              <input 
                type="text"
                value={data.linkLabel}
                onChange={(e) => handleChange('linkLabel', e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Background Color</label>
              <div className="flex items-center space-x-2">
                <input 
                  type="color"
                  value={data.bgColor}
                  onChange={(e) => handleChange('bgColor', e.target.value)}
                  className="w-12 h-12 p-1 bg-white dark:bg-gray-800 rounded-xl cursor-pointer"
                />
                <span className="text-sm font-mono text-gray-500 uppercase">{data.bgColor}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Text Color</label>
              <div className="flex items-center space-x-2">
                <input 
                  type="color"
                  value={data.textColor}
                  onChange={(e) => handleChange('textColor', e.target.value)}
                  className="w-12 h-12 p-1 bg-white dark:bg-gray-800 rounded-xl cursor-pointer"
                />
                <span className="text-sm font-mono text-gray-500 uppercase">{data.textColor}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Auto-Expire Date</label>
              <input 
                type="date"
                value={data.expiryDate ? format(data.expiryDate.toDate(), 'yyyy-MM-dd') : ''}
                onChange={(e) => handleChange('expiryDate', e.target.value ? Timestamp.fromDate(new Date(e.target.value)) : null)}
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="mt-10">
          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Live Preview</label>
          <div 
            className="p-4 rounded-xl flex flex-col sm:flex-row items-center justify-center text-center space-y-2 sm:space-y-0 sm:space-x-4 shadow-lg"
            style={{ backgroundColor: data.bgColor, color: data.textColor }}
          >
            <p className="font-bold">{data.message}</p>
            {data.link && (
              <span className="px-4 py-1 bg-white/20 rounded-full text-sm font-black hover:bg-white/30 transition-all cursor-pointer">
                {data.linkLabel}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const NewsletterSettings = ({ subscribers, onDelete, onExport }: any) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black text-gray-900 dark:text-white">Newsletter & Subscribers</h2>
        <button 
          onClick={onExport}
          className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-2xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-600/20"
        >
          <Download className="h-4 w-4" />
          <span>Export CSV</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10">
          <p className="text-xs font-black text-primary uppercase tracking-widest mb-2">Total Subscribers</p>
          <p className="text-4xl font-black text-primary">{subscribers.length}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <th className="pb-4 font-black text-xs uppercase tracking-widest text-gray-400">Email Address</th>
              <th className="pb-4 font-black text-xs uppercase tracking-widest text-gray-400">Subscribed At</th>
              <th className="pb-4 font-black text-xs uppercase tracking-widest text-gray-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {subscribers.map((sub: any) => (
              <tr key={sub.id} className="group">
                <td className="py-4 font-bold text-gray-900 dark:text-white">{sub.email}</td>
                <td className="py-4 text-sm text-gray-500">
                  {format(sub.subscribedAt.toDate(), 'MMM dd, yyyy HH:mm')}
                </td>
                <td className="py-4 text-right">
                  {deletingId === sub.id ? (
                    <div className="flex items-center justify-end space-x-2">
                      <button 
                        onClick={() => {
                          onDelete(sub.id);
                          setDeletingId(null);
                        }}
                        className="px-3 py-1 bg-red-500 text-white text-[10px] font-black uppercase rounded-lg hover:bg-red-600 transition-all"
                      >
                        Confirm
                      </button>
                      <button 
                        onClick={() => setDeletingId(null)}
                        className="px-3 py-1 bg-gray-100 text-gray-500 text-[10px] font-black uppercase rounded-lg hover:bg-gray-200 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setDeletingId(sub.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const PushSettings = ({ subscribers, onRefresh }: any) => {
  const [testLoading, setTestLoading] = useState(false);

  const sendTestNotification = async () => {
    setTestLoading(true);
    try {
      const tokens = subscribers.map((s: any) => s.token);
      if (tokens.length === 0) {
        toast.error('No subscribers to test with');
        return;
      }

      await addDoc(collection(db, 'notification_queue'), {
        tokens: [tokens[0]], // Just send to the first one for test
        notification: {
          title: 'Test Notification 🔔',
          body: 'This is a test notification from Hub & Jobs Admin.',
          image: '',
        },
        data: {
          url: window.location.origin,
        },
        sentAt: serverTimestamp(),
        status: 'pending'
      });
      toast.success('Test notification queued!');
    } catch (err: any) {
      toast.error('Failed to queue test: ' + err.message);
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black text-gray-900 dark:text-white">Push Notifications</h2>
        <button 
          onClick={sendTestNotification}
          disabled={testLoading || subscribers.length === 0}
          className="flex items-center space-x-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-blue-900 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
        >
          {testLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
          <span>Send Test Notification</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10">
          <p className="text-xs font-black text-primary uppercase tracking-widest mb-2">Total Push Subscribers</p>
          <p className="text-4xl font-black text-primary">{subscribers.length}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <th className="pb-4 font-black text-xs uppercase tracking-widest text-gray-400">Token (Truncated)</th>
              <th className="pb-4 font-black text-xs uppercase tracking-widest text-gray-400">Platform</th>
              <th className="pb-4 font-black text-xs uppercase tracking-widest text-gray-400">Subscribed At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {subscribers.map((sub: any) => (
              <tr key={sub.id} className="group">
                <td className="py-4 font-mono text-xs text-gray-500">
                  {sub.token.slice(0, 20)}...{sub.token.slice(-10)}
                </td>
                <td className="py-4 text-sm text-gray-700 dark:text-gray-300">
                  {sub.platform || 'Unknown'}
                </td>
                <td className="py-4 text-sm text-gray-500">
                  {sub.subscribedAt ? format(sub.subscribedAt.toDate(), 'MMM dd, yyyy HH:mm') : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const AccountSettings = ({ profile, onSave, saving, onChange }: any) => {
  const [data, setData] = useState({
    displayName: profile?.displayName || '',
    email: profile?.email || '',
    photoURL: profile?.photoURL || ''
  });

  const handleChange = (field: string, value: any) => {
    const finalValue = typeof value === 'number' && isNaN(value) ? 0 : value;
    setData({ ...data, [field]: finalValue });
    onChange();
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black text-gray-900 dark:text-white">Admin Account Settings</h2>
        <button 
          onClick={() => onSave(data)}
          disabled={saving}
          className="flex items-center space-x-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-blue-900 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span>Save Profile</span>
        </button>
      </div>

      <div className="max-w-2xl space-y-8">
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-8 p-8 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border border-gray-100 dark:border-gray-800">
          <div className="relative group">
            <div className="w-24 h-24 rounded-3xl overflow-hidden bg-gray-200 dark:bg-gray-700">
              {data.photoURL ? (
                <img src={data.photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <User className="h-10 w-10" />
                </div>
              )}
            </div>
            <button className="absolute -bottom-2 -right-2 p-2 bg-primary text-white rounded-xl shadow-lg hover:bg-blue-900 transition-all">
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="text-center sm:text-left">
            <h3 className="text-lg font-black text-gray-900 dark:text-white">{data.displayName || 'Admin User'}</h3>
            <p className="text-sm text-gray-500">{data.email}</p>
            <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-2">Administrator</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Display Name</label>
            <input 
              type="text"
              value={data.displayName}
              onChange={(e) => handleChange('displayName', e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
            <input 
              type="email"
              value={data.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>
        </div>

        <div className="pt-8 border-t border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-black text-gray-900 dark:text-white mb-6">Security</h3>
          <button className="px-6 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
            Change Password
          </button>
        </div>

        <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/20">
          <div className="flex items-center space-x-3 mb-4">
            <Loader2 className="h-5 w-5 text-blue-500" />
            <span className="font-bold text-blue-700 dark:text-blue-400">Session Info</span>
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400/70">
            Last login: {profile?.lastLogin ? format(profile.lastLogin.toDate(), 'PPP p') : 'Unknown'}
          </p>
        </div>
      </div>
    </div>
  );
};
