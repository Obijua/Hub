import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  Wrench, 
  Eye, 
  Plus, 
  Trash2, 
  ChevronRight, 
  ChevronLeft,
  CheckCircle2,
  Lock,
  Smartphone,
  Monitor,
  Calculator,
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

const ProposalBuilder = () => {
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
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);
  const navigate = useNavigate();
  const { settings, loading: settingsLoading } = useDocumentSettings();

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setCheckingAuth(false);
      if (user?.email) setEmail(user.email);
    });
    return () => unsubscribe();
  }, []);
  
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('cb_proposal_draft');
    const defaultData = {
      id: `proposal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      businessName: '',
      businessType: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      cacNumber: '',
      yearsInBusiness: '',
      clientName: '',
      clientAddress: '',
      clientContact: '',
      clientType: '',
      services: [],
      lineItems: [],
      subtotal: 0,
      vat: 0,
      total: 0,
      paymentTerms: '',
      startDate: '',
      duration: '',
      whyChooseUs: '',
      equipment: '',
      teamSize: ''
    };
    const parsed = saved ? JSON.parse(saved) : {};
    return {
      ...defaultData,
      ...parsed,
      businessName: parsed.businessName || '',
      businessType: parsed.businessType || '',
      contactPerson: parsed.contactPerson || '',
      phone: parsed.phone || '',
      email: parsed.email || '',
      address: parsed.address || '',
      cacNumber: parsed.cacNumber || '',
      yearsInBusiness: parsed.yearsInBusiness || '',
      clientName: parsed.clientName || '',
      clientAddress: parsed.clientAddress || '',
      clientContact: parsed.clientContact || '',
      clientType: parsed.clientType || '',
      services: Array.isArray(parsed.services) ? parsed.services : [],
      lineItems: Array.isArray(parsed.lineItems) ? parsed.lineItems : [],
      paymentTerms: parsed.paymentTerms || '',
      startDate: parsed.startDate || '',
      duration: parsed.duration || '',
      whyChooseUs: parsed.whyChooseUs || '',
      equipment: parsed.equipment || '',
      teamSize: parsed.teamSize || ''
    };
  });

  // Auto-save progress
  useEffect(() => {
    const timer = setInterval(() => {
      localStorage.setItem('cb_proposal_draft', JSON.stringify(formData));
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

  // Calculate totals
  useEffect(() => {
    const subtotal = formData.lineItems.reduce((acc: number, item: any) => acc + (Number(item.price) * Number(item.qty)), 0);
    const vat = subtotal * 0.075;
    const total = subtotal + vat;
    setFormData((prev: any) => ({ ...prev, subtotal, vat, total }));
  }, [formData.lineItems]);

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const calculatePrice = () => {
    const basePrice = settings.pricing.proposal;
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
        if (promo.appliesTo !== 'all' && promo.appliesTo !== 'proposal') {
          toast.error('This promo code is not valid for Proposals');
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
    documentType: 'proposal',
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
          documentType: 'proposal',
          formData: formData,
          paidAt: serverTimestamp(),
          amount: calculatePrice(),
          status: 'paid',
          title: formData.businessName 
            ? `${formData.businessName} - Proposal`
            : 'Business Proposal',
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
          type: 'proposal',
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
        toast.success('Payment successful! Your proposal is unlocked.');
      }
    }
  });

  const handleDownloadPDF = async () => {
    const element = document.getElementById('proposal-document-preview');
    if (!element) {
      toast.error('Document element not found');
      return;
    }

    setIsGeneratingPDF(true);
    try {
      const opt = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: `${formData.businessName || 'business'}-proposal.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
      };
      await html2pdf().from(element).set(opt).save();
      toast.success('Proposal downloaded successfully!');
    } catch (err) {
      console.error('PDF error:', err);
      toast.error('Failed to generate PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePay = () => {
    // Pre-fill email from user profile if state is empty
    if (currentUser?.email && !email) {
      setEmail(currentUser.email);
    }
    setShowEmailModal(true);
  };

  // AI Functions
  const generateWhyChooseUs = async () => {
    if (!formData.businessName || !formData.businessType) return toast.error("Enter business name and type first");
    setIsGenerating('whyChooseUs');
    try {
      const prompt = `Write a compelling "Why Choose Us" section for a ${formData.businessType} business named ${formData.businessName}. 
      Experience: ${formData.yearsInBusiness} years. 
      Client: ${formData.clientName} (${formData.clientType}). 
      Focus on reliability, quality, and specific benefits for this client type in Nigeria. 
      Write 3-4 strong sentences. Start directly with the content. No intro or explanation.`;
      const res = await generateWithGemini(prompt);
      setFormData(prev => ({ ...prev, whyChooseUs: res }));
      toast.success("Section generated!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate section");
    } finally {
      setIsGenerating(null);
    }
  };

  const suggestPricing = async () => {
    if (!formData.businessType || !formData.clientType) return toast.error("Enter business and client type first");
    setIsGenerating('pricing');
    try {
      const prompt = `Suggest professional pricing in Nigerian Naira (NGN) for ${formData.businessType} services for a ${formData.clientType} client. 
      Return ONLY a JSON object with: "monthlyRate" (number), "reasoning" (string), and "breakdown" (array of strings).
      Example: {"monthlyRate": 50000, "reasoning": "Standard rate", "breakdown": ["Service A", "Service B"]}
      No markdown, no backticks, no "json" prefix.`;
      const res = await generateWithGemini(prompt);
      const cleaned = res.replace(/^json/i, '').trim();
      const pricing = JSON.parse(cleaned);
      
      // Auto-add a line item with suggested pricing
      setFormData(prev => ({
        ...prev,
        lineItems: [
          ...prev.lineItems,
          { name: `${formData.businessType} Services`, frequency: 'Monthly', price: pricing.monthlyRate, qty: 1 }
        ]
      }));
      toast.success(`Suggested ₦${pricing.monthlyRate.toLocaleString()}: ${pricing.reasoning}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to suggest pricing");
    } finally {
      setIsGenerating(null);
    }
  };

  const improveText = async (field: string, currentText: string) => {
    if (!currentText) return;
    setIsGenerating(field);
    try {
      const prompt = `Improve this business proposal text to be more professional, persuasive, and formal: "${currentText}". 
      Keep it concise. Start directly with the content. No intro or explanation.`;
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

  const addLineItem = () => {
    setFormData((prev: any) => ({
      ...prev,
      lineItems: [...prev.lineItems, { name: '', frequency: 'Once', price: 0, qty: 1 }]
    }));
  };

  const updateLineItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.lineItems];
    newItems[index][field] = value;
    setFormData((prev: any) => ({ ...prev, lineItems: newItems }));
  };

  const removeLineItem = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      lineItems: prev.lineItems.filter((_: any, i: number) => i !== index)
    }));
  };

  const steps = [
    { id: 1, title: 'Your Business', icon: Building2 },
    { id: 2, title: 'Client Info', icon: Users },
    { id: 3, title: 'Services & Pricing', icon: Calculator },
    { id: 4, title: 'Proposal Details', icon: Wrench },
    { id: 5, title: 'Preview & Pay', icon: Eye },
  ];

  const businessTypes = [
    "Estate Maintenance", "Office Cleaning", "Catering", "Security", "Landscaping", "Waste Management", "IT Services", "Logistics", "Event Management", "Other"
  ];

  const clientTypes = ["Estate", "Corporate Office", "Government", "School", "Hospital", "Other"];
  const paymentTerms = ["50% upfront", "Monthly", "Quarterly", "Upon completion"];

  if (settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!settings.availability.masterToggle || !settings.availability.proposal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-400">
            <Building2 size={40} />
          </div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4">Proposal Builder Offline</h2>
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
        {/* Header & Progress */}
        <div className="mb-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Business Proposal Builder</h1>
                <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-1">
                  <Sparkles size={10} />
                  AI Powered
                </span>
              </div>
              <p className="text-gray-500 dark:text-gray-400">Win contracts with professional proposals</p>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                className="md:hidden px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold flex items-center gap-2"
              >
                {isPreviewMode ? <Smartphone size={18} /> : <Monitor size={18} />}
                {isPreviewMode ? 'Edit Form' : 'Preview Proposal'}
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
          <div className={`${(isPreviewMode || step === 5) ? 'hidden' : 'block'} lg:block`}>
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
                    <h2 className="text-lg font-black text-gray-900 dark:text-white mb-6">Your Business Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Business Name</label>
                        <input 
                          type="text"
                          name="businessName"
                          value={formData.businessName}
                          onChange={handleInputChange}
                          placeholder="e.g. CleanPro Services"
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-primary font-medium text-sm transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Business Type</label>
                        <select 
                          name="businessType"
                          value={formData.businessType}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary font-medium text-sm transition-all"
                        >
                          <option value="">Select Type</option>
                          {businessTypes.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Contact Person</label>
                        <input 
                          type="text"
                          name="contactPerson"
                          value={formData.contactPerson}
                          onChange={handleInputChange}
                          placeholder="Your full name"
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-primary font-medium text-sm transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Phone Number</label>
                        <input 
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="+234..."
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-primary font-medium text-sm transition-all"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Business Address</label>
                        <input 
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          placeholder="Full office address"
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-primary font-medium text-sm transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">CAC Number (Optional)</label>
                        <input 
                          type="text"
                          name="cacNumber"
                          value={formData.cacNumber}
                          onChange={handleInputChange}
                          placeholder="RC 1234567"
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-primary font-medium text-sm transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Years in Business</label>
                        <input 
                          type="number"
                          name="yearsInBusiness"
                          value={formData.yearsInBusiness}
                          onChange={handleInputChange}
                          placeholder="e.g. 5"
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
                    <h2 className="text-lg font-black text-gray-900 dark:text-white mb-6">Client Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2 md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Client / Company Name</label>
                        <input 
                          type="text"
                          name="clientName"
                          value={formData.clientName}
                          onChange={handleInputChange}
                          placeholder="Who are you proposing to?"
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-primary font-medium text-sm transition-all"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Client Address</label>
                        <input 
                          type="text"
                          name="clientAddress"
                          value={formData.clientAddress}
                          onChange={handleInputChange}
                          placeholder="Client's office address"
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-primary font-medium text-sm transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Contact Person at Client</label>
                        <input 
                          type="text"
                          name="clientContact"
                          value={formData.clientContact}
                          onChange={handleInputChange}
                          placeholder="e.g. The Manager"
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-primary font-medium text-sm transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Type of Client</label>
                        <select 
                          name="clientType"
                          value={formData.clientType}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary font-medium text-sm transition-all"
                        >
                          <option value="">Select Type</option>
                          {clientTypes.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
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
                      <h2 className="text-lg font-black text-gray-900 dark:text-white">Services & Pricing</h2>
                      <div className="flex gap-2">
                        <button 
                          onClick={suggestPricing}
                          disabled={isGenerating === 'pricing'}
                          className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1 hover:bg-primary/20 transition-colors disabled:opacity-50"
                        >
                          {isGenerating === 'pricing' ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                          Suggest Pricing
                        </button>
                        <button 
                          onClick={addLineItem}
                          className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                        >
                          <Plus size={20} />
                        </button>
                      </div>
                    </div>

                    {formData.lineItems.map((item: any, i: number) => (
                      <div key={i} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl p-6 relative group">
                        <button 
                          onClick={() => removeLineItem(i)}
                          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Service Name</label>
                            <input 
                              type="text"
                              value={item.name}
                              onChange={(e) => updateLineItem(i, 'name', e.target.value)}
                              placeholder="e.g. Monthly Estate Cleaning"
                              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-primary font-medium text-sm transition-all"
                            />
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Frequency</label>
                              <input 
                                type="text"
                                value={item.frequency}
                                onChange={(e) => updateLineItem(i, 'frequency', e.target.value)}
                                placeholder="Once"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-primary font-medium text-sm transition-all"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Price (₦)</label>
                              <input 
                                type="number"
                                value={item.price}
                                onChange={(e) => updateLineItem(i, 'price', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-primary font-medium text-sm transition-all"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Qty</label>
                              <input 
                                type="number"
                                value={item.qty}
                                onChange={(e) => updateLineItem(i, 'qty', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-primary font-medium text-sm transition-all"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 font-bold">Subtotal</span>
                        <span className="font-bold">₦{formData.subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 font-bold">VAT (7.5%)</span>
                        <span className="font-bold">₦{formData.vat.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-lg font-black text-primary border-t border-blue-100 dark:border-blue-900/30 pt-2">
                        <span>Grand Total</span>
                        <span>₦{formData.total.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Payment Terms</label>
                      <select 
                        name="paymentTerms"
                        value={formData.paymentTerms}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary font-medium text-sm transition-all"
                      >
                          <option value="">Select Terms</option>
                          {paymentTerms.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
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
                    <h2 className="text-lg font-black text-gray-900 dark:text-white mb-6">Proposal Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Proposed Start Date</label>
                        <input 
                          type="text"
                          name="startDate"
                          value={formData.startDate}
                          onChange={handleInputChange}
                          placeholder="e.g. 1st May 2024"
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-primary font-medium text-sm transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Contract Duration</label>
                        <input 
                          type="text"
                          name="duration"
                          value={formData.duration}
                          onChange={handleInputChange}
                          placeholder="e.g. 12 Months"
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-primary font-medium text-sm transition-all"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Why Choose Us (USPs)</label>
                          <button 
                            onClick={generateWhyChooseUs}
                            disabled={isGenerating === 'whyChooseUs'}
                            className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1 hover:opacity-80 disabled:opacity-50"
                          >
                            {isGenerating === 'whyChooseUs' ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                            Generate with AI
                          </button>
                        </div>
                        <div className="relative">
                          <textarea 
                            name="whyChooseUs"
                            value={formData.whyChooseUs}
                            onChange={handleInputChange}
                            rows={4}
                            placeholder="Explain why your business is the best fit..."
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-primary font-medium text-sm resize-none transition-all"
                          />
                          {formData.whyChooseUs && (
                            <button 
                              onClick={() => improveText('whyChooseUs', formData.whyChooseUs)}
                              className="absolute bottom-3 right-3 p-2 bg-white dark:bg-gray-900 shadow-lg rounded-lg text-primary hover:scale-110 transition-transform"
                              title="Improve with AI"
                            >
                              <Wand2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Equipment/Materials (Optional)</label>
                        <div className="relative">
                          <textarea 
                            name="equipment"
                            value={formData.equipment}
                            onChange={handleInputChange}
                            rows={2}
                            placeholder="List key equipment to be used..."
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none resize-none"
                          />
                          {formData.equipment && (
                            <button 
                              onClick={() => improveText('equipment', formData.equipment)}
                              className="absolute bottom-3 right-3 p-2 bg-white dark:bg-gray-900 shadow-lg rounded-lg text-primary hover:scale-110 transition-transform"
                              title="Improve with AI"
                            >
                              <Wand2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Team Size</label>
                        <input 
                          type="number"
                          name="teamSize"
                          value={formData.teamSize}
                          onChange={handleInputChange}
                          placeholder="e.g. 10"
                          className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none"
                        />
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
                    className="text-center py-12"
                  >
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 size={40} />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4">Proposal Ready!</h2>
                    <p className="text-gray-500 mb-8 max-w-sm mx-auto">Review your business proposal on the right. Once you're satisfied, pay to unlock the full document and download as PDF.</p>
                    
                    <div className="max-w-xs mx-auto mb-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-800">
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 text-left">Price to Unlock</p>
                      <div className="flex items-baseline gap-2 mb-6">
                        <span className="text-4xl font-black text-gray-900 dark:text-white">₦{calculatePrice().toLocaleString()}</span>
                        {appliedPromo && (
                          <span className="text-gray-400 line-through text-lg">₦{settings.pricing.proposal.toLocaleString()}</span>
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

                    <button 
                      onClick={() => setShowEmailModal(true)}
                      className="px-12 py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/30 flex items-center justify-center gap-3 mx-auto hover:bg-blue-900 transition-all active:scale-95"
                    >
                      <Lock size={20} />
                      Unlock Proposal
                    </button>

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
                {step < 5 && (
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
          <div className={`${(isPreviewMode || step === 5) ? 'block' : 'hidden'} lg:block sticky top-24`}>
            <DocumentPreview 
              documentData={formData}
              documentType="proposal"
              isPaid={isPaid}
              paymentRef={paymentRef}
              onPayClick={handlePay}
              price={calculatePrice()}
              filename={`${formData.businessName || 'business'}-proposal`}
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
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Unlock Your Proposal</h3>
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

export default ProposalBuilder;
