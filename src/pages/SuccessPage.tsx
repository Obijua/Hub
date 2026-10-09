import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Download, Home, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const SuccessPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pt-32 pb-20 px-6">
      <div className="max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 12 }}
          className="w-24 h-24 bg-green-100 dark:bg-green-900/20 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8"
        >
          <CheckCircle2 size={48} />
        </motion.div>

        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-4xl font-black text-gray-900 dark:text-white mb-4 tracking-tight"
        >
          Payment Successful!
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-gray-500 text-lg mb-12"
        >
          Your document has been unlocked and is ready for download. 
          A copy of your receipt has been sent to your email.
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <Link
            to="/my-documents"
            className="flex items-center justify-center gap-2 px-8 py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/30 hover:scale-105 transition-transform"
          >
            <Download size={20} />
            My Documents
          </Link>
          <Link
            to="/"
            className="flex items-center justify-center gap-2 px-8 py-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-black rounded-2xl border border-gray-200 dark:border-gray-800 hover:scale-105 transition-transform"
          >
            <Home size={20} />
            Back to Home
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-16 p-8 bg-white dark:bg-gray-900 rounded-[32px] border border-gray-100 dark:border-gray-800 text-left"
        >
          <h3 className="text-xl font-black mb-4">Next Steps</h3>
          <ul className="space-y-4">
            <li className="flex gap-3">
              <div className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">1</div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Download your PDF and review it for any final adjustments.</p>
            </li>
            <li className="flex gap-3">
              <div className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">2</div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Upload your CV to job portals like LinkedIn, Indeed, or Jobberman.</p>
            </li>
            <li className="flex gap-3">
              <div className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">3</div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Check our blog for interview tips and career growth strategies.</p>
            </li>
          </ul>
          <Link to="/blog" className="mt-6 inline-flex items-center gap-2 text-primary font-bold hover:gap-3 transition-all">
            Visit Blog <ArrowRight size={16} />
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default SuccessPage;
