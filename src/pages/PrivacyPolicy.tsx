import React from 'react';
import { motion } from 'motion/react';
import { Shield, Lock, Eye, FileText, Scale, Mail } from 'lucide-react';
import { SEO } from '../components/SEO';

export const PrivacyPolicy = () => {
  const lastUpdated = 'April 9, 2026';

  const sections = [
    {
      title: '1. Information We Collect',
      content: `We collect information that you provide directly to us, such as when you create an account, use our document builders, or contact us for support. This may include your name, email address, professional details, and any other information you choose to provide.`,
      icon: Eye
    },
    {
      title: '2. How We Use Your Information',
      content: `We use the information we collect to provide, maintain, and improve our services, including our CV and business plan builders. We also use it to communicate with you, provide customer support, and send you technical notices and updates.`,
      icon: Shield
    },
    {
      title: '3. Data Security',
      content: `We take reasonable measures to help protect information about you from loss, theft, misuse, and unauthorized access, disclosure, alteration, and destruction. However, no internet transmission is ever fully secure or error-free.`,
      icon: Lock
    },
    {
      title: '4. Third-Party Services',
      content: `Our platform may contain links to third-party websites or services (like job portals or scholarship sites). We are not responsible for the privacy practices or content of these third-party sites.`,
      icon: Globe
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-32 pb-20">
      <SEO 
        title="Privacy Policy - Hub & Jobs" 
        description="Read our privacy policy to understand how Hub & Jobs collects, uses, and protects your personal information."
      />

      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex p-3 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-6">
            <Shield size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            Last Updated: {lastUpdated}
          </p>
        </motion.div>

        <div className="space-y-12">
          {sections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-900 p-8 md:p-10 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-primary dark:text-accent">
                  <section.icon size={24} />
                </div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                  {section.title}
                </h2>
              </div>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-lg">
                {section.content}
              </p>
            </motion.div>
          ))}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-primary text-white p-10 rounded-[2.5rem] shadow-2xl"
          >
            <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
              <Mail size={24} />
              Contact Us About Privacy
            </h2>
            <p className="text-blue-100 mb-8 leading-relaxed text-lg">
              If you have any questions about this Privacy Policy, please contact our data protection officer at:
            </p>
            <div className="inline-block px-6 py-3 bg-white/10 rounded-xl font-black text-xl">
              privacy@hubandjobs.com
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

// Helper for icon
const Globe = ({ size }: { size: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);
