import React, { useState } from 'react';
import { 
  Mail, 
  Phone, 
  Send, 
  MessageCircle, 
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { SEO } from '../components/SEO';
import { toast } from 'sonner';
import { useSeo } from '../lib/seo';

export const Contact = () => {
  useSeo({
    title: 'Contact Us | Hub & Jobs',
    description: 'Get in touch with the Hub & Jobs team for support, inquiries, or partnerships.',
    path: '/contact'
  });
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

  return (
    <div className="min-h-screen bg-[#EEF2FF] pb-[96px]">
      <SEO 
        title="Contact Us - Hub & Jobs" 
        description="Get in touch with the Hub & Jobs team. We're here to help with your career questions, partnership inquiries, or platform support."
      />

      <div className="max-w-[430px] mx-auto px-4 py-6 space-y-6">
        {/* Hero Section */}
        <section className="bg-[#1E3B8B] text-white p-6 rounded-sm shadow-sm text-center">
          <h1 className="text-2xl font-black text-white mb-2 tracking-tight">
            Let's Start a <span className="text-[#E8B736]">Conversation</span>
          </h1>
          <p className="text-sm text-blue-100 leading-relaxed">
            Have a question, feedback, or a partnership proposal? We'd love to hear from you. 
            Our team is dedicated to helping you succeed.
          </p>
        </section>

        {/* Contact Info Cards */}
        <section className="space-y-3">
          {/* Email Us */}
          <div className="bg-white p-4 rounded-sm shadow-sm border border-slate-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-sm bg-blue-50 text-[#1E3B8B] flex items-center justify-center shrink-0">
                <Mail size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-black text-gray-900 mb-0.5">Email Us</h3>
                <a 
                  href="mailto:contact.hubandjobs@gmail.com" 
                  className="text-[#1E3B8B] font-bold hover:underline block leading-snug"
                  style={{ fontSize: '16px', overflowWrap: 'anywhere' }}
                >
                  contact.hubandjobs@gmail.com
                </a>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Our support team usually responds within 24 hours.
                </p>
              </div>
            </div>
          </div>

          {/* Call Us */}
          <div className="bg-white p-4 rounded-sm shadow-sm border border-slate-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-sm bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Phone size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-black text-gray-900 mb-0.5">Call Us</h3>
                <div className="flex flex-wrap items-center gap-2 mt-0.5 mb-1">
                  <a 
                    href="tel:+2348142114452" 
                    className="text-sm text-[#1E3B8B] font-bold hover:underline leading-snug"
                  >
                    +234 814 211 4452
                  </a>
                  <a
                    href="https://wa.me/2348142114452"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-2 py-0.5 rounded-sm bg-[#E8B736] text-[#1E3B8B] text-xs font-bold hover:bg-amber-400 transition-colors"
                  >
                    WhatsApp
                  </a>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Available Mon-Fri, 9am - 5pm WAT.
                </p>
              </div>
            </div>
          </div>

          {/* Live Chat / Community */}
          <div className="bg-white p-4 rounded-sm shadow-sm border border-slate-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-sm bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                <MessageCircle size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-black text-gray-900 mb-0.5">Live Chat</h3>
                <div className="text-sm text-[#1E3B8B] font-bold mb-1">Telegram Community</div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Join our active community for instant updates.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Message Form */}
        <section className="bg-white p-5 rounded-sm shadow-sm border border-slate-200">
          {submitted ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-sm flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 size={24} />
              </div>
              <h2 className="text-xl font-black text-gray-900 mb-2">Message Sent!</h2>
              <p className="text-xs text-gray-500 mb-4">
                Thank you for reaching out. We'll get back to you as soon as possible.
              </p>
              <button 
                onClick={() => setSubmitted(false)}
                className="px-5 py-2.5 bg-[#1E3B8B] text-white font-bold text-sm rounded-sm hover:bg-blue-800 transition-all"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="text-lg font-black text-gray-900 mb-2">Send us a Message</h2>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-3 py-2.5 rounded-sm bg-gray-50 border border-slate-200 focus:ring-1 focus:ring-[#1E3B8B] focus:border-[#1E3B8B] outline-none text-sm text-gray-900" 
                  placeholder="John Doe" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
                <input 
                  required
                  type="email" 
                  className="w-full px-3 py-2.5 rounded-sm bg-gray-50 border border-slate-200 focus:ring-1 focus:ring-[#1E3B8B] focus:border-[#1E3B8B] outline-none text-sm text-gray-900" 
                  placeholder="john@example.com" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Subject</label>
                <select className="w-full px-3 py-2.5 rounded-sm bg-gray-50 border border-slate-200 focus:ring-1 focus:ring-[#1E3B8B] focus:border-[#1E3B8B] outline-none text-sm text-gray-900 appearance-none">
                  <option>General Inquiry</option>
                  <option>Partnership Opportunity</option>
                  <option>Technical Support</option>
                  <option>Feedback</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Your Message</label>
                <textarea 
                  required
                  rows={4} 
                  className="w-full px-3 py-2.5 rounded-sm bg-gray-50 border border-slate-200 focus:ring-1 focus:ring-[#1E3B8B] focus:border-[#1E3B8B] outline-none text-sm text-gray-900 resize-none" 
                  placeholder="How can we help you today?"
                ></textarea>
              </div>
              <button 
                disabled={isSubmitting}
                className="w-full py-3 bg-[#1E3B8B] text-white font-bold text-sm rounded-sm hover:bg-blue-800 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <Clock className="animate-spin" size={16} />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Send Message</span>
                  </>
                )}
              </button>
            </form>
          )}
        </section>

        {/* Quick Note */}
        <section className="bg-amber-50 p-4 rounded-sm border border-amber-200">
          <div className="flex items-center gap-2 text-amber-700 mb-1.5">
            <AlertCircle size={18} />
            <h3 className="text-sm font-black">Quick Note</h3>
          </div>
          <p className="text-xs text-amber-900 leading-relaxed font-medium">
            If you're inquiring about a specific job post or scholarship, please include the link or title in your message for a faster response.
          </p>
        </section>

        {/* FAQs */}
        <section className="space-y-3">
          <h3 className="text-base font-black text-gray-900 px-1">Frequently Asked Questions</h3>
          {[
            { q: 'How do I post a job?', a: 'Currently, only verified partners can post directly. Contact our partnership team for more info.' },
            { q: 'Is Hub & Jobs free to use?', a: 'Yes! Browsing opportunities is 100% free. We only charge for premium document building services.' },
            { q: 'How can I join the Telegram group?', a: 'You can find the link in our navigation menu or footer under "Community".' }
          ].map((faq, i) => (
            <div
              key={i}
              className="bg-white p-4 rounded-sm border border-slate-200 shadow-sm"
            >
              <h4 className="text-xs font-black text-gray-900 mb-1">{faq.q}</h4>
              <p className="text-xs text-gray-600 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
};

export default Contact;
