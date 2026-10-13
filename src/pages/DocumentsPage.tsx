import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  FileText, 
  BarChart3, 
  Building2, 
  Rocket, 
  CheckCircle2, 
  ShieldCheck, 
  Smartphone, 
  Zap,
  Eye,
  AlertTriangle
} from 'lucide-react';
import { useDocumentSettings } from '../hooks/useDocumentSettings';
import { useSeo } from '../lib/seo';

const DocumentCard = ({ 
  icon: Icon, 
  title, 
  description, 
  price, 
  originalPrice,
  badge, 
  link, 
  buttonText,
  highlight = false,
  showOriginalPrice = false
}: any) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className={`relative p-8 rounded-3xl border ${
      highlight 
        ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-800' 
        : 'bg-white border-gray-100 dark:bg-gray-900 dark:border-gray-800'
    } shadow-xl shadow-gray-200/50 dark:shadow-none flex flex-col h-full`}
  >
    {badge && (
      <span className="absolute top-4 right-4 bg-primary text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
        {badge}
      </span>
    )}
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${
      highlight ? 'bg-amber-100 text-amber-600' : 'bg-blue-50 text-primary'
    }`}>
      <Icon size={28} />
    </div>
    <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3">{title}</h3>
    <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-6 flex-grow">
      {description}
    </p>
    <div className="flex items-baseline gap-2 mb-6">
      <span className="text-3xl font-black text-gray-900 dark:text-white">₦{price.toLocaleString()}</span>
      {showOriginalPrice && originalPrice && (
        <span className="text-gray-400 line-through text-sm">₦{originalPrice.toLocaleString()}</span>
      )}
    </div>
    <Link 
      to={link}
      className={`w-full py-4 rounded-2xl font-black text-center transition-all active:scale-95 ${
        highlight 
          ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-500/30' 
          : 'bg-primary text-white hover:bg-blue-900 shadow-lg shadow-primary/30'
      }`}
    >
      {buttonText}
    </Link>
  </motion.div>
);

const DocumentsPage = () => {
  useSeo({
    title: 'Professional CV & Cover Letter Builder | Hub & Jobs',
    description: 'Create professional ATS-friendly CVs, business plans, proposals, and application bundles in minutes.',
    path: '/documents'
  });
  const [sampleModal, setSampleModal] = useState<string | null>(null);
  const { settings, loading } = useDocumentSettings();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!settings.availability.masterToggle) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-400">
            <FileText size={40} />
          </div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4">Document Builder Offline</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">We're currently performing maintenance on our document builders. Please check back later.</p>
          <Link to="/" className="px-8 py-4 bg-primary text-white font-black rounded-2xl">Return Home</Link>
        </div>
      </div>
    );
  }

  const trustBadges = [
    { icon: Zap, text: 'Instant generation' },
    { icon: FileText, text: 'PDF download' },
    { icon: Building2, text: 'Nigerian market focused' },
    { icon: CheckCircle2, text: 'Editable before paying' },
    { icon: ShieldCheck, text: 'Secure via Paystack' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white pt-24 pb-20">
      {settings.payment.testMode && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-white py-2 px-4 text-center font-black text-xs uppercase tracking-widest flex items-center justify-center space-x-2">
          <AlertTriangle size={14} />
          <span>Test Mode Enabled - No real payments will be processed</span>
        </div>
      )}
      <div className="max-w-7xl mx-auto px-6">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-6xl font-black text-gray-900 dark:text-white mb-6 tracking-tight"
          >
            {settings.appearance.pageTitle}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-500 dark:text-gray-400 leading-relaxed"
          >
            {settings.appearance.pageSubtitle}
          </motion.p>
        </div>

        {/* Product Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {settings.availability.cv && (
            <DocumentCard 
              icon={FileText}
              title="Professional CV"
              description="ATS-friendly, recruiter-approved CV tailored for Nigerian job market"
              price={settings.pricing.cv}
              badge={!settings.appearance.hideAllBadges && settings.appearance.cvBadge}
              link="/documents/cv"
              buttonText="Build My CV"
            />
          )}
          {settings.availability.proposal && (
            <DocumentCard 
              icon={BarChart3}
              title="Business Proposal"
              description="Win contracts for estate maintenance, cleaning, catering, security and more"
              price={settings.pricing.proposal}
              badge={!settings.appearance.hideAllBadges && settings.appearance.proposalBadge}
              link="/documents/proposal"
              buttonText="Create Proposal"
            />
          )}
          {settings.availability.businessPlan && (
            <DocumentCard 
              icon={Building2}
              title="Business Plan"
              description="BoI, SMEDAN, Tony Elumelu and bank loan-ready business plans"
              price={settings.pricing.businessPlan}
              badge={!settings.appearance.hideAllBadges && settings.appearance.businessPlanBadge}
              link="/documents/business-plan"
              buttonText="Write Business Plan"
            />
          )}
          {settings.availability.startupBundle && (
            <DocumentCard 
              icon={Rocket}
              title="Startup Bundle"
              description="Business Plan + Proposal Template + Professional CV. Everything you need to launch."
              price={settings.pricing.startupBundle}
              originalPrice={settings.pricing.cv + settings.pricing.proposal + settings.pricing.businessPlan}
              showOriginalPrice={settings.pricing.showOriginalPrice}
              badge={!settings.appearance.hideAllBadges && settings.pricing.discountBadge && settings.pricing.badgeText}
              link="/documents/bundle"
              buttonText="Get Bundle"
              highlight={true}
            />
          )}
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center gap-8 mb-32">
          {trustBadges.map((badge, i) => (
            <div key={i} className="flex items-center gap-2 text-gray-600 dark:text-gray-400 font-medium">
              <badge.icon size={20} className="text-primary" />
              <span>{badge.text}</span>
            </div>
          ))}
        </div>

        {/* Sample Documents Section */}
        <div className="bg-white dark:bg-gray-900 rounded-[40px] p-12 border border-gray-100 dark:border-gray-800">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4">See What You'll Get</h2>
            <p className="text-gray-500 dark:text-gray-400">High-quality templates designed by industry experts</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {['CV', 'Proposal', 'Business Plan'].map((type) => (
              <div key={type} className="group relative">
                <div className="aspect-[3/4] rounded-2xl bg-gray-100 dark:bg-gray-800 overflow-hidden relative border border-gray-200 dark:border-gray-700">
                  <div className="absolute inset-0 blur-md opacity-40 scale-110">
                    <div className="p-8 space-y-4">
                      <div className="h-8 w-3/4 bg-gray-300 dark:bg-gray-600 rounded" />
                      <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
                      <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
                      <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded" />
                      <div className="pt-8 space-y-2">
                        <div className="h-4 w-1/4 bg-gray-300 dark:bg-gray-600 rounded" />
                        <div className="h-20 w-full bg-gray-200 dark:bg-gray-700 rounded" />
                      </div>
                    </div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => setSampleModal(type)}
                      className="px-6 py-3 bg-white text-gray-900 font-black rounded-xl shadow-xl flex items-center gap-2"
                    >
                      <Eye size={18} />
                      See Sample
                    </button>
                  </div>
                </div>
                <p className="text-center mt-4 font-bold text-gray-700 dark:text-gray-300">{type} Template</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sample Modal */}
      {sampleModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-900 rounded-[32px] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
          >
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <h3 className="text-xl font-black text-gray-900 dark:text-white">{sampleModal} Sample Preview</h3>
              <button 
                onClick={() => setSampleModal(null)}
                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500"
              >
                ✕
              </button>
            </div>
            <div className="flex-grow overflow-y-auto p-8 relative">
              <div className="space-y-6">
                <div className="h-12 w-1/2 bg-blue-600 rounded mb-8" />
                <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
                
                {/* Blur rest of content */}
                <div className="relative">
                  <div className="space-y-6 blur-md opacity-40 select-none pointer-events-none">
                    <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-20 w-full bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
                      <ShieldCheck size={32} />
                    </div>
                    <h4 className="text-xl font-black text-gray-900 dark:text-white mb-2">Full Sample Locked</h4>
                    <p className="text-gray-500 text-sm max-w-xs mb-6">Start building your own document to see the full professional layout.</p>
                    <Link 
                      to={`/documents/${sampleModal.toLowerCase().replace(' ', '-')}`}
                      className="px-8 py-4 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/30"
                    >
                      Start Building Now
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default DocumentsPage;
