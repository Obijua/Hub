import { useState, useEffect } from 'react';
import { 
  Save, 
  Loader2, 
  FileText, 
  DollarSign, 
  Eye, 
  Settings, 
  Bell, 
  Users, 
  Tag, 
  Plus, 
  Trash2, 
  Check, 
  X,
  AlertTriangle,
  Smartphone,
  Globe,
  Cpu,
  MessageSquare,
  Share2
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { cn } from '../../lib/utils';

interface DocumentSettingsProps {
  initialData: any;
  promoCodes: any[];
  onSave: (data: any) => void;
  onRefreshPromoCodes: () => void;
  saving: boolean;
  onChange: () => void;
}

export const DocumentSettings = ({ 
  initialData, 
  promoCodes, 
  onSave, 
  onRefreshPromoCodes, 
  saving, 
  onChange 
}: DocumentSettingsProps) => {
  const [data, setData] = useState({
    pricing: {
      cv: 2000,
      proposal: 2000,
      businessPlan: 3000,
      startupBundle: 5000,
      coverLetterAddon: 500,
      showOriginalPrice: true,
      discountBadge: true,
      badgeText: '50% OFF'
    },
    availability: {
      cv: true,
      proposal: true,
      businessPlan: true,
      startupBundle: true,
      coverLetter: true,
      masterToggle: true
    },
    payment: {
      paystackPublicKey: '',
      paystackSecretKey: '',
      testMode: true,
      successMessage: 'Payment successful! Your document is ready.',
      failureMessage: 'Payment failed. Please try again.'
    },
    appearance: {
      pageTitle: 'Professional Document Builder',
      pageSubtitle: 'Create high-quality professional documents in minutes with AI assistance.',
      cvBadge: 'Popular',
      proposalBadge: 'New',
      businessPlanBadge: 'Best Value',
      hideAllBadges: false,
      previewBlur: 5,
      visiblePercentage: 30
    },
    ai: {
      enabled: true,
      geminiApiKey: '',
      dailyLimitPerUser: 5
    },
    notifications: {
      notifyOnPurchase: true,
      adminEmail: '',
      whatsappSupport: '',
      supportButtonText: 'Chat with Support'
    },
    referral: {
      enabled: true,
      rewardAmount: 500,
      cookieDuration: 30
    },
    ...initialData
  });

  const [newPromo, setNewPromo] = useState({
    code: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    value: 0,
    appliesTo: 'all' as 'all' | 'cv' | 'proposal' | 'business-plan' | 'startup-bundle'
  });

  const [isAddingPromo, setIsAddingPromo] = useState(false);

  useEffect(() => {
    if (initialData) {
      setData({ ...data, ...initialData });
    }
  }, [initialData]);

  const handleChange = (section: string, field: string, value: any) => {
    const finalValue = typeof value === 'number' && isNaN(value) ? 0 : value;
    const newData = {
      ...data,
      [section]: {
        ...data[section as keyof typeof data],
        [field]: finalValue
      }
    };
    setData(newData);
    onChange();
  };

  const handleAddPromo = async () => {
    if (!newPromo.code || newPromo.value <= 0) return;
    
    try {
      await addDoc(collection(db, 'promo_codes'), {
        ...newPromo,
        createdAt: serverTimestamp(),
        isActive: true
      });
      setNewPromo({
        code: '',
        discountType: 'percentage',
        value: 0,
        appliesTo: 'all'
      });
      setIsAddingPromo(false);
      onRefreshPromoCodes();
    } catch (error) {
      console.error('Error adding promo code:', error);
    }
  };

  const handleDeletePromo = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'promo_codes', id));
      onRefreshPromoCodes();
    } catch (error) {
      console.error('Error deleting promo code:', error);
    }
  };

  const SectionHeader = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
    <div className="flex items-center space-x-4 mb-8">
      <div className="p-3 bg-primary/10 text-primary rounded-2xl">
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <h3 className="text-xl font-black text-gray-900 dark:text-white">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-12 pb-20">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-gray-900 dark:text-white">📄 Documents Settings</h2>
        <button 
          onClick={() => onSave(data)}
          disabled={saving}
          className="flex items-center space-x-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-blue-900 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span>Save All Settings</span>
        </button>
      </div>

      {/* Pricing Control */}
      <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <SectionHeader 
          icon={DollarSign} 
          title="Pricing Control" 
          description="Manage prices and discounts for all document types."
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">CV Price (₦)</label>
            <input 
              type="number"
              value={data.pricing.cv}
              onChange={(e) => handleChange('pricing', 'cv', Number(e.target.value))}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Business Proposal Price (₦)</label>
            <input 
              type="number"
              value={data.pricing.proposal}
              onChange={(e) => handleChange('pricing', 'proposal', Number(e.target.value))}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Business Plan Price (₦)</label>
            <input 
              type="number"
              value={data.pricing.businessPlan}
              onChange={(e) => handleChange('pricing', 'businessPlan', Number(e.target.value))}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Startup Bundle Price (₦)</label>
            <input 
              type="number"
              value={data.pricing.startupBundle}
              onChange={(e) => handleChange('pricing', 'startupBundle', Number(e.target.value))}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Cover Letter Add-on (₦)</label>
            <input 
              type="number"
              value={data.pricing.coverLetterAddon}
              onChange={(e) => handleChange('pricing', 'coverLetterAddon', Number(e.target.value))}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">Show Original Price</p>
              <p className="text-xs text-gray-500">Display a crossed-out higher price.</p>
            </div>
            <button 
              onClick={() => handleChange('pricing', 'showOriginalPrice', !data.pricing.showOriginalPrice)}
              className={cn(
                "w-12 h-6 rounded-full transition-all relative",
                data.pricing.showOriginalPrice ? "bg-primary" : "bg-gray-300 dark:bg-gray-700"
              )}
            >
              <div className={cn(
                "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                data.pricing.showOriginalPrice ? "right-1" : "left-1"
              )} />
            </button>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">Discount Badge</p>
              <p className="text-xs text-gray-500">Show a discount badge on document cards.</p>
            </div>
            <button 
              onClick={() => handleChange('pricing', 'discountBadge', !data.pricing.discountBadge)}
              className={cn(
                "w-12 h-6 rounded-full transition-all relative",
                data.pricing.discountBadge ? "bg-primary" : "bg-gray-300 dark:bg-gray-700"
              )}
            >
              <div className={cn(
                "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                data.pricing.discountBadge ? "right-1" : "left-1"
              )} />
            </button>
          </div>
          {data.pricing.discountBadge && (
            <div className="md:col-span-2">
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Badge Text (e.g. 50% OFF)</label>
              <input 
                type="text"
                value={data.pricing.badgeText}
                onChange={(e) => handleChange('pricing', 'badgeText', e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
          )}
        </div>
      </div>

      {/* Document Availability */}
      <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <SectionHeader 
          icon={Check} 
          title="Document Availability" 
          description="Enable or disable specific document builders."
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { id: 'cv', label: 'CV Builder' },
            { id: 'proposal', label: 'Business Proposal' },
            { id: 'businessPlan', label: 'Business Plan' },
            { id: 'startupBundle', label: 'Startup Bundle' },
            { id: 'coverLetter', label: 'Cover Letter' },
            { id: 'masterToggle', label: 'Master Toggle (All Documents)', isMaster: true }
          ].map((item) => (
            <div key={item.id} className={cn(
              "flex items-center justify-between p-4 rounded-2xl border",
              item.isMaster ? "bg-primary/5 border-primary/20" : "bg-gray-50 dark:bg-gray-800 border-transparent"
            )}>
              <span className={cn("text-sm font-bold", item.isMaster ? "text-primary" : "text-gray-900 dark:text-white")}>
                {item.label}
              </span>
              <button 
                onClick={() => handleChange('availability', item.id, !data.availability[item.id as keyof typeof data.availability])}
                className={cn(
                  "w-12 h-6 rounded-full transition-all relative",
                  data.availability[item.id as keyof typeof data.availability] ? "bg-primary" : "bg-gray-300 dark:bg-gray-700"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                  data.availability[item.id as keyof typeof data.availability] ? "right-1" : "left-1"
                )} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Settings */}
      <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <SectionHeader 
          icon={Smartphone} 
          title="Payment Settings" 
          description="Configure Paystack integration and test mode."
        />
        
        <div className="space-y-8">
          <div className="flex items-center justify-between p-6 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/20">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-xl">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-black text-amber-900 dark:text-amber-400 uppercase tracking-widest">Test Mode</p>
                <p className="text-xs text-amber-700 dark:text-amber-500/70">Enable to test payments without real money.</p>
              </div>
            </div>
            <button 
              onClick={() => handleChange('payment', 'testMode', !data.payment.testMode)}
              className={cn(
                "w-14 h-7 rounded-full transition-all relative",
                data.payment.testMode ? "bg-amber-500" : "bg-gray-300 dark:bg-gray-700"
              )}
            >
              <div className={cn(
                "absolute top-1 w-5 h-5 rounded-full bg-white transition-all shadow-sm",
                data.payment.testMode ? "right-1" : "left-1"
              )} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Paystack Public Key</label>
              <input 
                type="text"
                value={data.payment.paystackPublicKey}
                onChange={(e) => handleChange('payment', 'paystackPublicKey', e.target.value)}
                placeholder="pk_test_..."
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Paystack Secret Key</label>
              <input 
                type="password"
                value={data.payment.paystackSecretKey}
                onChange={(e) => handleChange('payment', 'paystackSecretKey', e.target.value)}
                placeholder="sk_test_..."
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all font-mono text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Success Message</label>
              <textarea 
                value={data.payment.successMessage}
                onChange={(e) => handleChange('payment', 'successMessage', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Failure Message</label>
              <textarea 
                value={data.payment.failureMessage}
                onChange={(e) => handleChange('payment', 'failureMessage', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Document Appearance */}
      <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <SectionHeader 
          icon={Globe} 
          title="Document Appearance" 
          description="Customize how the document builder looks to users."
        />
        
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Page Title</label>
              <input 
                type="text"
                value={data.appearance.pageTitle}
                onChange={(e) => handleChange('appearance', 'pageTitle', e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Page Subtitle</label>
              <input 
                type="text"
                value={data.appearance.pageSubtitle}
                onChange={(e) => handleChange('appearance', 'pageSubtitle', e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">CV Badge</label>
              <input 
                type="text"
                value={data.appearance.cvBadge}
                onChange={(e) => handleChange('appearance', 'cvBadge', e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Proposal Badge</label>
              <input 
                type="text"
                value={data.appearance.proposalBadge}
                onChange={(e) => handleChange('appearance', 'proposalBadge', e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Business Plan Badge</label>
              <input 
                type="text"
                value={data.appearance.businessPlanBadge}
                onChange={(e) => handleChange('appearance', 'businessPlanBadge', e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
            <div className="flex items-end pb-2">
              <button 
                onClick={() => handleChange('appearance', 'hideAllBadges', !data.appearance.hideAllBadges)}
                className="flex items-center space-x-2 text-xs font-black text-primary uppercase tracking-widest"
              >
                {data.appearance.hideAllBadges ? <Eye className="h-4 w-4" /> : <X className="h-4 w-4" />}
                <span>{data.appearance.hideAllBadges ? 'Show All Badges' : 'Hide All Badges'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8 border-t border-gray-100 dark:border-gray-800">
            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Preview Blur Intensity</label>
                <span className="text-sm font-black text-primary">{data.appearance.previewBlur}px</span>
              </div>
              <input 
                type="range"
                min="0"
                max="20"
                value={data.appearance.previewBlur}
                onChange={(e) => handleChange('appearance', 'previewBlur', Number(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-16 bg-white dark:bg-gray-900 rounded shadow-sm overflow-hidden relative">
                    <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800" style={{ filter: `blur(${data.appearance.previewBlur}px)` }} />
                    <div className="absolute top-2 left-2 w-8 h-1 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="absolute top-4 left-2 w-6 h-1 bg-gray-200 dark:bg-gray-700 rounded" />
                  </div>
                  <p className="text-[10px] text-gray-500 font-medium">Preview of blur intensity on locked documents.</p>
                </div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Visible Percentage</label>
                <span className="text-sm font-black text-primary">{data.appearance.visiblePercentage}%</span>
              </div>
              <input 
                type="range"
                min="10"
                max="90"
                value={data.appearance.visiblePercentage}
                onChange={(e) => handleChange('appearance', 'visiblePercentage', Number(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <p className="mt-4 text-[10px] text-gray-500 font-medium">How much of the document is visible before the blur starts.</p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Settings */}
      <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <SectionHeader 
          icon={Cpu} 
          title="AI Settings" 
          description="Configure Gemini AI integration and usage limits."
        />
        
        <div className="space-y-8">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-primary/10 text-primary rounded-lg">
                <Cpu className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">Enable AI Features</p>
                <p className="text-xs text-gray-500">Allow users to generate content using AI.</p>
              </div>
            </div>
            <button 
              onClick={() => handleChange('ai', 'enabled', !data.ai.enabled)}
              className={cn(
                "w-12 h-6 rounded-full transition-all relative",
                data.ai.enabled ? "bg-primary" : "bg-gray-300 dark:bg-gray-700"
              )}
            >
              <div className={cn(
                "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                data.ai.enabled ? "right-1" : "left-1"
              )} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Gemini API Key</label>
              <input 
                type="password"
                value={data.ai.geminiApiKey}
                onChange={(e) => handleChange('ai', 'geminiApiKey', e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all font-mono text-sm"
              />
              <p className="mt-2 text-[10px] text-gray-500">Stored securely in Firestore settings.</p>
            </div>
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Daily Limit Per User</label>
              <input 
                type="number"
                value={data.ai.dailyLimitPerUser}
                onChange={(e) => handleChange('ai', 'dailyLimitPerUser', Number(e.target.value))}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all"
              />
              <p className="mt-2 text-[10px] text-gray-500">Maximum AI generations per user per day.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <SectionHeader 
          icon={Bell} 
          title="Notifications & Support" 
          description="Manage admin alerts and user support options."
        />
        
        <div className="space-y-8">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-primary/10 text-primary rounded-lg">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">Notify Admin on Purchase</p>
                <p className="text-xs text-gray-500">Receive an email whenever a document is sold.</p>
              </div>
            </div>
            <button 
              onClick={() => handleChange('notifications', 'notifyOnPurchase', !data.notifications.notifyOnPurchase)}
              className={cn(
                "w-12 h-6 rounded-full transition-all relative",
                data.notifications.notifyOnPurchase ? "bg-primary" : "bg-gray-300 dark:bg-gray-700"
              )}
            >
              <div className={cn(
                "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                data.notifications.notifyOnPurchase ? "right-1" : "left-1"
              )} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Admin Notification Email</label>
              <input 
                type="email"
                value={data.notifications.adminEmail}
                onChange={(e) => handleChange('notifications', 'adminEmail', e.target.value)}
                placeholder="admin@hubandjobs.com"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">WhatsApp Support Number</label>
              <input 
                type="text"
                value={data.notifications.whatsappSupport}
                onChange={(e) => handleChange('notifications', 'whatsappSupport', e.target.value)}
                placeholder="+234..."
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Support Button Text</label>
              <input 
                type="text"
                value={data.notifications.supportButtonText}
                onChange={(e) => handleChange('notifications', 'supportButtonText', e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Referral & Promo Codes */}
      <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <SectionHeader 
          icon={Share2} 
          title="Referrals & Promo Codes" 
          description="Manage the referral system and discount codes."
        />
        
        <div className="space-y-12">
          {/* Referral System */}
          <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-900/20">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-lg font-black text-gray-900 dark:text-white">Referral System</h4>
                  <p className="text-xs text-gray-500">Reward users for bringing new customers.</p>
                </div>
              </div>
              <button 
                onClick={() => handleChange('referral', 'enabled', !data.referral.enabled)}
                className={cn(
                  "w-12 h-6 rounded-full transition-all relative",
                  data.referral.enabled ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-700"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                  data.referral.enabled ? "right-1" : "left-1"
                )} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Reward Amount (₦)</label>
                <input 
                  type="number"
                  value={data.referral.rewardAmount}
                  onChange={(e) => handleChange('referral', 'rewardAmount', Number(e.target.value))}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-900 border-none rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Cookie Duration (Days)</label>
                <input 
                  type="number"
                  value={data.referral.cookieDuration}
                  onChange={(e) => handleChange('referral', 'cookieDuration', Number(e.target.value))}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-900 border-none rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Promo Codes */}
          <div>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-primary/10 text-primary rounded-xl">
                  <Tag className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-lg font-black text-gray-900 dark:text-white">Promo Codes</h4>
                  <p className="text-xs text-gray-500">Create and manage discount codes.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddingPromo(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-xl font-bold text-xs hover:bg-blue-900 transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Add Code</span>
              </button>
            </div>

            {isAddingPromo && (
              <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-800 animate-in fade-in slide-in-from-top-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Code</label>
                    <input 
                      type="text"
                      value={newPromo.code}
                      onChange={(e) => setNewPromo({ ...newPromo, code: e.target.value.toUpperCase() })}
                      placeholder="SAVE50"
                      className="w-full px-4 py-2 bg-white dark:bg-gray-900 border-none rounded-lg outline-none focus:ring-2 focus:ring-primary transition-all uppercase font-black"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Type</label>
                    <select 
                      value={newPromo.discountType}
                      onChange={(e) => setNewPromo({ ...newPromo, discountType: e.target.value as any })}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-900 border-none rounded-lg outline-none focus:ring-2 focus:ring-primary transition-all font-bold"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (₦)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Value</label>
                    <input 
                      type="number"
                      value={isNaN(newPromo.value) ? '' : newPromo.value}
                      onChange={(e) => setNewPromo({ ...newPromo, value: Number(e.target.value) || 0 })}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-900 border-none rounded-lg outline-none focus:ring-2 focus:ring-primary transition-all font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Applies To</label>
                    <select 
                      value={newPromo.appliesTo}
                      onChange={(e) => setNewPromo({ ...newPromo, appliesTo: e.target.value as any })}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-900 border-none rounded-lg outline-none focus:ring-2 focus:ring-primary transition-all font-bold"
                    >
                      <option value="all">All Documents</option>
                      <option value="cv">CV Only</option>
                      <option value="proposal">Proposal Only</option>
                      <option value="business-plan">Business Plan Only</option>
                      <option value="startup-bundle">Startup Bundle Only</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end space-x-4">
                  <button 
                    onClick={() => setIsAddingPromo(false)}
                    className="px-6 py-2 text-gray-500 font-bold hover:text-gray-700 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleAddPromo}
                    className="px-8 py-2 bg-primary text-white rounded-xl font-bold hover:bg-blue-900 transition-all shadow-lg shadow-primary/20"
                  >
                    Create Promo Code
                  </button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-4 py-4">Code</th>
                    <th className="px-4 py-4">Discount</th>
                    <th className="px-4 py-4">Applies To</th>
                    <th className="px-4 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {promoCodes.map((promo) => (
                    <tr key={promo.id} className="group">
                      <td className="px-4 py-4">
                        <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg font-black text-sm">
                          {promo.code}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                          {promo.discountType === 'percentage' ? `${promo.value}%` : `₦${promo.value.toLocaleString()}`}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-xs font-medium text-gray-500 capitalize">
                          {promo.appliesTo === 'all' ? 'All Documents' : promo.appliesTo}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button 
                          onClick={() => handleDeletePromo(promo.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {promoCodes.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-gray-400 text-sm font-medium">
                        No promo codes created yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
