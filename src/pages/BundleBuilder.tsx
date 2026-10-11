import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Rocket, 
  FileText, 
  BarChart3, 
  Building2, 
  CheckCircle2, 
  ShieldCheck, 
  Zap,
  Lock,
  Tag as TagIcon,
  X,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { useDocumentSettings } from '../hooks/useDocumentSettings';
import { useDocumentPayment } from '../lib/payment';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

const BundleBuilder = () => {
  const [isPaid, setIsPaid] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [email, setEmail] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const { settings, loading: settingsLoading } = useDocumentSettings();
  const navigate = useNavigate();
  const location = useLocation();

  const handleGetBundle = () => {
    if (!auth.currentUser) {
      toast.error('Please sign in or create an account to get the startup bundle');
      navigate('/admin/login?mode=signup', { state: { mode: 'signup', from: location.pathname } });
      return;
    }
    setShowEmailModal(true);
  };

  useEffect(() => {
    const paidDocs = JSON.parse(localStorage.getItem('hj_paid_docs') || '{}');
    if (paidDocs['startup_bundle']) {
      setIsPaid(true);
    }
  }, []);

  const calculatePrice = () => {
    const basePrice = settings.pricing.startupBundle;
    if (!appliedPromo) return basePrice;

    if (appliedPromo.discountType === 'percentage') {
      return basePrice * (1 - appliedPromo.value / 100);
    } else {
      return Math.max(0, basePrice - appliedPromo.value);
    }
  };

  const validatePromoCode = async () => {
    if (!promoCode) return;
    setIsValidatingPromo(true);
    try {
      const q = query(
        collection(db, 'promo_codes'), 
        where('code', '==', promoCode.toUpperCase()),
        where('isActive', '==', true)
      );
      const snap = await getDocs(q);
      
      if (snap.empty) {
        toast.error('Invalid or expired promo code');
        setAppliedPromo(null);
      } else {
        const promo = { id: snap.docs[0].id, ...snap.docs[0].data() } as any;
        if (promo.appliesTo !== 'all' && promo.appliesTo !== 'startup-bundle') {
          toast.error('This promo code is not valid for the Startup Bundle');
          setAppliedPromo(null);
        } else {
          setAppliedPromo(promo);
          toast.success('Promo code applied!');
        }
      }
    } catch (error) {
      console.error('Error validating promo:', error);
      toast.error('Failed to validate promo code');
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const { pay } = useDocumentPayment({
    email,
    documentType: 'startup-bundle',
    documentId: 'startup_bundle',
    amount: calculatePrice(),
    promoCode: appliedPromo?.code,
    onSuccess: () => {
      setIsPaid(true);
      setShowEmailModal(false);
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      // Save to paid docs
      const paidDocs = JSON.parse(localStorage.getItem('hj_paid_docs') || '{}');
      paidDocs['startup_bundle'] = true;
      // Also unlock individual ones
      paidDocs['cv_draft'] = true;
      paidDocs['proposal_draft'] = true;
      paidDocs['plan_draft'] = true;
      localStorage.setItem('hj_paid_docs', JSON.stringify(paidDocs));

      toast.success('Payment successful! Your Startup Bundle is unlocked.');
      setTimeout(() => {
        navigate('/documents/success');
      }, 2000);
    }
  });

  if (settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!settings.availability.masterToggle || !settings.availability.startupBundle) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-400">
            <Rocket size={40} />
          </div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4">Startup Bundle Offline</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">This bundle is currently unavailable. Please check back later.</p>
          <Link to="/documents" className="px-8 py-4 bg-primary text-white font-black rounded-2xl">Back to Documents</Link>
        </div>
      </div>
    );
  }

  const bundleItems = [
    { 
      icon: FileText, 
      title: 'Professional CV', 
      description: 'ATS-friendly CV tailored for the Nigerian market.',
      price: settings.pricing.cv
    },
    { 
      icon: BarChart3, 
      title: 'Business Proposal', 
      description: 'Win contracts with professional proposal templates.',
      price: settings.pricing.proposal
    },
    { 
      icon: Building2, 
      title: 'Business Plan', 
      description: 'Loan-ready business plans for BoI, SMEDAN, etc.',
      price: settings.pricing.businessPlan
    }
  ];

  const totalIndividualPrice = settings.pricing.cv + settings.pricing.proposal + settings.pricing.businessPlan;
  const savings = totalIndividualPrice - settings.pricing.startupBundle;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pt-24 pb-20">
      {settings.payment.testMode && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-white py-2 px-4 text-center font-black text-xs uppercase tracking-widest flex items-center justify-center space-x-2">
          <AlertTriangle size={14} />
          <span>Test Mode Enabled - No real payments will be processed</span>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-amber-500/20"
          >
            <Rocket size={40} />
          </motion.div>
          <h1 className="text-5xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">Startup Bundle</h1>
          <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            Everything you need to launch your business and career in one discounted package.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white">What's Included</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {bundleItems.map((item, i) => (
                <div key={i} className="bg-white dark:bg-gray-900 p-6 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-xl shadow-gray-200/50 dark:shadow-none">
                  <div className="w-12 h-12 bg-blue-50 text-primary rounded-xl flex items-center justify-center mb-4">
                    <item.icon size={24} />
                  </div>
                  <h3 className="font-black text-gray-900 dark:text-white mb-2">{item.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="bg-white dark:bg-gray-900 p-8 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-xl shadow-gray-200/50 dark:shadow-none">
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-6">Why Get the Bundle?</h3>
              <div className="space-y-4">
                {[
                  'Save ₦' + savings.toLocaleString() + ' compared to buying individually',
                  'One-time payment for lifetime access to all 3 builders',
                  'Perfect for new entrepreneurs and job seekers',
                  'Priority support for bundle customers',
                  'Matching professional design across all documents'
                ].map((text, i) => (
                  <div key={i} className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                    <CheckCircle2 size={18} className="text-green-500 flex-shrink-0" />
                    <span className="text-sm font-medium">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-white dark:bg-gray-900 p-8 rounded-[40px] border border-gray-100 dark:border-gray-800 shadow-2xl shadow-gray-200/50 dark:shadow-none sticky top-32">
              <div className="text-center mb-8">
                <span className="px-4 py-1 bg-amber-100 text-amber-600 text-[10px] font-black uppercase tracking-widest rounded-full mb-4 inline-block">
                  Best Value
                </span>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-black text-gray-900 dark:text-white">₦{calculatePrice().toLocaleString()}</span>
                  {appliedPromo && (
                    <span className="text-gray-400 line-through text-xl">₦{settings.pricing.startupBundle.toLocaleString()}</span>
                  )}
                </div>
                <p className="text-gray-400 text-xs mt-2 font-bold line-through">Total Individual: ₦{totalIndividualPrice.toLocaleString()}</p>
                <p className="text-green-600 text-sm font-black mt-1">You save ₦{savings.toLocaleString()}!</p>
              </div>

              {/* Promo Code */}
              <div className="mb-8">
                {!appliedPromo ? (
                  <div className="flex gap-2">
                    <div className="relative flex-grow">
                      <TagIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input 
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                        placeholder="Promo Code"
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-primary text-sm font-bold"
                      />
                    </div>
                    <button 
                      onClick={validatePromoCode}
                      disabled={isValidatingPromo || !promoCode}
                      className="px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-2xl font-bold text-sm hover:bg-gray-300 transition-all disabled:opacity-50"
                    >
                      {isValidatingPromo ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                    </button>
                  </div>
                ) : (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <TagIcon size={16} />
                      <span className="text-xs font-bold">Code {appliedPromo.code} Applied!</span>
                    </div>
                    <button 
                      onClick={() => setAppliedPromo(null)}
                      className="text-green-600 dark:text-green-400 hover:text-green-700"
                    >
                      <X size={18} />
                    </button>
                  </div>
                )}
              </div>

              <button 
                onClick={handleGetBundle}
                className="w-full py-5 bg-amber-500 text-white font-black rounded-2xl shadow-xl shadow-amber-500/30 flex items-center justify-center gap-3 hover:bg-amber-600 transition-all active:scale-95 mb-6"
              >
                <Zap size={20} />
                Get Bundle Now
              </button>

              <div className="space-y-4 pt-6 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3 text-gray-500">
                  <ShieldCheck size={18} className="text-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Secure via Paystack</span>
                </div>
                <div className="flex items-center gap-3 text-gray-500">
                  <Zap size={18} className="text-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Instant Access</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-900 rounded-[32px] p-8 w-full max-w-md shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-gray-900 dark:text-white">Enter Your Email</h3>
              <button onClick={() => setShowEmailModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <p className="text-gray-500 mb-6">We'll send your bundle access link and receipts to this email.</p>
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none mb-6 font-bold"
            />
            <button 
              onClick={() => pay()}
              disabled={!email || !email.includes('@')}
              className="w-full py-5 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/30 flex items-center justify-center gap-3 hover:bg-blue-900 transition-all disabled:opacity-50"
            >
              Proceed to Payment
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default BundleBuilder;
