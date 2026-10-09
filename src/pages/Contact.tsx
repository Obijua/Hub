import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Mail, 
  MapPin, 
  Phone, 
  Send, 
  MessageCircle, 
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { SEO } from '../components/SEO';
import { toast } from 'sonner';

export const Contact = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setSubmitted(true);
    toast.success('Message sent successfully! We will get back to you soon.');
  };

  const contactInfo = [
    {
      icon: Mail,
      title: 'Email Us',
      value: 'contact@hubandjobs.com',
      description: 'Our support team usually responds within 24 hours.',
      color: 'bg-blue-50 text-blue-600'
    },
    {
      icon: Phone,
      title: 'Call Us',
      value: '+234 (0) 800 HUB JOBS',
      description: 'Available Mon-Fri, 9am - 5pm WAT.',
      color: 'bg-amber-50 text-amber-600'
    },
    {
      icon: MessageCircle,
      title: 'Live Chat',
      value: 'Telegram Community',
      description: 'Join our active community for instant updates.',
      color: 'bg-green-50 text-green-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <SEO 
        title="Contact Us - Hub & Jobs" 
        description="Get in touch with the Hub & Jobs team. We're here to help with your career questions, partnership inquiries, or platform support."
      />

      {/* Hero Section */}
      <section className="py-20 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
              Let's Start a <span className="text-accent">Conversation</span>
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
              Have a question, feedback, or a partnership proposal? We'd love to hear from you. 
              Our team is dedicated to helping you succeed.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-20 -mt-10 relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8 mb-16">
            {contactInfo.map((info, index) => (
              <motion.div
                key={info.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-900 p-8 rounded-[2rem] shadow-xl border border-gray-100 dark:border-gray-800"
              >
                <div className={`w-14 h-14 rounded-2xl ${info.color} flex items-center justify-center mb-6`}>
                  <info.icon size={28} />
                </div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">{info.title}</h3>
                <div className="text-primary dark:text-accent font-bold mb-3">{info.value}</div>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                  {info.description}
                </p>
              </motion.div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Form Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-gray-900 p-8 md:p-12 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-800"
            >
              {submitted ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 size={40} />
                  </div>
                  <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4">Message Sent!</h2>
                  <p className="text-gray-500 mb-8">Thank you for reaching out. We'll get back to you as soon as possible.</p>
                  <button 
                    onClick={() => setSubmitted(false)}
                    className="px-8 py-3 bg-primary text-white font-black rounded-xl hover:bg-blue-800 transition-all"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                      <input 
                        required
                        type="text" 
                        className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none focus:ring-2 focus:ring-accent outline-none text-gray-900 dark:text-white" 
                        placeholder="John Doe" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                      <input 
                        required
                        type="email" 
                        className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none focus:ring-2 focus:ring-accent outline-none text-gray-900 dark:text-white" 
                        placeholder="john@example.com" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Subject</label>
                    <select className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none focus:ring-2 focus:ring-accent outline-none text-gray-900 dark:text-white appearance-none">
                      <option>General Inquiry</option>
                      <option>Partnership Opportunity</option>
                      <option>Technical Support</option>
                      <option>Feedback</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Your Message</label>
                    <textarea 
                      required
                      rows={5} 
                      className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none focus:ring-2 focus:ring-accent outline-none text-gray-900 dark:text-white resize-none" 
                      placeholder="How can we help you today?"
                    ></textarea>
                  </div>
                  <button 
                    disabled={isSubmitting}
                    className="w-full py-5 bg-primary text-white font-black rounded-2xl hover:bg-blue-800 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-70"
                  >
                    {isSubmitting ? (
                      <>
                        <Clock className="animate-spin" size={20} />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send size={20} />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              )}
            </motion.div>

            {/* FAQ/Info Section */}
            <div className="space-y-8">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-accent/10 p-8 rounded-[2.5rem] border border-accent/20"
              >
                <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400 mb-4">
                  <AlertCircle size={24} />
                  <h3 className="text-xl font-black tracking-tight">Quick Note</h3>
                </div>
                <p className="text-amber-900 dark:text-amber-200/70 leading-relaxed font-medium">
                  If you're inquiring about a specific job post or scholarship, please include the link or title in your message for a faster response.
                </p>
              </motion.div>

              <div className="space-y-4">
                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-6">Frequently Asked Questions</h3>
                {[
                  { q: 'How do I post a job?', a: 'Currently, only verified partners can post directly. Contact our partnership team for more info.' },
                  { q: 'Is Hub & Jobs free to use?', a: 'Yes! Browsing opportunities is 100% free. We only charge for premium document building services.' },
                  { q: 'How can I join the Telegram group?', a: 'You can find the link in our navigation menu or footer under "Community".' }
                ].map((faq, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + (i * 0.1) }}
                    className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800"
                  >
                    <h4 className="font-black text-gray-900 dark:text-white mb-2">{faq.q}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{faq.a}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
