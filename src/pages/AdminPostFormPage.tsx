import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  Image as ImageIcon, 
  X, 
  Calendar, 
  Link as LinkIcon, 
  Tag, 
  CheckCircle2, 
  Star,
  AlertCircle,
  Upload,
  Briefcase,
  Search as SearchIcon,
  Globe,
  Eye,
  MapPin,
  ChevronDown,
  Plus,
  MousePointerClick
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { RichTextEditor } from '../components/RichTextEditor';
import DOMPurify from 'dompurify';
import { db, storage, auth } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  doc, 
  getDoc, 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  addDoc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { createPost, updatePost } from '../lib/posts';
import { Post, Category, CategoryConfig } from '../types';
import { cn, generateSlug, stripHtml } from '../lib/utils';
import { toast } from 'sonner';
import { sendTelegramPostWithPhoto } from '../lib/telegram';
import { sendNewPostAlert } from '../lib/email';
import { SocialLinks } from '../types';
import { MessageCircle, Send, Copy, Share2 } from 'lucide-react';

import { format } from 'date-fns';
import { useSeo } from '../lib/seo';

export const AdminPostFormPage = () => {
  useSeo({
    title: 'Post Editor | Hub & Jobs',
    description: 'Create or edit post content.',
    path: location.pathname,
    noindex: true
  });
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  
  const [loading, setLoading] = useState(isEdit);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [ogImageFile, setOgImageFile] = useState<File | null>(null);
  const [ogImagePreview, setOgImagePreview] = useState('');
  const [manualThumbnailUrl, setManualThumbnailUrl] = useState('');
  const [showManualUrl, setShowManualUrl] = useState(false);
  const [categories, setCategories] = useState<CategoryConfig[]>([]);
  const [showDraftPrompt, setShowDraftPrompt] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [publishedPost, setPublishedPost] = useState<any>(null);
  const [existingSlug, setExistingSlug] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    category: 'job' as Category,
    description: '',
    externalLink: '',
    deadline: '',
    tags: '',
    isFeatured: false,
    isActive: true,
    // SEO Fields
    seoTitle: '',
    metaDescription: '',
    focusKeyword: '',
    ogImage: '',
    location: '',
    salary: '',
    ctaText: '',
    ctaColor: '#1E3B8B',
    whatsappNumber: '',
    whatsappButtonText: 'Send CV on WhatsApp',
    externalLinkText: '',
  });

  const [wordCount, setWordCount] = useState(0);
  const [keywordDensity, setKeywordDensity] = useState(0);
  const [activeTab, setActiveTab] = useState<'content' | 'seo'>('content');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const ogImageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCategories();
    if (isEdit) {
      fetchPost();
    } else {
      // Check for draft
      const savedDraft = localStorage.getItem('post_draft');
      if (savedDraft) {
        setShowDraftPrompt(true);
      }
    }
  }, [id]);

  // Auto-save logic
  useEffect(() => {
    if (isEdit || !formData.title && !formData.description) return;

    const timer = setInterval(() => {
      localStorage.setItem('post_draft', JSON.stringify({
        ...formData,
        timestamp: new Date().toISOString()
      }));
      setLastAutoSave(new Date());
      setTimeout(() => setLastAutoSave(null), 3000);
    }, 30000);

    return () => clearInterval(timer);
  }, [formData, isEdit]);

  const restoreDraft = () => {
    const savedDraft = localStorage.getItem('post_draft');
    if (savedDraft) {
      const data = JSON.parse(savedDraft);
      setFormData({
        title: data.title || '',
        category: data.category || 'job',
        description: data.description || '',
        externalLink: data.externalLink || '',
        deadline: data.deadline || '',
        tags: data.tags || '',
        isFeatured: data.isFeatured || false,
        isActive: data.isActive ?? true,
        seoTitle: data.seoTitle || '',
        metaDescription: data.metaDescription || '',
        focusKeyword: data.focusKeyword || '',
        ogImage: data.ogImage || '',
        location: data.location || '',
        salary: data.salary || '',
        ctaText: data.ctaText || '',
        ctaColor: data.ctaColor || '#1E3B8B',
        whatsappNumber: data.whatsappNumber || '',
        whatsappButtonText: data.whatsappButtonText || 'Send CV on WhatsApp',
        externalLinkText: data.externalLinkText || '',
      });
    }
    setShowDraftPrompt(false);
  };

  const discardDraft = () => {
    localStorage.removeItem('post_draft');
    setShowDraftPrompt(false);
  };

  useEffect(() => {
    const text = stripHtml(formData.description);
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    setWordCount(words);

    if (formData.focusKeyword) {
      const regex = new RegExp(formData.focusKeyword, 'gi');
      const matches = text.match(regex);
      const count = matches ? matches.length : 0;
      const density = words > 0 ? (count / words) * 100 : 0;
      setKeywordDensity(density);
    } else {
      setKeywordDensity(0);
    }
  }, [formData.description, formData.focusKeyword]);

  const fetchCategories = async () => {
    try {
      const q = query(collection(db, 'categories'), orderBy('displayOrder', 'asc'));
      const snap = await getDocs(q);
      setCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as CategoryConfig)));
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchPost = async () => {
    try {
      const docRef = doc(db, 'posts', id!);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as Post;
        setFormData({
          title: data.title,
          category: data.category,
          description: data.description,
          externalLink: data.externalLink,
          deadline: data.deadline ? data.deadline.toDate().toISOString().split('T')[0] : '',
          tags: data.tags.join(', '),
          isFeatured: data.isFeatured,
          isActive: data.isActive,
          seoTitle: data.seoTitle || '',
          metaDescription: data.metaDescription || '',
          focusKeyword: data.focusKeyword || '',
          ogImage: data.ogImage || '',
          location: data.location || '',
          salary: data.salary || '',
          ctaText: data.ctaText || '',
          ctaColor: data.ctaColor || '#1E3B8B',
          whatsappNumber: data.whatsappNumber || '',
          whatsappButtonText: data.whatsappButtonText || 'Send CV on WhatsApp',
          externalLinkText: data.externalLinkText || '',
        });
        setThumbnailPreview(data.thumbnail);
        setExistingSlug(data.slug || '');
        setOgImagePreview(data.ogImage || '');
        if (data.thumbnail && !data.thumbnail.startsWith('data:')) {
          setManualThumbnailUrl(data.thumbnail);
        }
      } else {
        setError('Post not found');
      }
    } catch (err) {
      console.error('Error fetching post:', err);
      setError('Failed to load post data');
    } finally {
      setLoading(false);
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOgImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setOgImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setOgImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadThumbnail = async (file: File): Promise<string> => {
    const storageRef = ref(storage, `thumbnails/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  };

  const uploadOgImage = async (file: File): Promise<string> => {
    const storageRef = ref(storage, `og-images/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  };

  // Save all subscriber tokens first
  const sendPushNotifications = async (post: any) => {
    try {
      const snap = await getDocs(
        collection(db, 'push_subscribers')
      );
      const tokens = snap.docs.map(d => d.data().token);
      if (tokens.length === 0) return;

      // Save notification job to Firestore
      // A Cloud Function or admin script picks this up
      await addDoc(collection(db, 'notification_queue'), {
        tokens,
        notification: {
          title: `New ${post.category}: ${post.title}`,
          body: post.description
            ? post.description
                .replace(/<[^>]*>/g, '')
                .slice(0, 100) + '...'
            : 'Tap to view and apply',
          image: post.thumbnail || '',
        },
        data: {
          url: `${window.location.origin}/post/${post.slug}`,
          postId: post.id || '',
        },
        sentAt: serverTimestamp(),
        status: 'pending'
      });
    } catch (err) {
      console.error('Push notification queue error:', err);
    }
  };

  const handlePublish = async () => {
    console.log("Step 1: handlePublish started");
    setIsLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error("Session expired. Please log in again.");
        navigate("/admin/login");
        return;
      }
      console.log("Step 2: Auth verified", auth.currentUser?.email);

      // NEVER put base64 into postData — Firestore has 1MB limit
      // Always use empty string as default thumbnail
      let finalThumbnailURL = "";

      // Use manual URL if provided
      if (manualThumbnailUrl?.trim()) {
        finalThumbnailURL = manualThumbnailUrl?.trim();
      }

      // Upload file if selected — wrap in its own try/catch
      // so a storage failure shows a clear error immediately
      if (thumbnailFile) {
        try {
          toast.loading("Uploading thumbnail...");
          const storageRef = ref(
            storage, 
            `thumbnails/${Date.now()}_${thumbnailFile.name}`
          );
          const snap = await uploadBytes(storageRef, thumbnailFile);
          finalThumbnailURL = await getDownloadURL(snap.ref);
          toast.dismiss();
        } catch (uploadError: any) {
          toast.dismiss();
          toast.error(
            "Thumbnail upload failed: " + (uploadError?.message || 
            "Check Firebase Storage rules")
          );
          setIsLoading(false);
          return; // stop here — don't save post with broken image
        }
      }

      // Handle OG Image upload if separate from thumbnail
      let finalOgImageURL = formData.ogImage || finalThumbnailURL;
      if (ogImageFile) {
        try {
          toast.loading("Uploading OG image...");
          const storageRef = ref(
            storage, 
            `og-images/${Date.now()}_${ogImageFile.name}`
          );
          const snap = await uploadBytes(storageRef, ogImageFile);
          finalOgImageURL = await getDownloadURL(snap.ref);
          toast.dismiss();
        } catch (uploadError: any) {
          toast.dismiss();
          toast.error(
            "OG Image upload failed: " + (uploadError?.message || 
            "Check Firebase Storage rules")
          );
          setIsLoading(false);
          return;
        }
      }
      console.log("Step 3: Thumbnail URL:", finalThumbnailURL);
      console.log("Step 3b: OG Image URL:", finalOgImageURL);

      // Now build postData using finalThumbnailURL only
      // Never use thumbnailPreview (base64) in postData
      const finalSlug = (isEdit && existingSlug && existingSlug.trim() !== '')
        ? existingSlug
        : generateSlug(formData.title?.trim() || "post");

      const postData: any = {
        title: formData.title?.trim() || "Untitled Post",
        slug: finalSlug,
        category: formData.category || "opportunity",
        description: formData.description || "",
        thumbnail: finalThumbnailURL,
        externalLink: formData.externalLink?.trim() || "",
        deadline: formData.deadline ? new Date(formData.deadline) : null,
        tags: formData.tags 
          ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) 
          : [],
        isFeatured: Boolean(formData.isFeatured),
        isActive: true,
        views: 0,
        seoTitle: formData.seoTitle || formData.title || "",
        metaDescription: formData.metaDescription || "",
        focusKeyword: formData.focusKeyword || "",
        ogImage: finalOgImageURL,
        location: formData.location || "",
        salary: formData.salary || "",
        ctaText: formData.ctaText || "",
        ctaColor: formData.ctaColor || "#1E3B8B",
        whatsappNumber: formData.whatsappNumber?.trim() || "",
        whatsappButtonText: formData.whatsappButtonText?.trim() || "Send CV on WhatsApp",
        externalLinkText: formData.externalLinkText?.trim() || "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      console.log("Step 4: postData ready", postData);

      if (isEdit) {
        // Build update object WITHOUT createdAt
        const { createdAt, ...updateData } = postData;
        const docRef = doc(db, "posts", id!);
        await updateDoc(docRef, {
          ...updateData,
          updatedAt: serverTimestamp(),
        });
        toast.success("Post updated! ✅");
      } else {
        const docRef = await addDoc(
          collection(db, "posts"), 
          postData
        );
        console.log("Published ID:", docRef.id);
        localStorage.removeItem('post_draft');
        toast.success("Post published! ✅");

        // Email all subscribers
        try {
          const snap = await getDocs(collection(db, 'subscribers'));
          const emails = snap.docs
            .map(d => d.data().email)
            .filter(Boolean);

          if (emails.length > 0) {
            await sendNewPostAlert({ emails, post: postData });
            toast.success(`📧 Emailed ${emails.length} subscribers!`);
          }
        } catch (emailErr) {
          console.error('Email blast error:', emailErr);
          // Never block publish if email fails
        }

        // Telegram Auto-Post Logic
        try {
          const socialSnap = await getDoc(doc(db, 'settings', 'socialLinks'));
          if (socialSnap.exists()) {
            const social = socialSnap.data() as SocialLinks;
            if (social.telegramBot?.isAutoPostEnabled && social.telegramBot?.botToken && social.telegramBot?.channelId) {
              const postWithId = { ...postData, id: docRef.id };
              // Non-blocking call
              sendTelegramPostWithPhoto({
                botToken: social.telegramBot.botToken,
                channelId: social.telegramBot.channelId,
                post: postWithId,
                template: social.telegramBot.messageTemplate || '',
                siteUrl: window.location.origin
              }).catch(err => {
                console.error('Telegram auto-post failed:', err);
              });
            }
          }
        } catch (err) {
          console.error('Error fetching Telegram settings:', err);
        }

        // Show Share Modal
        setPublishedPost({ ...postData, id: docRef.id });
        setShowShareModal(true);

        // Push Notifications
        sendPushNotifications({ ...postData, id: docRef.id }).catch(err => {
          console.error('Push notification failed:', err);
        });

        return; // Don't navigate yet
      }
      console.log("Step 5: Firestore write complete");

      navigate("/admin/posts");

    } catch (error: any) {
      console.error("Publish error:", error);
      toast.error("Failed: " + (error?.message || "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 space-y-6 md:space-y-0">
        <div className="flex items-center space-x-4">
          <Link to="/admin/posts" className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-primary hover:border-primary transition-all">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              {isEdit ? 'Edit Opportunity' : 'Create New Opportunity'}
            </h1>
            <p className="text-gray-500 font-medium">
              {isEdit ? `Editing: ${formData.title}` : 'Fill in the details below to post a new opportunity'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={async () => {
                const user = auth.currentUser;
                toast.info("Auth user: " + (user ? user.email : "NOT LOGGED IN"));
                
                if (!user) {
                  toast.error("You must be logged in to test Firebase write.");
                  return;
                }

                try {
                  const docRef = await addDoc(collection(db, "test_posts"), {
                    test: true,
                    time: serverTimestamp(),
                    userEmail: user.email,
                    userId: user.uid
                  });
                  toast.success("✅ Firebase OK! ID: " + docRef.id);
                  console.log("Firebase Test Write Success:", docRef.id);
                } catch (e: any) {
                  toast.error("❌ Firebase Error: " + e.message);
                  console.error("Firebase Test Write Error:", e);
                }
              }}
              className="px-4 py-2 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-all shadow-lg text-xs"
            >
              Test Firebase Write
            </button>
            <button
              type="button"
              onClick={handlePublish}
              disabled={isLoading}
              className="w-full py-4 rounded-xl font-bold text-white 
                text-lg bg-blue-700 hover:bg-blue-800 
                disabled:bg-gray-400 disabled:cursor-not-allowed
                transition-all active:scale-95"
            >
              {isLoading ? "Publishing..." : (isEdit ? "Update Post" : "Publish Post")}
            </button>
          </div>
        </div>
      </div>

      {showDraftPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-900 p-8 rounded-3xl max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-800"
          >
            <div className="flex items-center space-x-4 mb-6">
              <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Unsaved Draft Found</h3>
            </div>
            <p className="text-gray-500 dark:text-gray-400 mb-8 font-medium leading-relaxed">
              We found an unsaved draft from your last session. Would you like to restore it or start fresh?
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={restoreDraft}
                className="flex-grow px-6 py-4 bg-primary text-white font-black rounded-2xl hover:bg-blue-900 transition-all shadow-lg shadow-primary/20"
              >
                Restore Draft
              </button>
              <button
                onClick={discardDraft}
                className="flex-grow px-6 py-4 bg-gray-100 text-gray-500 font-black rounded-2xl hover:bg-gray-200 transition-all"
              >
                Discard
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 text-red-600 p-6 rounded-3xl text-sm mb-12 border border-red-100 flex items-center"
        >
          <AlertCircle className="h-6 w-6 mr-4 flex-shrink-0" />
          {error}
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 mb-8 bg-gray-100 p-1.5 rounded-2xl w-full sm:w-fit overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('content')}
          className={cn(
            "px-6 py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap",
            activeTab === 'content' ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700"
          )}
        >
          Content
        </button>
        <button
          onClick={() => setActiveTab('seo')}
          className={cn(
            "px-6 py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap",
            activeTab === 'seo' ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700"
          )}
        >
          SEO Optimization
        </button>
      </div>

      <div className="space-y-8">
        <AnimatePresence mode="wait">
          {activeTab === 'content' ? (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Title & Category */}
                <div className="bg-white p-4 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Opportunity Title</label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. Senior Software Engineer at Google"
                      className={cn(
                        "w-full px-4 sm:px-6 py-4 bg-gray-50 border rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all font-bold text-gray-900",
                        validationErrors.title ? "border-red-500 focus:ring-red-500" : "border-gray-100"
                      )}
                    />
                    {validationErrors.title && (
                      <p className="mt-2 text-xs font-bold text-red-500 ml-1">{validationErrors.title}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Category</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, category: cat.slug as Category })}
                          className={cn(
                            "px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                            formData.category === cat.slug
                              ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                              : validationErrors.category 
                                ? "bg-white text-red-400 border-red-200 hover:border-red-500"
                                : "bg-white text-gray-400 border-gray-100 hover:border-primary hover:text-primary"
                          )}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                    {validationErrors.category && (
                      <p className="mt-2 text-xs font-bold text-red-500 ml-1">{validationErrors.category}</p>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="bg-white p-4 sm:p-8 rounded-3xl border border-gray-100 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Description & Details</label>
                    <div className="flex items-center space-x-4">
                      <div className={cn(
                        "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                        wordCount < 300 ? "bg-red-100 text-red-600" : 
                        wordCount < 600 ? "bg-amber-100 text-amber-600" : 
                        "bg-green-100 text-green-600"
                      )}>
                        {wordCount} Words
                      </div>
                      <AnimatePresence>
                        {lastAutoSave && (
                          <motion.span 
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            className="text-[10px] font-bold text-green-600 uppercase tracking-widest flex items-center"
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Draft auto-saved
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  <div className={cn(
                    "rounded-2xl overflow-hidden border transition-all",
                    validationErrors.description ? "border-red-500" : "border-transparent"
                  )}>
                    <RichTextEditor
                      value={formData.description}
                      onChange={(val) => setFormData(prev => ({ ...prev, description: val }))}
                      placeholder="Write your post content here..."
                    />
                  </div>
                  {validationErrors.description && (
                    <p className="mt-2 text-xs font-bold text-red-500 ml-1">{validationErrors.description}</p>
                  )}
                </div>

                {/* External Link & Tags */}
                <div className="bg-white p-4 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">External Application Link</label>
                    <div className="relative">
                      <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="url"
                        required
                        value={formData.externalLink}
                        onChange={(e) => setFormData({ ...formData, externalLink: e.target.value })}
                        placeholder="https://example.com/apply"
                        className={cn(
                          "w-full pl-12 pr-4 py-4 bg-gray-50 border rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all font-bold text-gray-900",
                          validationErrors.externalLink ? "border-red-500 focus:ring-red-500" : "border-gray-100"
                        )}
                      />
                    </div>
                    {validationErrors.externalLink && (
                      <p className="mt-2 text-xs font-bold text-red-500 ml-1">{validationErrors.externalLink}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Location (State in Nigeria)</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <select
                        value={formData.location || ''}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all font-bold text-gray-900 appearance-none"
                      >
                        <option value="">Select Location</option>
                        <option value="Remote">Remote (Work from Home)</option>
                        <option value="Nationwide">Nationwide (Multiple Locations)</option>
                        <option value="International">International (Outside Nigeria)</option>
                        <optgroup label="Nigerian States">
                          <option value="Abia">Abia</option>
                          <option value="Adamawa">Adamawa</option>
                          <option value="Akwa Ibom">Akwa Ibom</option>
                          <option value="Anambra">Anambra</option>
                          <option value="Bauchi">Bauchi</option>
                          <option value="Bayelsa">Bayelsa</option>
                          <option value="Benue">Benue</option>
                          <option value="Borno">Borno</option>
                          <option value="Cross River">Cross River</option>
                          <option value="Delta">Delta</option>
                          <option value="Ebonyi">Ebonyi</option>
                          <option value="Edo">Edo</option>
                          <option value="Ekiti">Ekiti</option>
                          <option value="Enugu">Enugu</option>
                          <option value="FCT - Abuja">FCT - Abuja</option>
                          <option value="Gombe">Gombe</option>
                          <option value="Imo">Imo</option>
                          <option value="Jigawa">Jigawa</option>
                          <option value="Kaduna">Kaduna</option>
                          <option value="Kano">Kano</option>
                          <option value="Katsina">Katsina</option>
                          <option value="Kebbi">Kebbi</option>
                          <option value="Kogi">Kogi</option>
                          <option value="Kwara">Kwara</option>
                          <option value="Lagos">Lagos</option>
                          <option value="Nasarawa">Nasarawa</option>
                          <option value="Niger">Niger</option>
                          <option value="Ogun">Ogun</option>
                          <option value="Ondo">Ondo</option>
                          <option value="Osun">Osun</option>
                          <option value="Oyo">Oyo</option>
                          <option value="Plateau">Plateau</option>
                          <option value="Rivers">Rivers</option>
                          <option value="Sokoto">Sokoto</option>
                          <option value="Taraba">Taraba</option>
                          <option value="Yobe">Yobe</option>
                          <option value="Zamfara">Zamfara</option>
                        </optgroup>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Salary Range (e.g. ₦150k - ₦300k)</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">₦</div>
                      <input
                        type="text"
                        value={formData.salary}
                        onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                        placeholder="e.g. 200,000 - 350,000"
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all font-bold text-gray-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Tags (comma separated)</label>
                    <div className="relative">
                      <Tag className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.tags}
                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                        placeholder="remote, full-time, tech, google"
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all font-bold text-gray-900"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-8">
                {/* Thumbnail Upload */}
                <div className="bg-white p-4 sm:p-8 rounded-3xl border border-gray-100 shadow-sm">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-4 ml-1">Thumbnail Image</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "relative aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all overflow-hidden",
                      thumbnailPreview && "border-none",
                      "border-gray-100"
                    )}
                  >
                    {thumbnailPreview ? (
                      <>
                        <img src={thumbnailPreview} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-all">
                          <div className="flex space-x-4">
                            <Upload className="h-8 w-8 text-white" />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setThumbnailFile(null);
                                setThumbnailPreview('');
                                setManualThumbnailUrl('');
                              }}
                              className="p-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all"
                            >
                              <X className="h-6 w-6" />
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="h-10 w-10 mb-2 text-gray-300" />
                        <p className="text-xs font-bold text-gray-400">
                          Click to upload image (Optional)
                        </p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleThumbnailChange}
                    accept="image/*"
                    className="hidden"
                  />
                  
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => setShowManualUrl(!showManualUrl)}
                      className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                    >
                      {showManualUrl ? 'Hide URL Option' : 'Or provide image URL'}
                    </button>
                    
                    {showManualUrl && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-3"
                      >
                        <input
                          type="url"
                          value={manualThumbnailUrl}
                          onChange={(e) => {
                            setManualThumbnailUrl(e.target.value);
                            if (!thumbnailFile) setThumbnailPreview(e.target.value);
                          }}
                          placeholder="https://example.com/image.jpg"
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all text-xs font-bold text-gray-900"
                        />
                      </motion.div>
                    )}
                  </div>

                  <p className="mt-4 text-[10px] text-gray-400 font-medium leading-relaxed">
                    Recommended size: 1200x630px. <br />
                    Supported formats: JPG, PNG, WEBP.
                  </p>
                </div>

                {/* Settings */}
                <div className="bg-white p-4 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Deadline (Optional)</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="date"
                        value={formData.deadline}
                        onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all font-bold text-gray-900"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-50">
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">WhatsApp Number (Optional)</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">WA</div>
                      <input
                        type="text"
                        value={formData.whatsappNumber}
                        onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                        placeholder="e.g. 2348012345678"
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all font-bold text-gray-900"
                      />
                    </div>
                    {formData.whatsappNumber && (
                      <div className="mt-4">
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">WhatsApp Button Text</label>
                        <input
                          type="text"
                          value={formData.whatsappButtonText}
                          onChange={(e) => setFormData({ ...formData, whatsappButtonText: e.target.value })}
                          placeholder="e.g. Send CV on WhatsApp"
                          className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all font-bold text-gray-900"
                        />
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-gray-50">
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Apply Button Text (Optional)</label>
                    <input
                      type="text"
                      value={formData.externalLinkText}
                      onChange={(e) => setFormData({ ...formData, externalLinkText: e.target.value })}
                      placeholder="e.g. Apply Now, Register Here"
                      className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all font-bold text-gray-900"
                    />
                    <p className="mt-2 text-[10px] text-gray-400 font-medium">
                      Defaults to "Apply Now" if left empty.
                    </p>
                  </div>

                  <div className="space-y-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                      className={cn(
                        "w-full flex items-center justify-between p-4 rounded-2xl border transition-all",
                        formData.isActive 
                          ? "bg-green-50 border-green-100 text-green-700" 
                          : "bg-gray-50 border-gray-100 text-gray-500"
                      )}
                    >
                      <div className="flex items-center">
                        <CheckCircle2 className={cn("h-5 w-5 mr-3", formData.isActive ? "text-green-600" : "text-gray-400")} />
                        <span className="text-sm font-black uppercase tracking-widest">Published</span>
                      </div>
                      <div className={cn(
                        "w-10 h-6 rounded-full relative transition-all",
                        formData.isActive ? "bg-green-600" : "bg-gray-300"
                      )}>
                        <div className={cn(
                          "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                          formData.isActive ? "right-1" : "left-1"
                        )} />
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, isFeatured: !formData.isFeatured })}
                      className={cn(
                        "w-full flex items-center justify-between p-4 rounded-2xl border transition-all",
                        formData.isFeatured 
                          ? "bg-amber-50 border-amber-100 text-amber-700" 
                          : "bg-gray-50 border-gray-100 text-gray-500"
                      )}
                    >
                      <div className="flex items-center">
                        <Star className={cn("h-5 w-5 mr-3", formData.isFeatured ? "text-amber-500 fill-current" : "text-gray-400")} />
                        <span className="text-sm font-black uppercase tracking-widest">Featured</span>
                      </div>
                      <div className={cn(
                        "w-10 h-6 rounded-full relative transition-all",
                        formData.isFeatured ? "bg-amber-500" : "bg-gray-300"
                      )}>
                        <div className={cn(
                          "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                          formData.isFeatured ? "right-1" : "left-1"
                        )} />
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="seo"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* SEO Main Content */}
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-white p-4 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                  <div className="flex items-center space-x-3 mb-2">
                    <SearchIcon className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-black text-gray-900 tracking-tight">Search Engine Optimization</h3>
                  </div>

                  <div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3 ml-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">SEO Title</label>
                        <div className="flex flex-wrap gap-3">
                          <button 
                            type="button"
                            onClick={() => setFormData({ ...formData, seoTitle: formData.title })}
                            className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                          >
                            Copy from Title
                          </button>
                          {!formData.seoTitle?.includes(new Date().getFullYear().toString()) && (
                            <button
                              type="button"
                              onClick={() => {
                                const currentYear = new Date().getFullYear();
                                const baseTitle = formData.seoTitle || formData.title;
                                setFormData({ ...formData, seoTitle: `${baseTitle} ${currentYear}` });
                              }}
                              className="text-[10px] font-black text-green-600 uppercase tracking-widest hover:underline flex items-center"
                            >
                              <Plus className="h-3 w-3 mr-1" /> Append {new Date().getFullYear()}
                            </button>
                          )}
                        </div>
                      </div>
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest",
                        formData.seoTitle.length > 60 ? "text-red-500" : "text-green-600"
                      )}>
                        {formData.seoTitle.length}/60
                      </span>
                    </div>
                    <input
                      type="text"
                      value={formData.seoTitle}
                      onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                      placeholder={formData.title || "SEO Title..."}
                      className="w-full px-4 sm:px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all font-bold text-gray-900"
                    />
                  </div>

                  <div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3 ml-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Meta Description</label>
                        <div className="flex flex-wrap gap-3">
                          <button 
                            type="button"
                            onClick={() => setFormData({ ...formData, metaDescription: stripHtml(formData.description).slice(0, 160) })}
                            className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                          >
                            Generate from Content
                          </button>
                          {!formData.metaDescription?.toLowerCase().includes('nigeria') && (
                            <button
                              type="button"
                              onClick={() => {
                                const baseDesc = formData.metaDescription || stripHtml(formData.description).slice(0, 140);
                                setFormData({ ...formData, metaDescription: `${baseDesc} in Nigeria. Apply now!` });
                              }}
                              className="text-[10px] font-black text-amber-600 uppercase tracking-widest hover:underline flex items-center"
                            >
                              <MapPin className="h-3 w-3 mr-1" /> Add "Nigeria"
                            </button>
                          )}
                        </div>
                      </div>
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest",
                        formData.metaDescription.length > 160 ? "text-red-500" : "text-green-600"
                      )}>
                        {formData.metaDescription.length}/160
                      </span>
                    </div>
                    <textarea
                      value={formData.metaDescription}
                      onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                      placeholder="Brief summary for search results..."
                      className="w-full px-4 sm:px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all font-bold text-gray-900 h-32 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Focus Keyword</label>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <input
                        type="text"
                        value={formData.focusKeyword}
                        onChange={(e) => setFormData({ ...formData, focusKeyword: e.target.value })}
                        placeholder="e.g. scholarships"
                        className="flex-grow px-4 sm:px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all font-bold text-gray-900"
                      />
                      <div className="px-4 sm:px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center min-w-[120px]">
                        <div className="text-center">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Density</p>
                          <p className={cn(
                            "text-sm font-black",
                            keywordDensity < 0.5 ? "text-red-500" : 
                            keywordDensity < 2.5 ? "text-green-600" : 
                            "text-amber-500"
                          )}>
                            {keywordDensity.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SEO Preview */}
                <div className="bg-white p-4 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                  <div className="flex items-center space-x-3 mb-2">
                    <Eye className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-black text-gray-900 tracking-tight">Google Search Preview</h3>
                  </div>
                  
                  <div className="p-4 sm:p-6 bg-gray-50 rounded-2xl border border-gray-100 max-w-xl overflow-hidden">
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                        <Globe className="h-3 w-3 text-gray-400" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-bold text-gray-900 leading-none">Hub & Jobs</span>
                        <span className="text-[10px] text-gray-500 leading-none truncate">https://hubandjobs.com › post › {generateSlug(formData.title || 'post-slug')}</span>
                      </div>
                    </div>
                    <h4 className="text-lg sm:text-xl font-medium text-blue-700 hover:underline cursor-pointer mb-1 line-clamp-1 break-words">
                      {formData.seoTitle || formData.title || "Post Title Here — Hub & Jobs"}
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 leading-relaxed break-words">
                      <span className="text-gray-400">{format(new Date(), 'MMM d, yyyy')} — </span>
                      {formData.metaDescription || stripHtml(formData.description).slice(0, 160) || "Meta description preview text here showing exactly 160 characters..."}
                    </p>
                  </div>
                </div>
              </div>

              {/* SEO Sidebar */}
              <div className="space-y-8">
                <div className="bg-white p-4 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                  <div className="flex items-center space-x-3 mb-2">
                    <Globe className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-black text-gray-900 tracking-tight">Social SEO</h3>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Custom OG Image</label>
                    <div 
                      onClick={() => ogImageInputRef.current?.click()}
                      className={cn(
                        "relative aspect-[1.91/1] rounded-2xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all overflow-hidden mb-4",
                        ogImagePreview && "border-none"
                      )}
                    >
                      {ogImagePreview ? (
                        <>
                          <img src={ogImagePreview} alt="OG Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-all">
                            <div className="flex space-x-4">
                              <Upload className="h-8 w-8 text-white" />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOgImageFile(null);
                                  setOgImagePreview('');
                                  setFormData({ ...formData, ogImage: '' });
                                }}
                                className="p-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all"
                              >
                                <X className="h-6 w-6" />
                              </button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <ImageIcon className="h-10 w-10 text-gray-300 mb-2" />
                          <p className="text-[10px] font-bold text-gray-400 text-center px-2">Click to upload OG image</p>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      ref={ogImageInputRef}
                      onChange={handleOgImageChange}
                      accept="image/*"
                      className="hidden"
                    />

                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Or Custom OG Image URL</label>
                    <input
                      type="url"
                      value={formData.ogImage}
                      onChange={(e) => {
                        setFormData({ ...formData, ogImage: e.target.value });
                        if (!ogImageFile) setOgImagePreview(e.target.value);
                      }}
                      placeholder="Defaults to thumbnail..."
                      className="w-full px-4 sm:px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all font-bold text-gray-900"
                    />
                  </div>

                  <div className="pt-6 border-t border-gray-100">
                    <div className="flex items-center space-x-3 mb-6">
                      <MousePointerClick className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-black text-gray-900 tracking-tight">Call to Action</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Button Text</label>
                        <input
                          type="text"
                          value={formData.ctaText}
                          onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                          placeholder="e.g. Apply Now, Learn More"
                          className="w-full px-4 sm:px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all font-bold text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Button Color</label>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                          <input
                            type="color"
                            value={formData.ctaColor}
                            onChange={(e) => setFormData({ ...formData, ctaColor: e.target.value })}
                            className="h-12 w-full sm:w-20 p-1 bg-gray-50 border border-gray-100 rounded-xl cursor-pointer"
                          />
                          <input
                            type="text"
                            value={formData.ctaColor}
                            onChange={(e) => setFormData({ ...formData, ctaColor: e.target.value })}
                            className="flex-grow px-4 sm:px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all font-bold text-gray-900"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SEO Health Checklist */}
                <div className="bg-white p-4 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                  <h3 className="text-lg font-black text-gray-900 tracking-tight">SEO Health</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-600">Thumbnail Image</span>
                      {thumbnailPreview ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <div className="h-4 w-4 rounded-full border border-gray-200" />}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-600">Meta Description</span>
                      {formData.metaDescription ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-600">Slug is Clean</span>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-600">Has Tags</span>
                      {formData.tags ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-600">Content Length</span>
                      {wordCount >= 600 ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : 
                       wordCount >= 300 ? <AlertCircle className="h-4 w-4 text-amber-500" /> : 
                       <X className="h-4 w-4 text-red-500" />}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-600">Focus Keyword</span>
                      {formData.focusKeyword ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && publishedPost && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-800 relative overflow-hidden"
            >
              {/* Decorative background */}
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 via-blue-500 to-purple-600" />
              
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight mb-2">Successfully Published!</h3>
                <p className="text-gray-500 dark:text-gray-400 font-medium">Your opportunity is now live. Spread the word!</p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => {
                    const text = encodeURIComponent(`🚀 *New Opportunity:* ${publishedPost.title}\n\nCheck it out here: ${window.location.origin}/post/${publishedPost.slug}`);
                    window.open(`https://wa.me/?text=${text}`, '_blank');
                  }}
                  className="w-full flex items-center justify-between p-5 bg-[#25D366] text-white rounded-2xl font-black hover:opacity-90 transition-all shadow-lg shadow-green-500/20 group"
                >
                  <div className="flex items-center space-x-4">
                    <MessageCircle className="h-6 w-6" />
                    <span>Share to WhatsApp</span>
                  </div>
                  <ArrowLeft className="h-5 w-5 rotate-180 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => {
                    const text = encodeURIComponent(`🚀 New Opportunity: ${publishedPost.title}`);
                    const url = encodeURIComponent(`${window.location.origin}/post/${publishedPost.slug}`);
                    window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
                  }}
                  className="w-full flex items-center justify-between p-5 bg-[#0088cc] text-white rounded-2xl font-black hover:opacity-90 transition-all shadow-lg shadow-blue-500/20 group"
                >
                  <div className="flex items-center space-x-4">
                    <Send className="h-6 w-6" />
                    <span>Share to Telegram</span>
                  </div>
                  <ArrowLeft className="h-5 w-5 rotate-180 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/post/${publishedPost.slug}`);
                    toast.success("Link copied to clipboard!");
                  }}
                  className="w-full flex items-center justify-between p-5 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl font-black hover:bg-gray-200 dark:hover:bg-gray-700 transition-all group"
                >
                  <div className="flex items-center space-x-4">
                    <Copy className="h-6 w-6" />
                    <span>Copy Link</span>
                  </div>
                  <ArrowLeft className="h-5 w-5 rotate-180 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              <button
                onClick={() => navigate('/admin/posts')}
                className="w-full mt-8 py-4 text-gray-400 font-bold hover:text-gray-600 transition-all"
              >
                Done, take me back
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
