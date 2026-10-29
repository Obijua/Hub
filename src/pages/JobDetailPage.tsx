import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Share2, MapPin, Briefcase, ExternalLink, MessageCircle, Mail } from 'lucide-react';
import { doc, getDoc, collection, addDoc, serverTimestamp, query, where, getDocs, limit } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Post } from '../types';
import { toast } from 'sonner';
import AdUnit from '../components/AdUnit';
import { useSeo, setJsonLd } from '../lib/seo';
import { incrementViews } from '../lib/posts';

const getTags = (postTags: any): string[] => {
  if (!postTags) return [];
  if (Array.isArray(postTags)) {
    return postTags.map((t: any) => String(t).trim()).filter(Boolean);
  }
  if (typeof postTags === 'string') {
    return postTags.split(',').map((t: string) => t.trim()).filter(Boolean);
  }
  return [];
};

const stripHtml = (html: string): string => {
  if (!html) return '';
  let text = String(html)
    .replace(/<br\s*\/?>|<\/(p|div|li|h[1-6]|ul|ol)>/gi, ' ')
    .replace(/<[^>]*>?/gm, '');

  text = text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&#x([0-9a-fA-F]+);/gi, (_, hex) => {
      try { return String.fromCodePoint(parseInt(hex, 16)); } catch { return ''; }
    })
    .replace(/&#([0-9]+);/gi, (_, dec) => {
      try { return String.fromCodePoint(parseInt(dec, 10)); } catch { return ''; }
    })
    .replace(/&amp;/gi, '&');

  text = text
    .replace(/[\u200B\u200C\u200D\u2060\uFEFF\u00AD]/g, '')
    .replace(/\u00A0/g, ' ');

  text = text.replace(/\s+/g, ' ').trim();
  return text;
};

const buildPageTitle = (title: string, company: string, location: string): string => {
  let T = title ? String(title).trim() : 'Opportunity';
  if (!T) T = 'Opportunity';
  if (T === T.toUpperCase() && /[A-Z]/.test(T)) {
    T = T.toLowerCase().replace(/(^|\s)\S/g, l => l.toUpperCase());
  }

  let L = location ? String(location).trim() : '';
  if (L.toLowerCase() === 'nationwide') {
    L = 'Nigeria';
  }

  const hasComp = Boolean(company && String(company).trim() !== '' && company !== 'Featured Employer');
  const comp = hasComp ? String(company).trim() : '';
  const hasLoc = L !== '';
  const isRemote = L.toLowerCase() === 'remote';

  let fullTitle = '';
  if (hasComp && hasLoc) {
    fullTitle = `${T} at ${comp}, ${L} | Hub & Jobs`;
  } else if (hasLoc) {
    if (isRemote) {
      fullTitle = `${T} (Remote) | Hub & Jobs`;
    } else {
      fullTitle = `${T}, ${L} | Hub & Jobs`;
    }
  } else if (hasComp) {
    fullTitle = `${T} at ${comp} | Hub & Jobs`;
  } else {
    fullTitle = `${T} | Hub & Jobs`;
  }

  if (fullTitle.length > 65) {
    fullTitle = `${T} | Hub & Jobs`;
  }

  if (fullTitle.length > 65) {
    const suffix = ' | Hub & Jobs';
    const availableForT = 65 - suffix.length - 1;
    if (availableForT > 0 && T.length > availableForT) {
      let cut = T.slice(0, availableForT);
      const lastSpace = cut.lastIndexOf(' ');
      if (lastSpace > 0) {
        cut = cut.slice(0, lastSpace);
      }
      T = cut + '…';
    } else {
      T = T.slice(0, Math.max(0, 65 - suffix.length));
    }
    fullTitle = `${T}${suffix}`;
  }

  return fullTitle;
};

const buildPostDescription = (
  rawDesc: string,
  location?: string,
  jobType?: string,
  salary?: string
): string => {
  const factItems: string[] = [];
  const locRaw = location ? String(location).trim() : '';
  if (locRaw) {
    factItems.push(`Location: ${locRaw}`);
  }
  const jtRaw = jobType ? String(jobType).trim() : '';
  if (jtRaw) {
    factItems.push(`Job Type: ${jtRaw}`);
  }
  const salRaw = salary ? String(salary).trim() : '';
  if (salRaw) {
    factItems.push(`Salary: ${salRaw}`);
  }

  const facts = factItems.join(' | ');
  const text = stripHtml(rawDesc || '');

  let description = '';
  if (facts && text) {
    description = `${facts} | ${text}`;
  } else if (facts) {
    description = facts;
  } else if (text) {
    description = text;
  }

  if (description.length > 175) {
    const limit = 175 - 1;
    let cut = description.slice(0, limit);
    const lastSpace = cut.lastIndexOf(' ');
    if (lastSpace > 0) {
      cut = cut.slice(0, lastSpace);
    }
    description = cut + '…';
  }

  return description;
};

export const JobDetailPage = () => {
  const { jobId, slug } = useParams<{ jobId?: string; slug?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const stateJob = (location.state as { job?: Post })?.job;

  const embeddedJob = useMemo(() => {
    if (typeof document === 'undefined') return null;
    try {
      const el = document.getElementById('hj-data');
      if (!el || !el.textContent) return null;
      const data = JSON.parse(el.textContent);
      if (data && data.kind === 'post' && data.post) {
        const matchSlug = Boolean(slug && data.post.slug === slug);
        const matchJobId = Boolean(jobId && data.post.id === jobId);
        if (matchSlug || matchJobId) {
          const wrapDate = (dateVal: any) => {
            if (!dateVal) return null;
            if (typeof dateVal?.toDate === 'function') return dateVal;
            const d = new Date(dateVal);
            const time = isNaN(d.getTime()) ? 0 : d.getTime();
            const seconds = Math.floor(time / 1000);
            const nanoseconds = (time % 1000) * 1000000;
            return {
              seconds,
              nanoseconds,
              toDate: () => d,
              toMillis: () => time
            };
          };
          return {
            ...data.post,
            createdAt: wrapDate(data.post.createdAt),
            updatedAt: wrapDate(data.post.updatedAt)
          } as Post;
        }
      }
    } catch {
      // ignore
    }
    return null;
  }, [slug, jobId]);

  const initialPost = stateJob || embeddedJob;

  const [job, setJob] = useState<Post | null>(initialPost);
  const [loading, setLoading] = useState(!initialPost);
  const [hasApplied, setHasApplied] = useState(false);
  const [adConfig, setAdConfig] = useState<any>(null);

  const seoPath = job?.slug ? `/post/${job.slug}` : (job?.id ? `/jobs/${job.id}` : location.pathname);
  const noindex = job ? !job.slug : false;

  const pAny = job as any;
  const companyName = 
    pAny?.company || 
    pAny?.companyName || 
    pAny?.employer || 
    pAny?.organizationName || 
    pAny?.recruiterCompany || '';

  const locationText = job?.location || '';

  const rawJobType = pAny?.jobType || pAny?.type || '';
  const VALID_TYPES = ['Full-time', 'Part-time', 'Remote', 
    'Internship', 'Contract', 'Freelance'];
  const matchedType = VALID_TYPES.find(t => 
    t.toLowerCase() === rawJobType.toLowerCase()
  );
  const jobType = matchedType || rawJobType || '';

  const pageTitle = useMemo(() => {
    return buildPageTitle(job?.title || '', companyName, locationText);
  }, [job, companyName, locationText]);

  const pageDescription = useMemo(() => {
    return buildPostDescription(job?.description || '', job?.location, jobType, job?.salary) || 'View job details and apply on Hub & Jobs.';
  }, [job, jobType]);

  useSeo({
    title: pageTitle,
    description: pageDescription,
    path: seoPath,
    noindex: noindex
  });

  useEffect(() => {
    if (!pageDescription) return;
    const upsertMeta = (attrName: string, attrValue: string, content: string) => {
      let el = document.querySelector(`meta[${attrName}="${attrValue}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attrName, attrValue);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };
    upsertMeta('name', 'description', pageDescription);
    upsertMeta('property', 'og:description', pageDescription);
    upsertMeta('name', 'twitter:description', pageDescription);
  }, [pageDescription]);

  const jsonLdData = useMemo(() => {
    if (!job) return null;

    const cat = (job.category || '').toLowerCase();
    const isJob = cat === 'job' || cat === 'internship' || (
      cat && 
      !['scholarship', 'free-course', 'udemy-coupon', 'opportunity', 'blog', 'course', 'courses'].includes(cat) &&
      !cat.includes('scholarship') &&
      !cat.includes('course') &&
      !cat.includes('opportunity')
    );

    if (isJob) {
      if (!job.title || !job.description || !job.createdAt || !companyName || String(companyName).trim() === '' || companyName === 'Featured Employer' || !job.location || String(job.location).trim() === '') {
        return null;
      }

      const jobPosting: any = {
        "@context": "https://schema.org",
        "@type": "JobPosting",
        "directApply": false
      };

      if (job.title) jobPosting.title = job.title;
      if (job.description) jobPosting.description = job.description;

      const datePosted = job.createdAt?.toDate ? job.createdAt.toDate().toISOString() : (job.createdAt ? new Date(job.createdAt).toISOString() : null);
      if (datePosted) jobPosting.datePosted = datePosted;

      if (pAny.jobType) {
        const jt = pAny.jobType.toUpperCase().replace(/[- ]/g, '_');
        if (['FULL_TIME', 'PART_TIME', 'CONTRACTOR', 'INTERN', 'TEMPORARY'].includes(jt)) {
          jobPosting.employmentType = jt;
        }
      }

      jobPosting.hiringOrganization = {
        "@type": "Organization",
        "name": companyName
      };

      jobPosting.jobLocation = {
        "@type": "Place",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": job.location,
          "addressCountry": "NG"
        }
      };

      if (job.salary && /\d/.test(job.salary) && !job.salary.toLowerCase().includes('competitive')) {
        jobPosting.baseSalary = {
          "@type": "MonetaryAmount",
          "currency": "NGN",
          "value": job.salary
        };
      }

      const validThrough = job.deadline?.toDate ? job.deadline.toDate().toISOString() : (job.deadline ? new Date(job.deadline).toISOString() : null);
      if (validThrough) {
        jobPosting.validThrough = validThrough;
      }

      const isRemote = pAny.isRemote || (job.location && job.location.toLowerCase().includes('remote')) || job.tags?.some((t: string) => t.toLowerCase() === 'remote');
      if (isRemote) {
        jobPosting.jobLocationType = "TELECOMMUTE";
        jobPosting.applicantLocationRequirements = {
          "@type": "Country",
          "name": "Nigeria"
        };
      }

      return jobPosting;
    } else {
      const article: any = {
        "@context": "https://schema.org",
        "@type": "Article"
      };

      if (job.title) article.headline = job.title;
      if (job.description) article.description = job.description;
      if (job.thumbnail) article.image = job.thumbnail;

      const datePublished = job.createdAt?.toDate ? job.createdAt.toDate().toISOString() : (job.createdAt ? new Date(job.createdAt).toISOString() : null);
      if (datePublished) article.datePublished = datePublished;

      const dateModified = pAny.updatedAt?.toDate ? pAny.updatedAt.toDate().toISOString() : (pAny.updatedAt ? new Date(pAny.updatedAt).toISOString() : null);
      if (dateModified) article.dateModified = dateModified;

      article.publisher = {
        "@type": "Organization",
        "name": "Hub & Jobs",
        "logo": {
          "@type": "ImageObject",
          "url": "https://www.hubandjobs.com/logo.png"
        }
      };

      return article;
    }
  }, [job, companyName]);

  setJsonLd(job?.id ? `post-jsonld-${job.id}` : 'post-jsonld-placeholder', jsonLdData);

  useEffect(() => {
    const fetchJob = async () => {
      if (stateJob) return;
      try {
        if (!initialPost) {
          setJob(null);
          setLoading(true);
        }
        if (slug) {
          const q = query(collection(db, 'posts'), where('slug', '==', slug), limit(1));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const docSnap = querySnapshot.docs[0];
            const data = { id: docSnap.id, ...docSnap.data() } as Post;
            setJob(data);
            incrementViews(data.id);
          } else {
            if (!initialPost) {
              toast.error('Post not found');
            }
          }
        } else if (jobId) {
          const docRef = doc(db, 'posts', jobId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setJob({ id: docSnap.id, ...docSnap.data() } as Post);
          } else {
            if (!initialPost) {
              toast.error('Job not found');
            }
          }
        }
      } catch (e) {
        console.error(e);
        if (!initialPost) {
          toast.error('Failed to load job details');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [jobId, slug, stateJob, initialPost]);

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

  const actionButtons = useMemo(() => {
    if (!job) return [];
    const p = job as any;
    const list: Array<{
      type: 'link' | 'whatsapp' | 'email';
      url: string;
      label: string;
      bgColor: string;
      icon: any;
      isMailto?: boolean;
    }> = [];

    // 1. Link action
    const rawExternalLink = typeof p.externalLink === 'string' ? p.externalLink.trim() : '';
    const isLinkEmail = rawExternalLink.includes('@') && !/^https?:\/\//i.test(rawExternalLink);
    if (rawExternalLink && !isLinkEmail) {
      let linkUrl = rawExternalLink;
      if (!/^https?:\/\//i.test(linkUrl)) {
        linkUrl = 'https://' + linkUrl;
      }
      const linkLabel = (p.externalLinkText || p.ctaText)?.trim() || 'Apply Now';
      list.push({
        type: 'link',
        url: linkUrl,
        label: linkLabel,
        bgColor: '#1E3B8B',
        icon: ExternalLink
      });
    }

    // 2. WhatsApp action
    const rawWa = typeof p.whatsappNumber === 'string' ? p.whatsappNumber.trim() : (p.whatsappNumber ? String(p.whatsappNumber).trim() : '');
    let waDigits = rawWa.replace(/\D/g, '');
    if (waDigits.length === 11 && waDigits.startsWith('0')) {
      waDigits = '234' + waDigits.slice(1);
    }
    if (waDigits.length > 0) {
      const waUrl = `https://wa.me/${waDigits}`;
      const waLabel = p.whatsappButtonText?.trim() || 'Send CV on WhatsApp';
      list.push({
        type: 'whatsapp',
        url: waUrl,
        label: waLabel,
        bgColor: '#25D366',
        icon: MessageCircle
      });
    }

    // 3. Email action
    let emailAddr = '';
    if (typeof p.applicationEmail === 'string' && p.applicationEmail.includes('@')) {
      emailAddr = p.applicationEmail.trim();
    } else if (typeof p.email === 'string' && p.email.includes('@')) {
      emailAddr = p.email.trim();
    } else if (isLinkEmail) {
      emailAddr = rawExternalLink;
    }

    if (emailAddr) {
      const cleanEmail = emailAddr.replace(/^mailto:/i, '').trim();
      if (cleanEmail) {
        const subject = encodeURIComponent(job.title || 'Job Application');
        const mailtoUrl = `mailto:${cleanEmail}?subject=${subject}`;
        const emailLabel = p.emailButtonText?.trim() || 'Send On Email';
        list.push({
          type: 'email',
          url: mailtoUrl,
          label: emailLabel,
          bgColor: '#1E3B8B',
          icon: Mail,
          isMailto: true
        });
      }
    }

    return list;
  }, [job]);

  const displayLocation = job?.location || 'Nigeria';
  const salaryText = job?.salary || 'Competitive';
  const requirements = pAny?.requirements || [];

  const handleShare = () => {
    const postUrl = job?.slug ? `https://www.hubandjobs.com/post/${job.slug}` : `https://www.hubandjobs.com/jobs/${job?.id || jobId || ''}`;
    const text = encodeURIComponent(`Check out this job: ${job?.title || 'Job Opening'} at ${companyName || 'Hub & Jobs'}. View on Hub & Jobs: ${postUrl}`);
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

    if (!adConfig) {
      return (
        <div
          className="jd-content"
          style={{ fontSize: '14px', color: '#1e293b', lineHeight: '1.7', width: '100%', overflowWrap: 'anywhere', wordBreak: 'break-word' }}
          dangerouslySetInnerHTML={{ __html: cleanHtml(html) }}
        />
      );
    }

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

    const frequency = Number(adConfig.articleAdFrequency) || 3;
    const maxAds = Number(adConfig.articleMaxAds) || 2;

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
    <div style={{ minHeight: '100vh', backgroundColor: '#EEF2FF', overflowX: 'hidden', width: '100%', paddingBottom: '20px' }}>

      <style>{`
  * { box-sizing: border-box; }
  
  .jd-content { 
    width: 100%; 
    color: #1e293b;
    font-size: 14px;
    line-height: 1.7;
  }
  
  .jd-content [style] { all: revert; }
  
  .jd-content p { 
    margin-bottom: 12px; 
    overflow-wrap: anywhere;
    word-break: break-word;
    color: #1e293b;
  }
  .jd-content p:empty { display: none; }
  
  .jd-content h1 { font-size: 22px !important; font-weight: 800 !important; color: #0f172a !important; margin-bottom: 12px !important; }
  .jd-content h2 { font-size: 18px !important; font-weight: 700 !important; color: #0f172a !important; margin-bottom: 10px !important; }
  .jd-content h3 { font-size: 16px !important; font-weight: 700 !important; color: #0f172a !important; margin-bottom: 8px !important; }
  .jd-content h4 { font-size: 15px !important; font-weight: 600 !important; color: #1e293b !important; margin-bottom: 8px !important; }
  
  .jd-content strong, .jd-content b { font-weight: 700 !important; color: inherit; }
  .jd-content em, .jd-content i { font-style: italic !important; }
  .jd-content u { text-decoration: underline !important; }
  .jd-content s { text-decoration: line-through !important; }
  
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
  
  .jd-content [style*="text-align: center"], 
  .jd-content .ql-align-center { text-align: center !important; }
  .jd-content [style*="text-align: right"],
  .jd-content .ql-align-right { text-align: right !important; }
  .jd-content [style*="text-align: justify"],
  .jd-content .ql-align-justify { text-align: justify !important; }
  
  .jd-content span[style*="color"] { color: inherit; }
  .jd-content *[style*="color:"] { }
  .jd-content *[style*="font-size:"] { }
  .jd-content *[style*="font-weight:"] { }
  
  .jd-content blockquote { 
    border-left: 4px solid #1E3B8B !important; 
    padding-left: 16px !important; 
    margin: 12px 0 !important;
    color: #475569 !important;
    font-style: italic !important;
  }
  
  .jd-content a { 
    color: #1E3B8B !important; 
    text-decoration: underline !important;
    word-break: break-all !important;
  }
  
  .jd-content img { 
    max-width: 100% !important; 
    height: auto !important; 
    border-radius: 4px !important;
  }
  
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
  
  .jd-content hr { 
    border: none !important; 
    border-top: 1px solid #e2e8f0 !important; 
    margin: 16px 0 !important;
  }

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

        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px', marginBottom: getTags(pAny?.tags || job?.tags).length > 0 ? '8px' : '16px' }}>
          <span style={{ backgroundColor: '#f1f5f9', color: '#475569', borderRadius: '4px', padding: '4px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MapPin size={12} /> {displayLocation}
          </span>
          {jobType && (
            <span style={{ backgroundColor: '#f1f5f9', color: '#475569', borderRadius: '4px', padding: '4px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Briefcase size={12} /> {jobType}
            </span>
          )}
        </div>

        {getTags(pAny?.tags || job?.tags).length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px', marginBottom: '16px' }}>
            {getTags(pAny?.tags || job?.tags).map((tag, idx) => (
              <span key={idx} style={{ backgroundColor: '#f1f5f9', color: '#475569', borderRadius: '9999px', padding: '3px 10px', fontSize: '11px', fontWeight: 500 }}>
                {tag}
              </span>
            ))}
          </div>
        )}

        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
          <span style={{ fontSize: '16px', fontWeight: 600, color: '#E8B736' }}>{salaryText}</span>
        </div>
      </div>

      {/* Post Content */}
      <div style={{ backgroundColor: 'white', borderRadius: '4px', padding: '20px', margin: '0 16px 12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', width: 'calc(100% - 32px)', boxSizing: 'border-box', overflow: 'hidden' }}>
        <div style={{ width: '100%' }}>
          {renderDescriptionWithAds(
            pAny?.description || job?.description || ''
          )}
        </div>
      </div>

      {/* Action Buttons: Rendered directly after description in page flow before About card */}
      {actionButtons.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', margin: '16px 0', padding: '0 16px', boxSizing: 'border-box' }}>
          {actionButtons.map((btn, idx) => (
            <a
              key={idx}
              href={btn.url}
              target={btn.isMailto ? undefined : '_blank'}
              rel={btn.isMailto ? undefined : 'noopener noreferrer'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                minHeight: '44px',
                padding: '10px 20px',
                fontSize: '15px',
                fontWeight: 600,
                borderRadius: '2px',
                width: 'auto',
                minWidth: '160px',
                maxWidth: '100%',
                backgroundColor: btn.bgColor,
                color: '#ffffff',
                textDecoration: 'none',
                boxSizing: 'border-box'
              }}
            >
              <btn.icon size={18} />
              <span>{btn.label}</span>
            </a>
          ))}
        </div>
      )}

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

      {/* Footer / About Card */}
      <div style={{ backgroundColor: 'white', borderRadius: '4px', padding: '24px', margin: '0 16px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', textAlign: 'center', width: 'calc(100% - 32px)', boxSizing: 'border-box' }}>
        <p style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>Hub <span style={{ color: '#E8B736' }}>&</span> Jobs</p>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px', lineHeight: '1.6' }}>Connecting top talent with exciting opportunities across Nigeria and beyond.</p>
      </div>

      <div style={{ margin: '0 16px' }}>
        <AdUnit slot="jobdetail-footer" label="Advertisement" />
      </div>
    </div>
  );
};

export default JobDetailPage;
