import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import html2pdf from 'html2pdf.js';
import { useSeo } from '../lib/seo';
import { 
  User as UserIcon, 
  Briefcase, 
  GraduationCap, 
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
  Sparkles,
  Loader2,
  Wand2,
  FileText,
  X,
  AlertTriangle,
  Tag as TagIcon,
  Download
} from 'lucide-react';
import { DocumentHTML, DocumentPreview, ScaledPreviewWrapper } from '../components/DocumentPreview';
import { useDocumentPayment } from '../lib/payment';
import { generateWithGemini } from '../lib/gemini';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { useDocumentSettings } from '../hooks/useDocumentSettings';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

const SOFT_SKILLS_OPTIONS = [
  'Communication', 'Teamwork', 'Problem Solving', 'Critical Thinking',
  'Leadership', 'Time Management', 'Adaptability', 'Creativity',
  'Emotional Intelligence', 'Conflict Resolution', 'Decision Making',
  'Attention to Detail', 'Work Ethic', 'Collaboration', 'Negotiation',
  'Active Listening', 'Stress Management', 'Accountability', 'Empathy',
  'Multitasking', 'Initiative', 'Patience', 'Persuasion', 'Flexibility',
  'Mentoring', 'Networking', 'Customer Service', 'Public Speaking',
  'Organisation', 'Self-Motivation'
];

const CVBuilder = () => {
  useSeo({
    title: 'Free ATS CV Builder | Hub & Jobs',
    description: 'Build a professional, ATS-optimized CV and download it instantly.',
    path: '/documents/cv'
  });
  const [step, setStep] = useState(1);
  const [isPaid, setIsPaid] = useState(false);
  const [paymentRef, setPaymentRef] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [softSkillSearch, setSoftSkillSearch] = useState('');
  const [certInput, setCertInput] = useState('');
  const [langInput, setLangInput] = useState('');
  const [techSkillInput, setTechSkillInput] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [email, setEmail] = useState('');
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { settings, loading: settingsLoading } = useDocumentSettings();
  const [suggestions, setSuggestions] = useState<{
    titles: string[];
    skills: { technical: string[], soft: string[] };
  }>({
    titles: [],
    skills: { technical: [], soft: [] }
  });
  
  const defaultFormData = {
    id: `cv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    fullName: '',
    professionalTitle: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    summary: '',
    experience: [],
    education: [],
    nyscStatus: '',
    technicalSkills: [],
    softSkills: [],
    languages: ['English'],
    certifications: [],
    referenceType: 'request',
    references: [],
    includeCoverLetter: false
  };

  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('cb_cv_draft');
    const parsed = saved ? JSON.parse(saved) : {};
    return {
      ...defaultFormData,
      ...parsed,
      fullName: parsed.fullName || '',
      professionalTitle: parsed.professionalTitle || '',
      email: parsed.email || '',
      phone: parsed.phone || '',
      location: parsed.location || '',
      linkedin: parsed.linkedin || '',
      summary: parsed.summary || '',
      nyscStatus: parsed.nyscStatus || '',
      experience: Array.isArray(parsed.experience) ? parsed.experience : [],
      education: Array.isArray(parsed.education) ? parsed.education : [],
      technicalSkills: Array.isArray(parsed.technicalSkills) ? parsed.technicalSkills : [],
      softSkills: Array.isArray(parsed.softSkills) ? parsed.softSkills : [],
      languages: Array.isArray(parsed.languages) ? parsed.languages : ['English'],
      certifications: Array.isArray(parsed.certifications) ? parsed.certifications : [],
      references: Array.isArray(parsed.references) ? parsed.references : [],
    };
  });

  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted) return;
    if (isPaid) {
      setIsPaid(false);
      setPaymentRef('');
      const paidDocs = JSON.parse(localStorage.getItem('hj_paid_docs') || '{}');
      delete paidDocs[formData.id];
      localStorage.setItem('hj_paid_docs', JSON.stringify(paidDocs));
    }
  }, [formData.fullName, formData.professionalTitle, formData.summary]);

  useEffect(() => {
    localStorage.setItem('cb_cv_draft', JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    if (settings?.requirePayment?.cv === false) {
      setIsPaid(true);
    }
  }, [settings]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setCheckingAuth(false);
      if (user?.email) setEmail(user.email);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const paidDocs = JSON.parse(localStorage.getItem('hj_paid_docs') || '{}');
    if (formData.id && paidDocs[formData.id]?.paid) {
      setIsPaid(true);
      setPaymentRef(paidDocs[formData.id].reference);
    }
  }, [formData.id]);

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const calculatePrice = () => {
    let basePrice = settings.pricing.cv;
    if (formData.includeCoverLetter) {
      basePrice += settings.pricing.coverLetter;
    }
    
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
        if (promo.appliesTo !== 'all' && promo.appliesTo !== 'cv') {
          toast.error('This promo code is not valid for CVs');
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
    documentType: 'cv',
    documentId: formData.id,
    amount: calculatePrice(),
    promoCode: appliedPromo?.code,
    metadata: {
      includeCoverLetter: formData.includeCoverLetter
    },
    onSuccess: async (response: any) => {
      console.log('Payment success:', response);
      const reference = response.reference || response;
      
      if (!reference) {
        toast.error('Payment verification failed');
        return;
      }

      try {
        const docData = {
          reference: reference,
          userId: auth.currentUser?.uid || 'guest',
          userEmail: auth.currentUser?.email || currentUser?.email || email || '',
          documentType: 'cv',
          formData: formData,
          paidAt: serverTimestamp(),
          amount: calculatePrice(),
          status: 'paid',
          title: formData.fullName 
            ? `${formData.fullName} - CV`
            : 'My CV',
        };

        const savedDoc = await addDoc(
          collection(db, 'user_documents'), 
          docData
        );

        const paidDocs = JSON.parse(
          localStorage.getItem('hj_paid_docs') || '{}'
        );
        paidDocs[savedDoc.id] = {
          paid: true,
          type: 'cv',
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

        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 }
        });
        
        toast.success('Payment successful! 🎉');

      } catch (err: any) {
        setIsPaid(true);
        setPaymentRef(reference);
        setShowSuccess(true);
        setShowEmailModal(false);
        console.error('Firestore save error:', err);
        toast.success('Payment successful! Your CV is unlocked.');
      }
    }
  });

  const handleDownloadPDF = async () => {
    if (!auth.currentUser) {
      toast.error('Please sign in or create an account to download your document');
      navigate('/admin/login?mode=signup', { state: { mode: 'signup', from: location.pathname } });
      return;
    }
    setIsGeneratingPDF(true);
    try {
      const previewEl = document.getElementById('cv-document-preview-inner') || document.getElementById('cv-document-preview');
      if (!previewEl) {
        toast.error('Preview not found');
        return;
      }

      const clone = previewEl.cloneNode(true) as HTMLElement;
      const wrapper = document.createElement('div');
      wrapper.style.cssText = `
        position: fixed;
        top: -9999px;
        left: -9999px;
        width: 794px;
        background: white;
        z-index: -1;
      `;
      clone.style.transform = 'none';
      clone.style.width = '794px';
      clone.style.zoom = '1';
      wrapper.appendChild(clone);
      document.body.appendChild(wrapper);

      await new Promise(r => setTimeout(r, 400));

      const opt = {
        margin: [5, 5, 5, 5],
        filename: `${formData.fullName?.replace(/\s+/g, '_') || 'CV'}-cv.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          width: 794,
          windowWidth: 794
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait'
        },
        pagebreak: {
          mode: ['css', 'legacy']
        }
      };

      await ((html2pdf as any).default || html2pdf)().set(opt).from(clone).save();
      
      document.body.removeChild(wrapper);
      toast.success('CV downloaded successfully!');
    } catch (err) {
      console.error('PDF error:', err);
      toast.error('Failed to generate PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePayment = () => {
    if (!auth.currentUser) {
      toast.error('Please sign in or create an account to download your document');
      navigate('/admin/login?mode=signup', { state: { mode: 'signup', from: location.pathname } });
      return;
    }
    const handler = (window as any).PaystackPop.setup({
      key: settings.payment.paystackPublicKey || 'pk_test_1234567890abcdef1234567890abcdef12345678',
      email: auth.currentUser?.email || email || 'user@email.com',
      amount: Math.round(calculatePrice() * 100),
      currency: 'NGN',
      ref: `CB_DOC_cv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      metadata: {
        custom_fields: [
          { display_name: 'Service', variable_name: 'service', value: 'CV Download' }
        ]
      },
      callback: function(response: any) {
        setPaymentRef(response.reference);
        setIsPaid(true);
        setShowSuccess(true);
        const paidDocs = JSON.parse(localStorage.getItem('hj_paid_docs') || '{}');
        paidDocs[formData.id] = { paid: true, reference: response.reference };
        localStorage.setItem('hj_paid_docs', JSON.stringify(paidDocs));
        toast.success('Payment successful! 🎉');
      },
      onClose: function() {
        toast.error('Payment cancelled');
      }
    });
    handler.openIframe();
  };

  const handleCopyText = () => {
    const text = `
Full Name: ${formData.fullName}
Professional Title: ${formData.professionalTitle}
Email: ${formData.email}
Phone: ${formData.phone}
Location: ${formData.location}
Summary: ${formData.summary}

Experience:
${formData.experience.map((e: any) => `- ${e.jobTitle} at ${e.companyName} (${e.startDate} - ${e.endDate})\n  ${e.responsibilities}`).join('\n\n')}

Education:
${formData.education.map((ed: any) => `- ${ed.degree}, ${ed.institutionName} (${ed.yearGraduated})`).join('\n')}

Technical Skills: ${formData.technicalSkills.join(', ')}
Soft Skills: ${formData.softSkills.join(', ')}
Certifications: ${formData.certifications}
    `.trim();
    navigator.clipboard.writeText(text);
    toast.success('CV text copied to clipboard!');
  };

  const suggestTitles = async () => {
    if (!formData.fullName) return toast.error("Enter your name first");
    setIsGenerating('titles');
    try {
      const prompt = `Suggest 5 professional job titles for a CV based on: 
      Name: ${formData.fullName}
      Location: ${formData.location || 'Nigeria'}
      
      Return ONLY a JSON array of strings. 
      Example: ["Title 1", "Title 2"]
      No markdown, no backticks, no "json" prefix.`;
      const res = await generateWithGemini(prompt);
      const cleaned = res.replace(/^json/i, '').trim();
      const titles = JSON.parse(cleaned);
      setSuggestions(prev => ({ ...prev, titles }));
    } catch (err) {
      console.error(err);
      toast.error("Failed to suggest titles");
    } finally {
      setIsGenerating(null);
    }
  };

  const generateSummary = async () => {
    if (!formData.professionalTitle) return toast.error("Enter your professional title first");
    setIsGenerating('summary');
    try {
      const prompt = `Write a powerful 3-sentence professional CV summary for:
      Title: ${formData.professionalTitle}
      Location: ${formData.location || 'Nigeria'}
      Experience: ${formData.experience.map((e: any) => e.jobTitle).join(', ')}
      Skills: ${[...formData.technicalSkills, ...formData.softSkills].join(', ')}
      
      Start directly with the job title.
      No intro sentence. No explanation. 
      Return the 3 sentences only.`;
      const summary = await generateWithGemini(prompt);
      setFormData(prev => ({ ...prev, summary }));
      toast.success("Summary generated!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate summary");
    } finally {
      setIsGenerating(null);
    }
  };

  const improveText = async (field: string, currentText: string, path?: string) => {
    if (!currentText) return;
    setIsGenerating(field);
    try {
      const prompt = `Improve this CV text to be more professional, powerful, and specific: "${currentText}". 
      Keep it concise. Start directly with the content. No intro or explanation.`;
      const improved = await generateWithGemini(prompt);
      
      if (path === 'experience') {
        const [index, subField] = field.split('.');
        updateExperience(parseInt(index), subField, improved);
      } else if (path === 'education') {
        const [index, subField] = field.split('.');
        updateEducation(parseInt(index), subField, improved);
      } else {
        setFormData(prev => ({ ...prev, [field]: improved }));
      }
      toast.success("Text improved!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to improve text");
    } finally {
      setIsGenerating(null);
    }
  };

  const generateResponsibilities = async (index: number) => {
    const exp = formData.experience[index];
    if (!exp.jobTitle) return toast.error("Enter job title first");
    setIsGenerating(`exp-${index}`);
    try {
      const prompt = `Write exactly 4 job responsibilities for 
      a ${exp.jobTitle} at ${exp.companyName || 'a company'} in Nigeria.
      
      Format: one responsibility per line.
      Start each with an action verb.
      No numbering. No bullets. No intro text.
      Return the 4 lines only.`;
      const res = await generateWithGemini(prompt);
      updateExperience(index, 'responsibilities', res);
      toast.success("Responsibilities generated!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate responsibilities");
    } finally {
      setIsGenerating(null);
    }
  };

  const suggestSkills = async () => {
    if (!formData.professionalTitle) return toast.error("Enter professional title first");
    setIsGenerating('skills');
    try {
      const prompt = `Suggest 8 technical and 4 soft skills for a ${formData.professionalTitle}. 
      Return ONLY a JSON object with "technical" and "soft" arrays.
      Example: {"technical": ["Skill 1"], "soft": ["Skill 2"]}
      No markdown, no backticks, no "json" prefix.`;
      const res = await generateWithGemini(prompt);
      const cleaned = res.replace(/^json/i, '').trim();
      const skills = JSON.parse(cleaned);
      setSuggestions(prev => ({ ...prev, skills }));
    } catch (err) {
      console.error(err);
      toast.error("Failed to suggest skills");
    } finally {
      setIsGenerating(null);
    }
  };

  const addExperience = () => {
    if (formData.experience.length >= 5) {
      toast.error('Maximum 5 experiences allowed');
      return;
    }
    setFormData((prev: any) => ({
      ...prev,
      experience: [...prev.experience, { jobTitle: '', companyName: '', location: '', startDate: '', endDate: '', responsibilities: '' }]
    }));
  };

  const updateExperience = (index: number, field: string, value: string) => {
    const newExp = [...formData.experience];
    newExp[index][field] = value;
    setFormData((prev: any) => ({ ...prev, experience: newExp }));
  };

  const removeExperience = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      experience: prev.experience.filter((_: any, i: number) => i !== index)
    }));
  };

  const addEducation = () => {
    setFormData((prev: any) => ({
      ...prev,
      education: [...prev.education, { degree: '', institutionName: '', yearGraduated: '', grade: '' }]
    }));
  };

  const updateEducation = (index: number, field: string, value: string) => {
    const newEdu = [...formData.education];
    newEdu[index][field] = value;
    setFormData((prev: any) => ({ ...prev, education: newEdu }));
  };

  const removeEducation = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      education: prev.education.filter((_: any, i: number) => i !== index)
    }));
  };

  const removeTag = (field: string, tag: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: prev[field].filter((t: string) => t !== tag)
    }));
  };

  const steps = [
    { id: 1, title: 'Personal Info', icon: UserIcon },
    { id: 2, title: 'Experience', icon: Briefcase },
    { id: 3, title: 'Education', icon: GraduationCap },
    { id: 4, title: 'Skills & Others', icon: Wrench },
    { id: 5, title: 'Preview & Pay', icon: Eye },
  ];

  const states = [
    "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT - Abuja", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"
  ];

  if (settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!settings.availability.masterToggle || !settings.availability.cv) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-sm flex items-center justify-center mx-auto mb-6 text-gray-400">
            <FileText size={40} />
          </div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4">CV Builder Offline</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">This builder is currently unavailable. Please check back later.</p>
          <Link to="/documents" className="px-8 py-4 bg-primary text-white font-black rounded-sm">Back to Documents</Link>
        </div>
      </div>
    );
  }

  const inputStyle = {
    width: '100%',
    minHeight: '48px',
    fontSize: '16px',
    border: '1px solid #E2E8F0',
    background: '#fff',
    borderRadius: '2px',
    padding: '12px',
    outline: 'none',
    color: '#0f172a'
  };

  const textareaStyle = {
    width: '100%',
    minHeight: '120px',
    fontSize: '16px',
    border: '1px solid #E2E8F0',
    background: '#fff',
    borderRadius: '2px',
    padding: '12px',
    outline: 'none',
    color: '#0f172a',
    resize: 'none' as const
  };

  const selectStyle = {
    width: '100%',
    minHeight: '48px',
    fontSize: '16px',
    border: '1px solid #E2E8F0',
    background: '#fff',
    borderRadius: '2px',
    padding: '12px',
    outline: 'none',
    color: '#0f172a'
  };

  const labelStyle = {
    fontSize: '12px',
    textTransform: 'uppercase' as const,
    fontWeight: 900,
    color: '#64748b',
    marginBottom: '6px',
    display: 'block'
  };

  const cardStyle = {
    background: '#fff',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    borderRadius: '2px',
    padding: '16px',
    border: '1px solid #E2E8F0',
    width: '100%',
    maxWidth: '430px',
    margin: '0 auto'
  };

  const subCardStyle = {
    background: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '2px',
    padding: '12px',
    position: 'relative' as const,
    marginBottom: '12px'
  };

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#dde3f0', paddingLeft: '12px', paddingRight: '12px' }}>
      {settings.payment.testMode && (
        <div className="bg-amber-500 text-white py-2 px-4 text-center font-black text-[10px] tracking-widest uppercase flex items-center justify-center space-x-2 rounded-sm mb-4">
          <AlertTriangle size={12} />
          <span>Test Mode Enabled</span>
        </div>
      )}

      {/* 1. TOP NAV */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-3 py-4 sticky top-0 z-[100] backdrop-blur-md bg-white/80 dark:bg-gray-900/80 rounded-sm mb-4" style={{ maxWidth: '430px', margin: '0 auto 16px auto' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-primary rounded-sm flex items-center justify-center text-white shadow-lg shadow-primary/20">
               <FileText size={20} />
             </div>
             <div>
               <h1 className="text-sm font-black text-gray-900 dark:text-white tracking-tight">Step By Step</h1>
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Performance CV Builder</p>
             </div>
          </div>
          <button 
            type="button"
            onClick={() => localStorage.setItem('cb_cv_draft', JSON.stringify(formData))}
            className="px-4 py-2 bg-gray-50 dark:bg-gray-800 text-[10px] font-black uppercase tracking-widest text-primary rounded-sm hover:bg-primary hover:text-white transition-all shadow-sm"
          >
            Save Draft
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '430px', margin: '0 auto' }}>
        {/* 2. PROGRESS BAR */}
        <div className="flex justify-between items-center mb-6 h-1 bg-gray-200 dark:bg-gray-800 rounded-sm relative">
          <div 
            className="absolute top-0 left-0 h-full bg-primary transition-all duration-500 ease-out rounded-sm"
            style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
          />
          {steps.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStep(s.id)}
              className={`w-7 h-7 rounded-sm flex items-center justify-center z-10 transition-all text-xs font-bold ${
                step >= s.id ? 'bg-primary text-white shadow-sm' : 'bg-gray-200 dark:bg-gray-800 text-gray-500'
              }`}
            >
              {s.id}
            </button>
          ))}
        </div>

        {/* 3. STEP HEADER */}
        <div className="mb-6 flex justify-between items-end">
          <div>
            <span className="text-[10px] font-black text-primary tracking-[0.2em] uppercase">
              STEP {step} OF 5: {steps[step - 1].title.toUpperCase()}
            </span>
            <h2 className="text-xl font-black text-gray-900 dark:text-white mt-1 tracking-tight">
              {steps[step - 1].title}
            </h2>
          </div>
          {step === 1 && (
            <button
              type="button"
              onClick={() => {
                const newId = `cv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                localStorage.removeItem('cb_cv_draft');
                setFormData({ ...defaultFormData, id: newId });
                setIsPaid(false);
                setPaymentRef('');
                setStep(1);
                toast.success('Started a new CV');
              }}
              className="text-xs text-emerald-600 font-bold hover:underline"
            >
              Start fresh &rarr;
            </button>
          )}
        </div>

        {/* 4. FORM CONTENT */}
        <div style={cardStyle}>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {/* Card 1: Personal Details */}
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '16px',
                    paddingBottom: '12px',
                    borderBottom: '2px solid #E8B736'
                  }}>
                    <div style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '2px',
                      backgroundColor: '#1E3B8B',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <UserIcon size={18} color="white" />
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a', margin: 0 }}>Personal Details</p>
                      <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Enter your contact and title information</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label style={labelStyle}>Full Name</label>
                      <input 
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        placeholder="Enter your full name"
                        style={inputStyle}
                      />
                    </div>
                    
                    <div>
                      <label style={labelStyle}>Professional Title</label>
                      <div className="relative">
                        <input 
                          type="text"
                          name="professionalTitle"
                          value={formData.professionalTitle}
                          onChange={handleInputChange}
                          placeholder="e.g. Software Engineer"
                          style={{ ...inputStyle, paddingRight: '48px' }}
                        />
                        <button 
                          type="button"
                          onClick={suggestTitles}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-primary hover:scale-110 transition-transform"
                        >
                          <Sparkles size={20} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label style={labelStyle}>Email</label>
                        <input 
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="Email address"
                          style={inputStyle}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Phone</label>
                        <input 
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="Phone number"
                          style={inputStyle}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label style={labelStyle}>Location</label>
                        <select 
                          name="location"
                          value={formData.location}
                          onChange={handleInputChange}
                          style={selectStyle}
                        >
                          <option value="">Select State</option>
                          {states.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>LinkedIn (Optional)</label>
                        <input 
                          type="text"
                          name="linkedin"
                          value={formData.linkedin}
                          onChange={handleInputChange}
                          placeholder="linkedin.com/in/username"
                          style={inputStyle}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 2: Professional Summary */}
                <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #E2E8F0' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '16px',
                    paddingBottom: '12px',
                    borderBottom: '2px solid #E8B736'
                  }}>
                    <div style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '2px',
                      backgroundColor: '#1E3B8B',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <FileText size={18} color="white" />
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a', margin: 0 }}>Professional Summary</p>
                      <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>A short punchy intro about your career</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="relative">
                      <textarea 
                        name="summary"
                        value={formData.summary}
                        onChange={handleInputChange}
                        rows={4}
                        placeholder="A short punchy intro..."
                        style={textareaStyle}
                      />
                      <button 
                        type="button"
                        onClick={generateSummary}
                        className="absolute bottom-3 right-3 p-2 bg-primary text-white rounded-sm shadow-sm"
                      >
                        <Wand2 size={16} />
                      </button>
                    </div>
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
                className="space-y-4"
              >
                {/* Card 1: Professional Experience */}
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '16px',
                    paddingBottom: '12px',
                    borderBottom: '2px solid #E8B736'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '2px',
                        backgroundColor: '#1E3B8B',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Briefcase size={18} color="white" />
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a', margin: 0 }}>Professional Experience</p>
                        <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Add up to 5 roles and achievements</p>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={addExperience}
                      style={{ height: '36px', padding: '0 12px', backgroundColor: '#1E3B8B', color: '#fff', borderRadius: '2px', border: 'none', fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                    >
                      <Plus size={14} /> Add Role
                    </button>
                  </div>

                  <div className="space-y-3 pt-2">
                    {formData.experience.map((exp: any, index: number) => (
                      <div 
                        key={index}
                        style={subCardStyle}
                      >
                        <button 
                          type="button"
                          onClick={() => removeExperience(index)}
                          style={{ position: 'absolute', top: '10px', right: '10px', width: '32px', height: '32px', backgroundColor: '#ef4444', color: '#fff', borderRadius: '2px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}
                        >
                          <X size={14} />
                        </button>

                        <div className="space-y-3 mb-3">
                          <div>
                            <label style={labelStyle}>Job Title</label>
                            <input 
                              type="text"
                              value={exp.jobTitle}
                              onChange={(e) => updateExperience(index, 'jobTitle', e.target.value)}
                              placeholder="e.g. Sales Manager"
                              style={inputStyle}
                            />
                          </div>
                          <div>
                            <label style={labelStyle}>Company</label>
                            <input 
                              type="text"
                              value={exp.companyName}
                              onChange={(e) => updateExperience(index, 'companyName', e.target.value)}
                              placeholder="e.g. Google"
                              style={inputStyle}
                            />
                          </div>
                        </div>

                        <div className="space-y-3 mb-3">
                          <div>
                            <label style={labelStyle}>Start Date</label>
                            <input 
                              type="text"
                              value={exp.startDate}
                              onChange={(e) => updateExperience(index, 'startDate', e.target.value)}
                              placeholder="e.g. Jan 2020"
                              style={inputStyle}
                            />
                          </div>
                          <div>
                            <label style={labelStyle}>End Date</label>
                            <input 
                              type="text"
                              value={exp.endDate}
                              onChange={(e) => updateExperience(index, 'endDate', e.target.value)}
                              placeholder="e.g. Present"
                              style={inputStyle}
                            />
                          </div>
                        </div>

                        <div className="space-y-2 mb-3">
                          <label style={labelStyle}>Location</label>
                          <input 
                            type="text"
                            value={exp.location}
                            onChange={(e) => updateExperience(index, 'location', e.target.value)}
                            placeholder="e.g. Lagos, Nigeria"
                            style={inputStyle}
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-center mb-1">
                            <label style={labelStyle}>Responsibilities</label>
                            <button 
                              type="button"
                              onClick={() => generateResponsibilities(index)}
                              className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1 hover:underline"
                            >
                              <Sparkles size={10} /> AI Generate
                            </button>
                          </div>
                          <textarea 
                            value={exp.responsibilities}
                            onChange={(e) => updateExperience(index, 'responsibilities', e.target.value)}
                            rows={4}
                            placeholder="Describe your achievements..."
                            style={textareaStyle}
                          />
                        </div>
                      </div>
                    ))}
                    {formData.experience.length === 0 && (
                      <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-sm">
                        <p className="text-sm font-bold text-gray-400 mb-4">No work experience added yet</p>
                        <button 
                          type="button"
                          onClick={addExperience}
                          className="px-6 py-3 bg-primary text-white font-black text-xs uppercase tracking-wider rounded-sm"
                        >
                          + Add Your First Role
                        </button>
                      </div>
                    )}
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
                className="space-y-4"
              >
                {/* Card 1: Education */}
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '16px',
                    paddingBottom: '12px',
                    borderBottom: '2px solid #E8B736'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '2px',
                        backgroundColor: '#1E3B8B',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <GraduationCap size={18} color="white" />
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a', margin: 0 }}>Education</p>
                        <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Add your degrees and institutions</p>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={addEducation}
                      style={{ height: '36px', padding: '0 12px', backgroundColor: '#1E3B8B', color: '#fff', borderRadius: '2px', border: 'none', fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                    >
                      <Plus size={14} /> Add School
                    </button>
                  </div>

                  <div className="space-y-3 pt-2">
                    {formData.education.map((edu: any, index: number) => (
                      <div 
                        key={index}
                        style={subCardStyle}
                      >
                        <button 
                          type="button"
                          onClick={() => removeEducation(index)}
                          style={{ position: 'absolute', top: '10px', right: '10px', width: '32px', height: '32px', backgroundColor: '#ef4444', color: '#fff', borderRadius: '2px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}
                        >
                          <X size={14} />
                        </button>

                        <div className="space-y-3 mb-3">
                          <div>
                            <label style={labelStyle}>Degree / Qualification</label>
                            <input 
                              type="text"
                              value={edu.degree}
                              onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                              placeholder="e.g. B.Sc. Computer Science"
                              style={inputStyle}
                            />
                          </div>
                          <div>
                            <label style={labelStyle}>Institution</label>
                            <input 
                              type="text"
                              value={edu.institutionName}
                              onChange={(e) => updateEducation(index, 'institutionName', e.target.value)}
                              placeholder="e.g. University of Lagos"
                              style={inputStyle}
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label style={labelStyle}>Year Graduated</label>
                            <input 
                              type="text"
                              value={edu.yearGraduated}
                              onChange={(e) => updateEducation(index, 'yearGraduated', e.target.value)}
                              placeholder="e.g. 2021"
                              style={inputStyle}
                            />
                          </div>
                          <div>
                            <label style={labelStyle}>Grade (Optional)</label>
                            <input 
                              type="text"
                              value={edu.grade}
                              onChange={(e) => updateEducation(index, 'grade', e.target.value)}
                              placeholder="e.g. Second Class Upper"
                              style={inputStyle}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    {formData.education.length === 0 && (
                      <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-sm">
                        <p className="text-sm font-bold text-gray-400 mb-4">No education added yet</p>
                        <button 
                          type="button"
                          onClick={addEducation}
                          className="px-6 py-3 bg-primary text-white font-black text-xs uppercase tracking-wider rounded-sm"
                        >
                          + Add Your Education
                        </button>
                      </div>
                    )}
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
                className="space-y-4"
              >
                {/* Card 1: Skills */}
                <div>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    marginBottom: '16px',
                    paddingBottom: '12px',
                    borderBottom: '2px solid #E8B736'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '2px',
                        backgroundColor: '#1E3B8B',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Wrench size={18} color="white" />
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a', margin: 0 }}>Skills & Competencies</p>
                        <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Technical and Soft skills</p>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={suggestSkills}
                      className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-sm"
                    >
                      <Sparkles size={12} /> AI Suggest
                    </button>
                  </div>

                  <div className="space-y-6 pt-2">
                    <div>
                      <label style={labelStyle}>Technical Skills</label>
                      <div style={{ display: 'flex', gap: '8px', width: '100%', marginBottom: '12px' }}>
                        <input 
                          type="text"
                          value={techSkillInput}
                          onChange={(e) => setTechSkillInput(e.target.value)}
                          onKeyDown={(e: any) => {
                            if (e.key === 'Enter' || e.keyCode === 13) {
                              e.preventDefault();
                              const val = techSkillInput.trim();
                              if (val) {
                                const currentSkills = Array.isArray(formData.technicalSkills) ? formData.technicalSkills : [];
                                const exists = currentSkills.some((s: string) => s.toLowerCase() === val.toLowerCase());
                                if (!exists) {
                                  setFormData((prev: any) => ({ ...prev, technicalSkills: [...currentSkills, val] }));
                                }
                                setTechSkillInput('');
                              }
                            }
                          }}
                          enterKeyHint="done"
                          placeholder="Type skill & press enter..."
                          style={inputStyle}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const val = techSkillInput.trim();
                            if (val) {
                              const currentSkills = Array.isArray(formData.technicalSkills) ? formData.technicalSkills : [];
                              const exists = currentSkills.some((s: string) => s.toLowerCase() === val.toLowerCase());
                              if (!exists) {
                                setFormData((prev: any) => ({ ...prev, technicalSkills: [...currentSkills, val] }));
                              }
                              setTechSkillInput('');
                            }
                          }}
                          style={{ flexShrink: 0, height: '48px', padding: '0 14px', backgroundColor: '#1E3B8B', color: 'white', borderRadius: '2px', border: 'none', fontWeight: 700, fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                          + Add
                        </button>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {formData.technicalSkills.map((skill: string) => (
                          <span key={skill} style={{ backgroundColor: '#1E3B8B', color: 'white', borderRadius: '2px', padding: '4px 10px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            {skill}
                            <button type="button" onClick={() => removeTag('technicalSkills', skill)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '32px', minHeight: '32px' }}><X size={14} /></button>
                          </span>
                        ))}
                      </div>
                      {suggestions.skills.technical.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {suggestions.skills.technical.filter(s => !formData.technicalSkills.includes(s)).map(s => (
                            <button 
                              key={s} 
                              type="button"
                              onClick={() => setFormData((prev: any) => ({ ...prev, technicalSkills: [...formData.technicalSkills, s ]}))}
                              className="text-[10px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-sm hover:bg-primary/20 transition-colors"
                            >
                              + {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label style={labelStyle}>Soft Skills</label>
                      <input 
                        type="text"
                        value={softSkillSearch}
                        onChange={(e) => setSoftSkillSearch(e.target.value)}
                        placeholder="Search soft skills..."
                        style={{ ...inputStyle, marginBottom: '8px' }}
                      />
                      <div style={{
                        border: '1px solid #E2E8F0',
                        borderRadius: '2px',
                        background: 'white',
                        maxHeight: '220px',
                        overflowY: 'auto'
                      }}>
                        {SOFT_SKILLS_OPTIONS.filter(skill => skill.toLowerCase().includes(softSkillSearch.toLowerCase())).map((skill) => {
                          const isSelected = formData.softSkills.includes(skill);
                          return (
                            <div
                              key={skill}
                              onClick={() => {
                                if (isSelected) {
                                  setFormData((prev: any) => ({
                                    ...prev,
                                    softSkills: prev.softSkills.filter((s: string) => s !== skill)
                                  }));
                                } else {
                                  setFormData((prev: any) => ({
                                    ...prev,
                                    softSkills: [...prev.softSkills, skill]
                                  }));
                                }
                              }}
                              style={{
                                padding: '10px 12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                borderBottom: '1px solid #f8fafc',
                                backgroundColor: isSelected ? '#1E3B8B' : 'white',
                                color: isSelected ? 'white' : '#334155'
                              }}
                            >
                              <div style={{
                                width: '16px',
                                height: '16px',
                                borderRadius: '2px',
                                border: isSelected ? '1px solid white' : '1px solid #cbd5e1',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: isSelected ? 'white' : 'transparent',
                                color: '#1E3B8B',
                                fontSize: '10px',
                                fontWeight: 'bold'
                              }}>
                                {isSelected && '✓'}
                              </div>
                              <span>{skill}</span>
                            </div>
                          );
                        })}
                      </div>

                      {formData.softSkills.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {formData.softSkills.map((skill: string) => (
                            <span 
                              key={skill} 
                              style={{
                                backgroundColor: '#1E3B8B',
                                color: 'white',
                                borderRadius: '2px',
                                padding: '4px 8px',
                                fontSize: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              {skill}
                              <button type="button" onClick={() => removeTag('softSkills', skill)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '32px', minHeight: '32px' }}><X size={12} /></button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card 2: Certifications, References & Languages */}
                <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #E2E8F0' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '16px',
                    paddingBottom: '12px',
                    borderBottom: '2px solid #E8B736'
                  }}>
                    <div style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '2px',
                      backgroundColor: '#1E3B8B',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <FileText size={18} color="white" />
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a', margin: 0 }}>Certifications, References & Languages</p>
                      <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Additional qualifications and details</p>
                    </div>
                  </div>

                  <div className="space-y-6 pt-2">
                    <div>
                      <label style={labelStyle}>Certifications & Awards</label>
                      <div style={{ display: 'flex', gap: '8px', width: '100%', marginBottom: '12px' }}>
                        <input
                          type="text"
                          placeholder="e.g. Google Analytics Certificate"
                          value={certInput}
                          onChange={(e) => setCertInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.keyCode === 13) {
                              e.preventDefault();
                              const val = certInput.trim();
                              if (val) {
                                const currentCerts = Array.isArray(formData.certifications) ? formData.certifications : [];
                                const exists = currentCerts.some((c: string) => c.toLowerCase() === val.toLowerCase());
                                if (!exists) {
                                  setFormData((prev: any) => ({ ...prev, certifications: [...currentCerts, val] }));
                                }
                                setCertInput('');
                              }
                            }
                          }}
                          enterKeyHint="done"
                          style={inputStyle}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const val = certInput.trim();
                            if (val) {
                              const currentCerts = Array.isArray(formData.certifications) ? formData.certifications : [];
                              const exists = currentCerts.some((c: string) => c.toLowerCase() === val.toLowerCase());
                              if (!exists) {
                                setFormData((prev: any) => ({ ...prev, certifications: [...currentCerts, val] }));
                              }
                              setCertInput('');
                            }
                          }}
                          style={{ flexShrink: 0, height: '48px', padding: '0 14px', backgroundColor: '#1E3B8B', color: 'white', borderRadius: '2px', border: 'none', fontWeight: 700, fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                          + Add
                        </button>
                      </div>
                      {/* Tags */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {(Array.isArray(formData.certifications) ? formData.certifications : []).map((cert: any, i: number) => (
                          <span key={i} style={{ backgroundColor: '#1E3B8B', color: 'white', borderRadius: '2px', padding: '4px 10px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            {cert}
                            <button type="button" onClick={() => setFormData((prev: any) => ({ ...prev, certifications: prev.certifications.filter((_: any, idx: number) => idx !== i) }))} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '32px', minHeight: '32px' }}>×</button>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label style={labelStyle}>References</label>
                      <div className="flex gap-4">
                        {['request', 'details'].map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setFormData((prev: any) => ({ ...prev, referenceType: type }))}
                            className={`flex-1 py-3 rounded-sm text-xs font-black uppercase tracking-widest transition-all border ${
                              formData.referenceType === type 
                                ? 'bg-primary border-primary text-white' 
                                : 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-500'
                            }`}
                          >
                            {type === 'request' ? 'On Request' : 'Full Details'}
                          </button>
                        ))}
                      </div>

                      {formData.referenceType === 'details' && (
                        <div className="space-y-4 pt-2">
                          {formData.references.map((ref: any, i: number) => (
                            <div key={i} style={subCardStyle}>
                              <button 
                                type="button"
                                onClick={() => {
                                  const newRefs = formData.references.filter((_: any, idx: number) => idx !== i);
                                  setFormData((prev: any) => ({ ...prev, references: newRefs }));
                                }}
                                style={{ position: 'absolute', top: '10px', right: '10px', width: '32px', height: '32px', backgroundColor: '#ef4444', color: '#fff', borderRadius: '2px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}
                              >
                                <X size={14} />
                              </button>
                              <div className="space-y-3">
                                <input 
                                  placeholder="Reference Name"
                                  value={ref.name}
                                  onChange={(e) => {
                                    const newRefs = [...formData.references];
                                    newRefs[i].name = e.target.value;
                                    setFormData((prev: any) => ({ ...prev, references: newRefs }));
                                  }}
                                  style={inputStyle}
                                />
                                <input 
                                  placeholder="Company / Position"
                                  value={ref.company}
                                  onChange={(e) => {
                                    const newRefs = [...formData.references];
                                    newRefs[i].company = e.target.value;
                                    setFormData((prev: any) => ({ ...prev, references: newRefs }));
                                  }}
                                  style={inputStyle}
                                />
                                <input 
                                  placeholder="Phone / Email"
                                  value={ref.phone}
                                  onChange={(e) => {
                                    const newRefs = [...formData.references];
                                    newRefs[i].phone = e.target.value;
                                    setFormData((prev: any) => ({ ...prev, references: newRefs }));
                                  }}
                                  style={inputStyle}
                                />
                              </div>
                            </div>
                          ))}
                          <button 
                            type="button"
                            onClick={() => setFormData((prev: any) => ({ ...prev, references: [...prev.references, { name: '', company: '', phone: '' }] }))}
                            className="w-full py-3 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-sm text-xs font-bold text-gray-400 hover:border-primary hover:text-primary transition-all"
                          >
                            + Add Reference Detail
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                      <label style={labelStyle}>Languages</label>
                      <div style={{ display: 'flex', gap: '8px', width: '100%', marginBottom: '12px' }}>
                        <input
                          type="text"
                          placeholder="e.g. English, French"
                          value={langInput}
                          onChange={(e) => setLangInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.keyCode === 13) {
                              e.preventDefault();
                              const val = langInput.trim();
                              if (val) {
                                const currentLangs = Array.isArray(formData.languages) ? formData.languages : [];
                                const exists = currentLangs.some((l: string) => l.toLowerCase() === val.toLowerCase());
                                if (!exists) {
                                  setFormData((prev: any) => ({ ...prev, languages: [...currentLangs, val] }));
                                }
                                setLangInput('');
                              }
                            }
                          }}
                          enterKeyHint="done"
                          style={inputStyle}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const val = langInput.trim();
                            if (val) {
                              const currentLangs = Array.isArray(formData.languages) ? formData.languages : [];
                              const exists = currentLangs.some((l: string) => l.toLowerCase() === val.toLowerCase());
                              if (!exists) {
                                setFormData((prev: any) => ({ ...prev, languages: [...currentLangs, val] }));
                              }
                              setLangInput('');
                            }
                          }}
                          style={{ flexShrink: 0, height: '48px', padding: '0 14px', backgroundColor: '#1E3B8B', color: 'white', borderRadius: '2px', border: 'none', fontWeight: 700, fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                          + Add
                        </button>
                      </div>
                      {/* Tags */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {(Array.isArray(formData.languages) ? formData.languages : []).map((lang: any, i: number) => (
                          <span key={i} style={{ backgroundColor: '#1E3B8B', color: 'white', borderRadius: '2px', padding: '4px 10px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            {lang}
                            <button type="button" onClick={() => setFormData((prev: any) => ({ ...prev, languages: prev.languages.filter((_: any, idx: number) => idx !== i) }))} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '32px', minHeight: '32px' }}>×</button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div 
                key="step5"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4 relative"
              >
                {/* CV Preview Container */}
                <div 
                  id="cv-document-preview"
                  className="bg-white p-0 rounded-sm border border-gray-200 shadow-sm transition-all overflow-hidden"
                  style={!isPaid ? { filter: 'blur(4px)', pointerEvents: 'none' } : {}}
                >
                  <ScaledPreviewWrapper isPaid={isPaid} maxHeight="420px">
                    <div
                      id="cv-document-preview-inner"
                      style={{ width: '794px', background: 'white' }}
                    >
                      <DocumentHTML data={formData} type="cv" />
                    </div>
                  </ScaledPreviewWrapper>
                </div>

                {/* Overlay / Action Card */}
                {!isPaid ? (
                  settings?.requirePayment?.cv === false ? (
                    // Free download — no payment needed
                    <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-sm text-center space-y-4">
                      <div className="w-12 h-12 bg-emerald-500 text-white rounded-sm flex items-center justify-center mx-auto text-xl">
                        🎉
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-emerald-800">Free Download!</h3>
                        <p className="text-xs text-gray-500 mt-1">
                          This document is currently free. Download it now.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleDownloadPDF}
                        disabled={isGeneratingPDF}
                        style={{ backgroundColor: '#1E3B8B', color: 'white', borderRadius: '2px', height: '48px', padding: '0 24px', fontWeight: 700, fontSize: '14px', width: '100%', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                      >
                        {isGeneratingPDF ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                        Download PDF Free
                      </button>
                    </div>
                  ) : (
                    // Payment required
                    <div className="absolute inset-0 flex items-center justify-center p-4 z-20 bg-white/40 dark:bg-black/40 backdrop-blur-xs rounded-sm">
                      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-sm shadow-xl max-w-sm w-full text-center space-y-4">
                        <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-sm flex items-center justify-center mx-auto">
                          <Lock size={24} />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-gray-900 dark:text-white">Unlock Your CV</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            ₦{calculatePrice().toLocaleString()} one-time payment to download your professional CV
                          </p>
                        </div>
                        <button 
                          type="button"
                          onClick={handlePayment}
                          style={{ width: '100%', height: '48px', backgroundColor: '#10b981', color: 'white', fontWeight: 900, fontSize: '13px', textTransform: 'uppercase', borderRadius: '2px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)' }}
                        >
                          Pay ₦{calculatePrice().toLocaleString()} to Download
                        </button>
                        <p className="text-[10px] text-gray-400">Secured by Paystack</p>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 p-6 rounded-sm text-center space-y-4">
                    <div className="w-12 h-12 bg-emerald-500 text-white rounded-sm flex items-center justify-center mx-auto text-xl">
                      🎉
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-emerald-800 dark:text-emerald-400">Payment Successful!</h3>
                      <div style={{ marginTop: '6px' }}>
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>Reference:</span>
                        <div style={{
                          fontSize: '10px',
                          fontFamily: 'monospace',
                          fontWeight: 'bold',
                          wordBreak: 'break-all',
                          overflowWrap: 'break-word',
                          marginTop: '2px',
                          color: '#374151'
                        }}>
                          {paymentRef}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3 justify-center">
                      <button 
                        type="button"
                        onClick={handleDownloadPDF}
                        disabled={isGeneratingPDF}
                        style={{ width: '100%', height: '48px', backgroundColor: '#10b981', color: 'white', fontWeight: 900, fontSize: '13px', textTransform: 'uppercase', borderRadius: '2px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                      >
                        {isGeneratingPDF ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                        Download PDF Now
                      </button>
                      <button 
                        type="button"
                        onClick={handleCopyText}
                        style={{ width: '100%', height: '48px', backgroundColor: '#111827', color: 'white', fontWeight: 900, fontSize: '13px', textTransform: 'uppercase', borderRadius: '2px', border: 'none', cursor: 'pointer' }}
                      >
                        Copy Text
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newId = `cv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                        localStorage.removeItem('cb_cv_draft');
                        setFormData({ ...defaultFormData, id: newId });
                        setIsPaid(false);
                        setPaymentRef('');
                        setStep(1);
                        toast.success('Started a new CV');
                      }}
                      style={{ marginTop: '8px', background: 'none', border: '1px solid #E2E8F0', borderRadius: '2px', height: '44px', color: '#64748b', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', width: '100%' }}
                    >
                      + Create New CV
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 5. NAVIGATION BUTTONS */}
        <div style={{ display: 'flex', gap: '8px', width: '100%', maxWidth: '430px', margin: '24px auto 96px auto' }}>
          {step > 1 && (
            <button 
              type="button"
              onClick={() => setStep(step - 1)}
              style={{ flex: 1, height: '48px', backgroundColor: '#fff', border: '1px solid #E2E8F0', color: '#64748b', fontWeight: 900, fontSize: '12px', textTransform: 'uppercase', borderRadius: '2px', cursor: 'pointer' }}
            >
              &larr; Previous
            </button>
          )}
          <button 
            type="button"
            onClick={() => {
              if (step < 5) setStep(step + 1);
            }}
            style={{ flex: 2, height: '48px', backgroundColor: '#1E3B8B', color: '#fff', fontWeight: 900, fontSize: '12px', textTransform: 'uppercase', borderRadius: '2px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {step === 5 ? 'Finish' : 'Next Step'} <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-900 p-8 rounded-sm max-w-xs w-full text-center shadow-2xl"
          >
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-sm flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={36} />
            </div>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3">Payment Success!</h3>
            <p className="text-gray-500 dark:text-gray-400 text-xs mb-6">Your professional CV has been unlocked. You can now download it as a PDF.</p>
            <button 
              type="button"
              onClick={() => setShowSuccess(false)}
              style={{ width: '100%', height: '48px', backgroundColor: '#1E3B8B', color: 'white', fontWeight: 900, fontSize: '12px', textTransform: 'uppercase', borderRadius: '2px', border: 'none', cursor: 'pointer' }}
            >
              Get Started
            </button>
          </motion.div>
        </div>
      )}

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white dark:bg-gray-900 p-6 rounded-sm max-w-sm w-full shadow-2xl border border-gray-100 dark:border-gray-800"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white">Verify Your Email</h3>
                <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">We'll send your CV link to this email.</p>
              </div>
              <button 
                type="button"
                onClick={() => setShowEmailModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-sm transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label style={labelStyle}>Email Address</label>
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. john@example.com"
                  style={inputStyle}
                />
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-sm">
                 <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                    <span className="font-bold text-xs text-gray-900 dark:text-white">Document Fee</span>
                    <span className="font-black text-xs text-gray-900 dark:text-white">₦{calculatePrice()}</span>
                 </div>
                 
                 <div className="space-y-2">
                   <div className="relative">
                     <TagIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                     <input 
                       type="text"
                       value={promoCode}
                       onChange={(e) => setPromoCode(e.target.value)}
                       placeholder="Promo Code"
                       style={{ ...inputStyle, paddingLeft: '36px', paddingRight: '80px', minHeight: '44px', fontSize: '14px' }}
                     />
                     <button 
                       type="button"
                       onClick={validatePromoCode}
                       disabled={isValidatingPromo || !promoCode}
                       style={{ position: 'absolute', right: '6px', top: '1/2', transform: 'translateY(-50%)', height: '32px', padding: '0 12px', background: '#111827', color: '#fff', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', borderRadius: '2px', border: 'none', cursor: 'pointer' }}
                     >
                       {isValidatingPromo ? '...' : 'Apply'}
                     </button>
                   </div>
                   {appliedPromo && (
                     <p className="text-[10px] font-bold text-primary uppercase flex items-center gap-1 pl-1">
                       <CheckCircle2 size={10} />
                       Discount Applied: {appliedPromo.discountType === 'percentage' ? `${appliedPromo.value}%` : `₦${appliedPromo.value}`} off
                     </p>
                   )}
                 </div>
              </div>

              <button 
                type="button"
                onClick={pay}
                disabled={!email || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))}
                style={{ width: '100%', height: '48px', backgroundColor: '#1E3B8B', color: 'white', fontWeight: 900, fontSize: '12px', textTransform: 'uppercase', borderRadius: '2px', border: 'none', cursor: 'pointer', opacity: (!email || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) ? 0.5 : 1 }}
              >
                Proceed to Payment — ₦{calculatePrice()}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default CVBuilder;
