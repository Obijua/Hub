import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Share2, MapPin, Briefcase, ExternalLink, MessageCircle } from 'lucide-react';
import { doc, getDoc, collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Post } from '../types';
import { toast } from 'sonner';
import AdUnit from '../components/AdUnit';

export const JobDetailPage = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const stateJob = (location.state as { job?: Post })?.job;

  const [job, setJob] = useState<Post | null>(stateJob || null);
  const [loading, setLoading] = useState(!stateJob);
  const [hasApplied, setHasApplied] = useState(false);
  const [adConfig, setAdConfig] = useState<any>(null);

  useEffect(() => {
    const fetchJob = async () => {
      if (stateJob || !jobId) return;
      try {
        const docRef = doc(db, 'posts', jobId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setJob({ id: docSnap.id, ...docSnap.data() } as Post);
        } else {
          toast.error('Job not found');
        }
      } catch (e) {
        console.error(e);
        toast.error('Failed to load job details');
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [jobId, stateJob]);

  useEffect(() => {
    const fetchAdConfig = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'monetization'));
        if (snap.exists()) setAdConfig(snap.data());
      } catch (e) {}
    };
    fetchAdConfig();
  }, []);

  useEffect(() => {
    if (!auth.currentUser || !job) return;
    const currentJobId = job.id || '';
    if (!currentJobId) { setHasApplied(false); return; }
    const checkApplication = async () => {
      try {
        const q = query(
          collection(db, 'applications'),
          where('jobId', '==', currentJobId),
          where('seekerId', '==', auth.currentUser!.uid)
        );
        const snap = await getDocs(q);
        setHasApplied(!snap.empty);
      } catch {
        setHasApplied(false);
      }
    };
    checkApplication();
  }, [job]);

  const pAny = job as any;
  const companyName = 
    pAny?.company || 
    pAny?.companyName || 
    pAny?.employer ||
    pAny?.organizationName || 
    pAny?.recruiterCompany || '';

  const locationText = job?.location || 'Nigeria';
  
  const VALID_TYPES = ['Full-time', 'Part-time', 'Remote', 
    'Internship', 'Contract', 'Freelance'];
  const jobType = VALID_TYPES.find(t => 
    t.toLowerCase() === (pAny?.jobType || pAny?.type || '')
    .toLowerCase()
  ) || 'Full-time';

  const salaryText = job?.salary || 'Competitive';
  const requirements = pAny?.requirements || [];

  const currentJobId = job?.id || '';

  const hasWhatsApp = !!(pAny?.whatsappNumber && String(pAny.whatsappNumber).trim() !== '');
  const hasExternalLink = !!(pAny?.externalLink && String(pAny.externalLink).trim() !== '');
  const buttonText = pAny?.externalLinkText || pAny?.ctaText || 'Apply Now';
  const whatsappButtonText = pAny?.whatsappButtonText || 'WhatsApp';

  const handleEasyApply = async () => {
    if (!auth.currentUser || !currentJobId || hasApplied) return;
    try {
      await addDoc(collection(db, 'applications'), {
        jobId: currentJobId,
        seekerId: auth.currentUser.uid,
        jobTitle: job?.title || '',
        company: companyName,
        status: 'applied',
        appliedAt: serverTimestamp(),
      });
      setHasApplied(true);
      toast.success(`Successfully applied to ${job?.title || 'job'}!`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit application');
    }
  };

  const handleShare = () => {
    const text = encodeURIComponent(`Check out this job: ${job?.title || 'Job Opening'} at ${companyName || 'Hub & Jobs'}. View on Hub & Jobs: ${window.location.href}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const cleanHtml = (html: string): string => {
    if (!html) return '';
    return html
      .replace(/([a-zA-Z])<br\s*\/?>\s*([a-zA-Z])/gi, '$1$2')
      .replace(/&nbsp;/gi, ' ')
      .replace(/  +/g, ' ');
  };

  const renderDescriptionWithAds = (html: string) => {
    if (!html) return null;

    // No adConfig yet — render without ads
    if (!adConfig) {
      return (
        <div
          className="jd-content"
          style={{ fontSize: '14px', color: '#1e293b', lineHeight: '1.7', width: '100%', overflowWrap: 'anywhere', wordBreak: 'break-word' }}
          dangerouslySetInnerHTML={{ __html: cleanHtml(html) }}
        />
      );
    }

    // Check correct Firestore field names from admin
    const adsEnabled = adConfig.masterSwitch && adConfig.articleAdsEnabled;

    if (!adsEnabled) {
      return (
        <div
          className="jd-content"
          style={{ fontSize: '14px', color: '#1e293b', lineHeight: '1.7', width: '100%', overflowWrap: 'anywhere', wordBreak: 'break-word' }}
          dangerouslySetInnerHTML={{ __html: cleanHtml(html) }}
        />
      );
    }

    // CORRECT field names matching Firestore/Admin exactly
    const frequency = Number(adConfig.articleAdFrequency) || 3;
    const maxAds = Number(adConfig.articleMaxAds) || 2;

    // Split ONLY on block-level closing tags — NOT on </li>
    const chunks = html
      .split(/(?<=<\/p>|<\/h[1-6]>|<\/blockquote>|<\/ul>|<\/ol>)/)
      .filter(chunk => chunk.trim().length > 0);

    const result: React.ReactNode[] = [];
    let adCount = 0;
    let chunksSinceLastAd = 0;

    chunks.forEach((chunk, index) => {
      result.push(
        <div
          key={`chunk-${index}`}
          className="jd-content"
          style={{
            fontSize: '14px',
            color: '#1e293b',
            lineHeight: '1.7',
            width: '100%',
            overflowWrap: 'anywhere',
            wordBreak: 'break-word'
          }}
          dangerouslySetInnerHTML={{ __html: cleanHtml(chunk) }}
        />
      );

      chunksSinceLastAd++;

      if (
        chunksSinceLastAd >= frequency &&
        adCount < maxAds &&
        index < chunks.length - 1
      ) {
        adCount++;
        chunksSinceLastAd = 0;
        result.push(
          <AdUnit
            key={`ad-${adCount}`}
            slot={`article-inline-${adCount}`}
            label="Advertisement"
            className="my-3"
          />
        );
      }
    });

    return result;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EEF2FF] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#1E3B8B] border-t-transparent animate-spin rounded-sm" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-[#EEF2FF] px-4 pt-12 text-center">
        <p className="text-slate-700 font-semibold mb-2">Job not found</p>
        <button onClick={() => navigate(-1)} className="text-[#1E3B8B] text-sm font-medium">Go Back</button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#EEF2FF', overflowX: 'hidden', width: '100%', paddingBottom: '120px' }}>

      {/* Global style for description HTML */}
      <style>{`
  * { box-sizing: border-box; }
  
  .jd-content { 
    width: 100%; 
    color: #1e293b;
    font-size: 14px;
    line-height: 1.7;
  }
  
  /* Preserve ALL inline styles from rich text editor */
  .jd-content [style] { all: revert; }
  
  /* Base text */
  .jd-content p { 
    margin-bottom: 12px; 
    overflow-wrap: anywhere;
    word-break: break-word;
    color: #1e293b;
  }
  .jd-content p:empty { display: none; }
  
  /* Headings */
  .jd-content h1 { font-size: 22px !important; font-weight: 800 !important; color: #0f172a !important; margin-bottom: 12px !important; }
  .jd-content h2 { font-size: 18px !important; font-weight: 700 !important; color: #0f172a !important; margin-bottom: 10px !important; }
  .jd-content h3 { font-size: 16px !important; font-weight: 700 !important; color: #0f172a !important; margin-bottom: 8px !important; }
  .jd-content h4 { font-size: 15px !important; font-weight: 600 !important; color: #1e293b !important; margin-bottom: 8px !important; }
  
  /* Bold and italic */
  .jd-content strong, .jd-content b { font-weight: 700 !important; color: inherit; }
  .jd-content em, .jd-content i { font-style: italic !important; }
  .jd-content u { text-decoration: underline !important; }
  .jd-content s { text-decoration: line-through !important; }
  
  /* Lists with bullets */
  .jd-content ul { 
    list-style-type: disc !important; 
    padding-left: 20px !important; 
    margin-bottom: 12px !important;
  }
  .jd-content ol { 
    list-style-type: decimal !important; 
    padding-left: 20px !important; 
    margin-bottom: 12px !important;
  }
  .jd-content li { 
    display: list-item !important; 
    margin-bottom: 6px !important;
    color: #1e293b !important;
    line-height: 1.6 !important;
    overflow-wrap: anywhere;
  }
  
  /* Text alignment */
  .jd-content [style*="text-align: center"], 
  .jd-content .ql-align-center { text-align: center !important; }
  .jd-content [style*="text-align: right"],
  .jd-content .ql-align-right { text-align: right !important; }
  .jd-content [style*="text-align: justify"],
  .jd-content .ql-align-justify { text-align: justify !important; }
  
  /* Font colors from editor — allow inline color styles */
  .jd-content span[style*="color"] { color: inherit; }
  .jd-content *[style*="color:"] { }
  .jd-content *[style*="font-size:"] { }
  .jd-content *[style*="font-weight:"] { }
  
  /* Blockquote */
  .jd-content blockquote { 
    border-left: 4px solid #1E3B8B !important; 
    padding-left: 16px !important; 
    margin: 12px 0 !important;
    color: #475569 !important;
    font-style: italic !important;
  }
  
  /* Links */
  .jd-content a { 
    color: #1E3B8B !important; 
    text-decoration: underline !important;
    word-break: break-all !important;
  }
  
  /* Images */
  .jd-content img { 
    max-width: 100% !important; 
    height: auto !important; 
    border-radius: 4px !important;
  }
  
  /* Tables */
  .jd-content table { 
    max-width: 100% !important; 
    overflow-x: auto !important; 
    display: block !important;
    border-collapse: collapse !important;
  }
  .jd-content td, .jd-content th {
    border: 1px solid #e2e8f0 !important;
    padding: 8px !important;
  }
  
  /* Horizontal rule */
  .jd-content hr { 
    border: none !important; 
    border-top: 1px solid #e2e8f0 !important; 
    margin: 16px 0 !important;
  }

  /* Code */
  .jd-content code {
    background: #f1f5f9 !important;
    padding: 2px 6px !important;
    border-radius: 3px !important;
    font-family: monospace !important;
    font-size: 13px !important;
  }
`}</style>

      {/* Top Bar */}
      <div style={{ backgroundColor: 'white', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <button onClick={() => navigate(-1)} style={{ padding: '6px', backgroundColor: '#f1f5f9', borderRadius: '4px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <ChevronLeft size={20} color="#334155" />
        </button>
        <span style={{ fontWeight: 700, fontSize: '16px', color: '#0f172a' }}>Job Details</span>
        <button onClick={handleShare} style={{ padding: '6px', backgroundColor: '#f1f5f9', borderRadius: '4px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <Share2 size={18} color="#334155" />
        </button>
      </div>

      {/* Hero Card */}
      <div style={{ backgroundColor: 'white', borderRadius: '4px', padding: '20px', margin: '16px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: companyName && companyName !== 'Featured Employer' ? '4px' : '16px', lineHeight: '1.3', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{job.title}</h2>
        {companyName && companyName !== 'Featured Employer' && (
          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>{companyName}</p>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
          <span style={{ backgroundColor: '#f1f5f9', color: '#475569', borderRadius: '4px', padding: '4px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MapPin size={12} /> {locationText}
          </span>
          <span style={{ backgroundColor: '#f1f5f9', color: '#475569', borderRadius: '4px', padding: '4px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Briefcase size={12} /> {jobType}
          </span>
        </div>

        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
          <span style={{ fontSize: '16px', fontWeight: 600, color: '#E8B736' }}>{salaryText}</span>
        </div>
      </div>

      {/* About This Role */}
      <div style={{ backgroundColor: 'white', borderRadius: '4px', padding: '20px', margin: '0 16px 12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', width: 'calc(100% - 32px)', boxSizing: 'border-box', overflow: 'hidden' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>About This Role</h3>
        <div style={{ width: '100%' }}>
          {renderDescriptionWithAds(
            pAny?.description || job?.description || ''
          )}
        </div>
      </div>

      {/* Requirements */}
      {requirements && requirements.length > 0 && (
        <div style={{ backgroundColor: 'white', borderRadius: '4px', padding: '20px', margin: '0 16px 12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', width: 'calc(100% - 32px)', boxSizing: 'border-box' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Requirements</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {Array.isArray(requirements) ? requirements.map((req: string, idx: number) => (
              <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '2px', backgroundColor: '#1E3B8B', marginTop: '7px', flexShrink: 0 }} />
                <span style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6', overflowWrap: 'anywhere' }}>{req}</span>
              </li>
            )) : (
              <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.7', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{requirements}</p>
            )}
          </ul>
        </div>
      )}

      {/* Footer */}
      <div style={{ backgroundColor: 'white', borderRadius: '4px', padding: '24px', margin: '0 16px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', textAlign: 'center', width: 'calc(100% - 32px)', boxSizing: 'border-box' }}>
        <p style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>Hub <span style={{ color: '#E8B736' }}>&</span> Jobs</p>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px', lineHeight: '1.6' }}>Connecting top talent with exciting opportunities across Nigeria and beyond.</p>
      </div>

      <div style={{ margin: '0 16px' }}>
        <AdUnit slot="jobdetail-footer" label="Advertisement" />
      </div>

      {/* Bottom Action Bar */}
      <div style={{ position: 'fixed', bottom: '64px', left: 0, right: 0, backgroundColor: 'white', borderTop: '1px solid #f1f5f9', padding: '12px 16px', display: 'flex', gap: '8px', zIndex: 40, boxShadow: '0 -2px 10px rgba(0,0,0,0.06)' }}>
        {hasWhatsApp && (
          <button
            onClick={() => window.open(`https://wa.me/${String(pAny.whatsappNumber).replace(/\D/g, '')}`, '_blank')}
            style={{ flex: 1, backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '4px', padding: '14px', fontWeight: 600, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <MessageCircle size={16} />
            {whatsappButtonText}
          </button>
        )}

        {hasExternalLink && (
          <button
            onClick={() => window.open(String(pAny.externalLink), '_blank')}
            style={{ flex: 1, backgroundColor: '#1E3B8B', color: 'white', border: 'none', borderRadius: '4px', padding: '14px', fontWeight: 600, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <ExternalLink size={16} />
            {buttonText}
          </button>
        )}

        {!hasWhatsApp && !hasExternalLink && (
          <button
            onClick={handleEasyApply}
            disabled={hasApplied}
            style={{ flex: 1, backgroundColor: hasApplied ? '#e2e8f0' : '#1E3B8B', color: hasApplied ? '#94a3b8' : 'white', border: 'none', borderRadius: '4px', padding: '14px', fontWeight: 600, fontSize: '14px', cursor: hasApplied ? 'not-allowed' : 'pointer' }}
          >
            {hasApplied ? 'Applied ✓' : buttonText}
          </button>
        )}
      </div>
    </div>
  );
};

export default JobDetailPage;
