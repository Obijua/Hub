import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  Target, 
  TrendingUp, 
  Users, 
  Eye, 
  ChevronRight, 
  ChevronLeft,
  CheckCircle2,
  Lock,
  Smartphone,
  Monitor,
  Banknote,
  Sparkles,
  Loader2,
  Wand2,
  Download
} from 'lucide-react';
import { DocumentHTML, DocumentPreview } from '../components/DocumentPreview';
import { useDocumentPayment } from '../lib/payment';
import html2pdf from 'html2pdf.js';
import { generateWithGemini } from '../lib/gemini';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { useDocumentSettings } from '../hooks/useDocumentSettings';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { AlertTriangle, Tag as TagIcon, X } from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useSeo } from '../lib/seo';

const BusinessPlanBuilder = () => {
  useSeo({
    title: 'Business Plan Builder | Hub & Jobs',
    description: 'Draft comprehensive business plans easily.',
    path: '/documents/business-plan'
  });
  const [step, setStep] = useState(1);
  const [isPaid, setIsPaid] = useState(false);
  const [paymentRef, setPaymentRef] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [email, setEmail] = useState('');
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const { settings, loading: settingsLoading } = useDocumentSettings();
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setCheckingAuth(false);
      if (user?.email) setEmail(user.email);
    });
    return () => unsubscribe();
  }, []);

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };
  
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('cb_plan_draft');
    const defaultData = {
      id: `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      businessName: '',
      industry: '',
      businessStage: '',
      oneLineDescription: '',
      location: '',
      registrationStatus: '',
      fullDescription: '',
      vision: '',
      mission: '',
      coreValues: [],
      businessModel: '',
      productsServices: '',
      targetMarket: '',
      marketSize: '',
      competitors: '',
      competitiveAdvantage: '',
      marketEntryStrategy: '',
      capitalRequired: 0,
      loanAmount: 0,
      loanUsage: '',
      monthlyRevenue: 0,
      monthlyExpenses: 0,
      breakEvenTimeline: '',
      founderBackground: '',
      currentEmployees: 0,
      plannedEmployees: 0,
      teamMembers: '',
      operationalDetails: ''
    };
    const parsed = saved ? JSON.parse(saved) : {};
    return {
      ...defaultData,
      ...parsed,
      businessName: parsed.businessName || '',
      industry: parsed.industry || '',
      businessStage: parsed.businessStage || '',
      oneLineDescription: parsed.oneLineDescription || '',
      location: parsed.location || '',
      registrationStatus: parsed.registrationStatus || '',
      fullDescription: parsed.fullDescription || '',
      vision: parsed.vision || '',
      mission: parsed.mission || '',
      coreValues: Array.isArray(parsed.coreValues) ? parsed.coreValues : [],
      businessModel: parsed.businessModel || '',
      productsServices: parsed.productsServices || '',
      targetMarket: parsed.targetMarket || '',
      marketSize: parsed.marketSize || '',
      competitors: parsed.competitors || '',
      competitiveAdvantage: parsed.competitiveAdvantage || '',
      marketEntryStrategy: parsed.marketEntryStrategy || '',
      loanUsage: parsed.loanUsage || '',
      breakEvenTimeline: parsed.breakEvenTimeline || '',
      founderBackground: parsed.founderBackground || '',
      teamMembers: parsed.teamMembers || '',
      operationalDetails: parsed.operationalDetails || ''
    };
  });

  // Auto-save progress
  useEffect(() => {
    const timer = setInterval(() => {
      localStorage.setItem('cb_plan_draft', JSON.stringify(formData));
    }, 30000);
    return () => clearInterval(timer);
  }, [formData]);

  // Check if already paid
  useEffect(() => {
    const paidDocs = JSON.parse(localStorage.getItem('hj_paid_docs') || '{}');
    if (formData.id && paidDocs[formData.id]?.paid) {
      setIsPaid(true);
      setPaymentRef(paidDocs[formData.id].reference);
    }
  }, [formData.id]);

  const calculatePrice = () => {
    const basePrice = settings.pricing.businessPlan;
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
        if (promo.appliesTo !== 'all' && promo.appliesTo !== 'business-plan') {
          toast.error('This promo code is not valid for Business Plans');
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
    email: currentUser?.email || email,
    documentType: 'business-plan',
    documentId: formData.id,
    amount: calculatePrice(),
    promoCode: appliedPromo?.code,
    onSuccess: async (response: any) => {
      console.log('Payment success:', response);
      const reference = response.reference || response;
      
      if (!reference) {
        toast.error('Payment verification failed');
        return;
      }

      try {
        // Save complete document to Firestore
        const docData = {
          reference: reference,
          userId: auth.currentUser?.uid || 'guest',
          userEmail: auth.currentUser?.email || currentUser?.email || email || '',
          documentType: 'business-plan',
          formData: formData,
          paidAt: serverTimestamp(),
          amount: calculatePrice(),
          status: 'paid',
          title: formData.businessName 
            ? `${formData.businessName} - Business Plan`
            : 'Business Plan',
        };

        const savedDoc = await addDoc(
          collection(db, 'user_documents'), 
          docData
        );

        // Save to localStorage with the Firestore doc ID
        const paidDocs = JSON.parse(
          localStorage.getItem('hj_paid_docs') || '{}'
        );
        paidDocs[savedDoc.id] = {
          paid: true,
          type: 'business-plan',
          reference: reference,
        };
        localStorage.setItem(
          'hj_paid_docs', 
          JSON.stringify(paidDocs)
        );

        setPaymentRef(reference);
        setIsPaid(true);
        setShowSuccess(true);
        setShowEmailModal(false);

        // Scroll to top of preview
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 }
        });
        
        toast.success('Payment successful! 🎉');

      } catch (err: any) {
        // Payment went through — still unlock
        setIsPaid(true);
        setPaymentRef(reference);
        setShowSuccess(true);
        setShowEmailModal(false);
        console.error('Firestore save error:', err);
        toast.success('Payment successful! Your business plan is unlocked.');
      }
    }
  });

  const handleDownloadPDF = async () => {
    if (!auth.currentUser) {
      toast.error('Please sign in or create an account to download your document');
      navigate('/admin/login?mode=signup', { state: { mode: 'signup', from: location.pathname } });
      return;
    }
    const element = document.getElementById('business-plan-document-preview');
    if (!element) {
      toast.error('Document element not found');
      return;
    }

    setIsGeneratingPDF(true);
    try {
      const opt = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: `${formData.businessName || 'business'}-plan.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
      };
      await html2pdf().from(element).set(opt).save();
      toast.success('Business Plan downloaded successfully!');
    } catch (err) {
      console.error('PDF error:', err);
      toast.error('Failed to generate PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePay = () => {
    if (!auth.currentUser) {
      toast.error('Please sign in or create an account to download your document');
      navigate('/admin/login?mode=signup', { state: { mode: 'signup', from: location.pathname } });
      return;
    }
    // Pre-fill email from user profile if state is empty
    if (currentUser?.email && !email) {
      setEmail(currentUser.email);
    }
    setShowEmailModal(true);
  };

  // AI Functions
  const generateFullDescription = async () => {
    if (!formData.businessName || !formData.industry || !formData.oneLineDescription) {
      return toast.error("Enter business name, industry, and one-line description first");
    }
    setIsGenerating('fullDescription');
    try {
      const prompt = `Generate a detailed, professional business description for a Nigerian business:
      Name: ${formData.businessName}
      Industry: ${formData.industry}
      One-line summary: ${formData.oneLineDescription}
      Location: ${formData.location}
      Stage: ${formData.businessStage}
      Keep it professional, persuasive, and suitable for a loan application. 
      Start directly with the content. No intro or explanation. Return ONLY the description text.`;
      const res = await generateWithGemini(prompt);
      setFormData(prev => ({ ...prev, fullDescription: res }));
      toast.success("Full description generated!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate description");
    } finally {
      setIsGenerating(null);
    }
  };

  const generateVisionMission = async () => {
    if (!formData.businessName || !formData.industry) return toast.error("Enter business name and industry first");
    setIsGenerating('visionMission');
    try {
      const prompt = `Generate a professional Vision and Mission statement for a Nigerian business:
      Name: ${formData.businessName}
      Industry: ${formData.industry}
      Description: ${formData.oneLineDescription}
      Return ONLY a JSON object with "vision" and "mission" keys.
      Example: {"vision": "To be...", "mission": "Our mission is..."}
      No markdown, no backticks, no "json" prefix.`;
      const res = await generateWithGemini(prompt);
      const cleaned = res.replace(/^json/i, '').trim();
      const data = JSON.parse(cleaned);
      setFormData(prev => ({ ...prev, vision: data.vision, mission: data.mission }));
      toast.success("Vision & Mission generated!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate statements");
    } finally {
      setIsGenerating(null);
    }
  };

  const generateMarketAnalysis = async () => {
    if (!formData.industry || !formData.location) return toast.error("Enter industry and location first");
    setIsGenerating('market');
    try {
      const prompt = `Provide a professional market analysis for a ${formData.industry} business in ${formData.location}, Nigeria.
      Include: Market Size, Target Customers, and Main Competitors.
      Return ONLY a JSON object with "size", "customers", and "competitors" keys.
      Example: {"size": "₦500M", "customers": "Farmers", "competitors": "Company X"}
      No markdown, no backticks, no "json" prefix.`;
      const res = await generateWithGemini(prompt);
      const cleaned = res.replace(/^json/i, '').trim();
      const data = JSON.parse(cleaned);
      setFormData(prev => ({ 
        ...prev, 
        marketSize: data.size, 
        targetMarket: data.customers,
        competitors: data.competitors
      }));
      toast.success("Market analysis generated!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate analysis");
    } finally {
      setIsGenerating(null);
    }
  };

  const improveText = async (field: string, currentText: string) => {
    if (!currentText) return;
    setIsGenerating(field);
    try {
      const prompt = `Improve this business plan text to be more professional, detailed, and suitable for a loan application (BoI/SMEDAN): "${currentText}". 
      Keep it concise but impactful. Start directly with the content. No intro or explanation.`;
      const improved = await generateWithGemini(prompt);
      setFormData(prev => ({ ...prev, [field]: improved }));
      toast.success("Text improved!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to improve text");
    } finally {
      setIsGenerating(null);
    }
  };

  const enhanceEntirePlan = async () => {
    setIsGenerating('entire');
    try {
      toast.info("AI is enhancing your entire plan... this may take a moment.");
      const prompt = `Enhance this entire business plan for a loan application. 
      Business: ${formData.businessName} (${formData.industry})
      Description: ${formData.fullDescription}
      Vision: ${formData.vision}
      Mission: ${formData.mission}
      Return ONLY a JSON object with improved versions of all text fields.
      Example: {"fullDescription": "...", "vision": "...", "mission": "..."}
      No markdown, no backticks, no "json" prefix.`;
      // This is a simplified version for the demo
      const res = await generateWithGemini(prompt);
      const cleaned = res.replace(/^json/i, '').trim();
      const data = JSON.parse(cleaned);
      setFormData(prev => ({ ...prev, ...data }));
      toast.success("Entire plan enhanced with AI!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to enhance plan");
    } finally {
      setIsGenerating(null);
    }
  };

  const handleTagsInput = (field: string, value: string) => {
    if (value.endsWith(',')) {
      const tag = value.slice(0, -1).trim();
      if (tag && !formData[field].includes(tag)) {
        setFormData((prev: any) => ({ ...prev, [field]: [...prev[field], tag] }));
      }
      return '';
    }
    return value;
  };

  const removeTag = (field: string, tag: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: prev[field].filter((t: string) => t !== tag)
    }));
  };

  const steps = [
    { id: 1, title: 'Exec Summary', icon: Building2 },
    { id: 2, title: 'Description', icon: Target },
    { id: 3, title: 'Market Analysis', icon: TrendingUp },
    { id: 4, title: 'Financial Plan', icon: Banknote },
    { id: 5, title: 'Team & Ops', icon: Users },
    { id: 6, title: 'Preview & Pay', icon: Eye },
  ];

  const loanBodies = [
    { name: 'BoI', icon: '🏦' },
    { name: 'SMEDAN', icon: '🏢' },
    { name: 'Tony Elumelu', icon: '🚀' },
    { name: 'BOA', icon: '🌾' },
    { name: 'Nirsal', icon: '💰' },
    { name: 'Bank Loans', icon: '💳' }
  ];

  if (settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!settings.availability.masterToggle || !settings.availability.businessPlan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-400">
            <Building2 size={40} />
          </div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4">Business Plan Builder Offline</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">This builder is currently unavailable. Please check back later.</p>
          <Link to="/documents" className="px-8 py-4 bg-primary text-white font-black rounded-2xl">Back to Documents</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white pt-24 pb-20">
      {settings.payment.testMode && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-white py-2 px-4 text-center font-black text-xs uppercase tracking-widest flex items-center justify-center space-x-2">
          <AlertTriangle size={14} />
          <span>Test Mode Enabled - No real payments will be processed</span>
        </div>
      )}
      <div className="max-w-7xl mx-auto px-6">
        {/* Loan Bodies Banner */}
        <div className="bg-blue-900 text-white p-4 rounded-2xl mb-12 flex flex-wrap items-center justify-center gap-8 shadow-xl shadow-blue-900/20">
          <span className="text-xs font-black uppercase tracking-widest opacity-60">Target Loan Bodies:</span>
          {loanBodies.map(body => (
            <div key={body.name} className="flex items-center gap-2 font-bold">
              <span>{body.icon}</span>
              <span>{body.name}</span>
            </div>
          ))}
        </div>

        {/* Header & Progress */}
        <div className="mb-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Business Plan Builder</h1>
                <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-1">
                  <Sparkles size={10} />
                  AI Powered
                </span>
              </div>
              <p className="text-gray-500 dark:text-gray-400">BoI/SMEDAN-ready plans for Nigerian entrepreneurs</p>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                className="md:hidden px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold flex items-center gap-2"
              >
                {isPreviewMode ? <Smartphone size={18} /> : <Monitor size={18} />}
                {isPreviewMode ? 'Edit Form' : 'Preview Plan'}
              </button>
            </div>
          </div>

          <div className="flex justify-between relative">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 dark:bg-gray-800 -translate-y-1/2 z-0" />
            <div 
              className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 z-0 transition-all duration-500" 
              style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
            />
            {steps.map((s) => (
              <button
                key={s.id}
                onClick={() => setStep(s.id)}
                className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all font-black text-sm ${
                  step >= s.id ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                } ${step === s.id ? 'ring-4 ring-primary/20' : ''}`}
              >
                <s.icon size={20} />
                <span className={`absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-wider whitespace-nowrap hidden md:block ${step === s.id ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                  {s.title}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Form Side */}
          <div className={`${(isPreviewMode || step === 6) ? 'hidden' : 'block'} lg:block`}>
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl p-6 shadow-xl shadow-gray-200/50 dark:shadow-none">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div 
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <h2 className="text-lg font-black text-gray-900 dark:text-white mb-6">Executive Summary</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Business Name</label>
                        <input 
                          type="text"
                          name="businessName"
                          value={formData.businessName}
                          onChange={handleInputChange}
                          placeholder="e.g. GreenAgro Farms"
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-primary font-medium text-sm transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Industry</label>
                        <input 
                          type="text"
                          name="industry"
                          value={formData.industry}
                          onChange={handleInputChange}
                          placeholder="e.g. Agriculture"
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-primary font-medium text-sm transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Business Stage</label>
                        <select 
                          name="businessStage"
                          value={formData.businessStage}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary font-medium text-sm transition-all"
                        >
                          <option value="">Select Stage</option>
                          <option value="Idea Stage">Idea Stage</option>
                          <option value="Startup">Startup</option>
                          <option value="Existing Business">Existing Business</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Registration Status</label>
                        <select 
                          name="registrationStatus"
                          value={formData.registrationStatus}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary font-medium text-sm transition-all"
                        >
                          <option value="">Select Status</option>
                          <option value="Registered (CAC)">Registered (CAC)</option>
                          <option value="Not yet registered">Not yet registered</option>
                        </select>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">One-line Description</label>
                        <input 
                          type="text"
                          name="oneLineDescription"
                          value={formData.oneLineDescription}
                          onChange={handleInputChange}
                          placeholder="What does your business do in one sentence?"
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-primary font-medium text-sm transition-all"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div 
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <h2 className="text-lg font-black text-gray-900 dark:text-white mb-6">Business Description</h2>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Full Business Description</label>
                          <button 
                            onClick={generateFullDescription}
                            disabled={isGenerating === 'fullDescription'}
                            className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1 hover:opacity-80 disabled:opacity-50"
                          >
                            {isGenerating === 'fullDescription' ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                            Generate with AI
                          </button>
                        </div>
                        <div className="relative">
                          <textarea 
                            name="fullDescription"
                            value={formData.fullDescription}
                            onChange={handleInputChange}
                            rows={4}
                            placeholder="Detailed overview of your business..."
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-primary font-medium text-sm transition-all resize-none"
                          />
                        </div>
                      </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Vision Statement</label>
                          <button 
                            onClick={generateVisionMission}
                            disabled={isGenerating === 'visionMission'}
                            className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1 hover:opacity-80 disabled:opacity-50"
                          >
                            {isGenerating === 'visionMission' ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                            Generate with AI
                          </button>
                        </div>
                        <div className="relative">
                          <textarea 
                            name="vision"
                            value={formData.vision}
                            onChange={handleInputChange}
                            rows={2}
                            placeholder="Where do you see the business in 5 years?"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-primary font-medium text-sm transition-all resize-none"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Mission Statement</label>
                        <div className="relative">
                          <textarea 
                            name="mission"
                            value={formData.mission}
                            onChange={handleInputChange}
                            rows={2}
                            placeholder="What is your primary purpose?"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-primary font-medium text-sm transition-all resize-none"
                          />
                        </div>
                      </div>
                    </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Core Values (Type and press comma)</label>
                        <div className="flex flex-wrap gap-2 p-4 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-xl">
                          {formData.coreValues.map((tag: string) => (
                            <span key={tag} className="px-3 py-1 bg-primary text-white text-xs font-bold rounded-full flex items-center gap-2">
                              {tag}
                              <button onClick={() => removeTag('coreValues', tag)}>✕</button>
                            </span>
                          ))}
                          <input 
                            type="text"
                            placeholder="Add..."
                            className="bg-transparent outline-none text-sm flex-grow min-w-[100px] text-gray-900 dark:text-white"
                            onKeyDown={(e: any) => {
                              if (e.key === ',') {
                                e.preventDefault();
                                const val = e.target.value.trim();
                                if (val && !formData.coreValues.includes(val)) {
                                  setFormData((prev: any) => ({ ...prev, coreValues: [...prev.coreValues, val] }));
                                  e.target.value = '';
                                }
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div 
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-lg font-black text-gray-900 dark:text-white">Market Analysis</h2>
                      <button 
                        onClick={generateMarketAnalysis}
                        disabled={isGenerating === 'market'}
                        className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1 hover:opacity-80 disabled:opacity-50"
                      >
                        {isGenerating === 'market' ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                        Generate Analysis
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Target Market / Customers</label>
                        <input 
                          type="text"
                          name="targetMarket"
                          value={formData.targetMarket}
                          onChange={handleInputChange}
                          placeholder="e.g. Small-scale poultry farmers in Oyo state"
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-primary font-medium text-sm transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Market Size Estimate</label>
                        <input 
                          type="text"
                          name="marketSize"
                          value={formData.marketSize}
                          onChange={handleInputChange}
                          placeholder="e.g. ₦500 Million annually"
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-primary font-medium text-sm transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Main Competitors</label>
                        <textarea 
                          name="competitors"
                          value={formData.competitors}
                          onChange={handleInputChange}
                          rows={2}
                          placeholder="Who are your main rivals?"
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-primary font-medium text-sm transition-all resize-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Your Competitive Advantage</label>
                        <div className="relative">
                          <textarea 
                            name="competitiveAdvantage"
                            value={formData.competitiveAdvantage}
                            onChange={handleInputChange}
                            rows={2}
                            placeholder="Why will customers choose you over others?"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-primary font-medium text-sm transition-all resize-none"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 4 && (
                  <motion.div 
                    key="step4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <h2 className="text-lg font-black text-gray-900 dark:text-white mb-6">Financial Plan</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Startup Capital Required (₦)</label>
                        <input 
                          type="number"
                          name="capitalRequired"
                          value={formData.capitalRequired}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary font-medium text-sm transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Loan Amount Requested (₦)</label>
                        <input 
                          type="number"
                          name="loanAmount"
                          value={formData.loanAmount}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary font-medium text-sm transition-all"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">What loan will be used for</label>
                        <div className="relative">
                          <textarea 
                            name="loanUsage"
                            value={formData.loanUsage}
                            onChange={handleInputChange}
                            rows={2}
                            placeholder="List key equipment, materials, or operational costs..."
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-primary font-medium text-sm transition-all resize-none"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Expected Monthly Revenue (₦)</label>
                        <input 
                          type="number"
                          name="monthlyRevenue"
                          value={formData.monthlyRevenue}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary font-medium text-sm transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Expected Monthly Expenses (₦)</label>
                        <input 
                          type="number"
                          name="monthlyExpenses"
                          value={formData.monthlyExpenses}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary font-medium text-sm transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Break-even Timeline</label>
                        <select 
                          name="breakEvenTimeline"
                          value={formData.breakEvenTimeline}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary font-medium text-sm transition-all"
                        >
                          <option value="">Select Timeline</option>
                          <option value="3 months">3 months</option>
                          <option value="6 months">6 months</option>
                          <option value="1 year">1 year</option>
                          <option value="2 years">2 years</option>
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 5 && (
                  <motion.div 
                    key="step5"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <h2 className="text-lg font-black text-gray-900 dark:text-white mb-6">Team & Operations</h2>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Founder Name & Background</label>
                        <div className="relative">
                          <textarea 
                            name="founderBackground"
                            value={formData.founderBackground}
                            onChange={handleInputChange}
                            rows={3}
                            placeholder="Briefly describe your experience and qualifications..."
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-primary font-medium text-sm transition-all resize-none"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Current Employees</label>
                          <input 
                            type="number"
                            name="currentEmployees"
                            value={formData.currentEmployees}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary font-medium text-sm transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Planned Employees</label>
                          <input 
                            type="number"
                            name="plannedEmployees"
                            value={formData.plannedEmployees}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary font-medium text-sm transition-all"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Operational Details</label>
                        <div className="relative">
                          <textarea 
                            name="operationalDetails"
                            value={formData.operationalDetails}
                            onChange={handleInputChange}
                            rows={3}
                            placeholder="Where will you operate? What are your key processes?"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-primary font-medium text-sm transition-all resize-none"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 6 && (
                  <motion.div 
                    key="step6"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="text-center py-12"
                  >
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 size={40} />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4">Business Plan Ready!</h2>
                    <p className="text-gray-500 mb-8 max-w-sm mx-auto">Review your business plan on the right. Once you're satisfied, pay to unlock the full document and download as PDF.</p>
                    
                    <div className="max-w-xs mx-auto mb-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-800">
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 text-left">Price to Unlock</p>
                      <div className="flex items-baseline gap-2 mb-6">
                        <span className="text-4xl font-black text-gray-900 dark:text-white">₦{calculatePrice().toLocaleString()}</span>
                        {appliedPromo && (
                          <span className="text-gray-400 line-through text-lg">₦{settings.pricing.businessPlan.toLocaleString()}</span>
                        )}
                      </div>

                      {/* Promo Code Input */}
                      {!appliedPromo ? (
                        <div className="flex gap-2">
                          <div className="relative flex-grow">
                            <TagIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input 
                              type="text"
                              value={promoCode}
                              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                              placeholder="Promo Code"
                              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary text-xs font-bold"
                            />
                          </div>
                          <button 
                            onClick={validatePromoCode}
                            disabled={isValidatingPromo || !promoCode}
                            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-xs hover:bg-gray-300 transition-all disabled:opacity-50"
                          >
                            {isValidatingPromo ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Apply'}
                          </button>
                        </div>
                      ) : (
                        <div className="p-2 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-xl flex items-center justify-between">
                          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                            <TagIcon size={14} />
                            <span className="text-[10px] font-bold">Code {appliedPromo.code} Applied!</span>
                          </div>
                          <button 
                            onClick={() => setAppliedPromo(null)}
                            className="text-green-600 dark:text-green-400 hover:text-green-700"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-4 max-w-sm mx-auto mb-8">
                      <button 
                        onClick={enhanceEntirePlan}
                        disabled={isGenerating === 'entire'}
                        className="w-full py-3 bg-primary/10 text-primary font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-primary/20 transition-colors disabled:opacity-50"
                      >
                        {isGenerating === 'entire' ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                        Enhance Entire Plan with AI
                      </button>
                      <button 
                        onClick={() => setShowEmailModal(true)}
                        className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/30 flex items-center justify-center gap-3 hover:bg-blue-900 transition-all active:scale-95"
                      >
                        <Lock size={20} />
                        Unlock Full Plan
                      </button>
                    </div>

                    {settings.payment.testMode && (
                      <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/20 max-w-sm mx-auto">
                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">Test Card Details</p>
                        <p className="text-[10px] text-amber-700 dark:text-amber-500/70 font-medium leading-relaxed">
                          Use any valid expiry and CVV with card:<br/>
                          <span className="font-mono font-bold text-amber-900 dark:text-amber-400">4081 1111 1111 1111</span>
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation Buttons */}
              <div className="mt-12 flex justify-between gap-4">
                {step > 1 && (
                  <button 
                    onClick={() => setStep(prev => prev - 1)}
                    className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl flex items-center gap-2"
                  >
                    <ChevronLeft size={20} />
                    Back
                  </button>
                )}
                {step < 6 && (
                  <button 
                    onClick={() => setStep(prev => prev + 1)}
                    className="px-8 py-3 bg-primary text-white font-bold rounded-xl flex items-center gap-2 ml-auto"
                  >
                    Next Step
                    <ChevronRight size={20} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Preview Side */}
          <div className={`${(isPreviewMode || step === 6) ? 'block' : 'hidden'} lg:block sticky top-24`}>
            <DocumentPreview 
              documentData={formData}
              documentType="business-plan"
              isPaid={isPaid}
              paymentRef={paymentRef}
              onPayClick={handlePay}
              price={calculatePrice()}
              filename={`${formData.businessName || 'business'}-plan`}
            />
          </div>
        </div>
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-900 rounded-[32px] p-8 w-full max-w-md shadow-2xl"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone size={32} />
              </div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Unlock Your Plan</h3>
              <p className="text-gray-500">Enter your email to receive your document and payment receipt.</p>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Email Address</label>
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
              <button 
                onClick={pay}
                className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/30 hover:bg-blue-900 transition-all active:scale-95"
              >
                Proceed to Payment — ₦{calculatePrice().toLocaleString()}
              </button>
              <button 
                onClick={() => setShowEmailModal(false)}
                className="w-full py-2 text-gray-400 font-bold text-sm"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default BusinessPlanBuilder;
