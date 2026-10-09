import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, Info, Gavel, ShieldAlert, ExternalLink } from 'lucide-react';
import { SEO } from '../components/SEO';

export const Disclaimer = () => {
  const lastUpdated = 'April 9, 2026';

  const disclaimers = [
    {
      title: 'General Information',
      content: `The information provided by Hub & Jobs is for general informational purposes only. All information on the site is provided in good faith, however we make no representation or warranty of any kind, express or implied, regarding the accuracy, adequacy, validity, reliability, availability, or completeness of any information on the site.`,
      icon: Info
    },
    {
      title: 'External Links Disclaimer',
      content: `The site may contain links to other websites or content belonging to or originating from third parties. Such external links are not investigated, monitored, or checked for accuracy, adequacy, validity, reliability, availability, or completeness by us. We do not warrant, endorse, guarantee, or assume responsibility for the accuracy or reliability of any information offered by third-party websites.`,
      icon: ExternalLink
    },
    {
      title: 'Professional Disclaimer',
      content: `The site cannot and does not contain professional advice (e.g., legal or financial advice). The professional information is provided for general informational and educational purposes only and is not a substitute for professional advice. Accordingly, before taking any actions based upon such information, we encourage you to consult with the appropriate professionals.`,
      icon: Gavel
    },
    {
      title: 'Errors and Omissions',
      content: `While we have made every attempt to ensure that the information contained in this site has been obtained from reliable sources, Hub & Jobs is not responsible for any errors or omissions, or for the results obtained from the use of this information.`,
      icon: AlertTriangle
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-32 pb-20">
      <SEO 
        title="Disclaimer - Hub & Jobs" 
        description="Read the disclaimer for Hub & Jobs to understand the limitations of the information provided on our platform."
      />

      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex p-3 rounded-2xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 mb-6">
            <ShieldAlert size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
            Disclaimer
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            Last Updated: {lastUpdated}
          </p>
        </motion.div>

        <div className="space-y-8">
          {disclaimers.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-amber-500">
                  <item.icon size={20} />
                </div>
                <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                  {item.title}
                </h2>
              </div>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {item.content}
              </p>
            </motion.div>
          ))}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-12 p-8 bg-gray-100 dark:bg-gray-800/50 rounded-3xl text-center"
          >
            <p className="text-gray-500 dark:text-gray-400 text-sm italic">
              Your use of the site and your reliance on any information on the site is solely at your own risk. 
              This disclaimer was created to protect both our users and our platform.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
