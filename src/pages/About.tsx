import React, { useState } from 'react';
import { 
  Target, 
  Users, 
  Award, 
  Globe, 
  CheckCircle2, 
  Mail, 
  Phone,
  Briefcase,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  MessageCircle
} from 'lucide-react';
import { SEO } from '../components/SEO';
import { useSeo } from '../lib/seo';

export const About = () => {
  useSeo({
    title: 'About Us | Hub & Jobs',
    description: "Learn about Hub & Jobs, Nigeria's leading career and opportunity portal.",
    path: '/about'
  });

  const [photoFailed, setPhotoFailed] = useState(false);

  const stats = [
    { label: 'Active Users', value: '50K+', icon: Users },
    { label: 'Opportunities Listed', value: '10K+', icon: Briefcase },
    { label: 'Countries Covered', value: '25+', icon: Globe },
    { label: 'Success Stories', value: '5K+', icon: Award },
  ];

  const values = [
    {
      title: 'Transparency',
      description: 'We believe in providing clear, honest, and accessible information about every opportunity we list.',
      icon: ShieldCheck,
      color: 'bg-blue-50 text-[#1E3B8B]'
    },
    {
      title: 'Innovation',
      description: 'Constantly evolving our platform to better serve job seekers and professionals worldwide.',
      icon: Sparkles,
      color: 'bg-amber-50 text-amber-600'
    },
    {
      title: 'Empowerment',
      description: 'Giving you the tools and resources needed to take control of your professional journey.',
      icon: TrendingUp,
      color: 'bg-green-50 text-green-600'
    }
  ];

  return (
    <div className="min-h-screen bg-[#EEF2FF] pb-[96px]">
      <SEO 
        title="About Us - Hub & Jobs" 
        description="Learn more about Hub & Jobs, our mission to connect professionals with global opportunities, and the values that drive us."
      />

      <div className="max-w-[430px] mx-auto px-4 py-6 space-y-6">
        {/* Hero Section */}
        <section className="bg-[#1E3B8B] text-white p-6 rounded-sm shadow-sm text-center">
          <h1 className="text-2xl font-black text-white mb-2 tracking-tight">
            Connecting Ambition <span className="text-[#E8B736]">With Opportunity</span>
          </h1>
          <p className="text-sm text-blue-100 leading-relaxed">
            Hub & Jobs is a premier platform dedicated to bridging the gap between talented professionals 
            and world-class opportunities across Nigeria and beyond.
          </p>
        </section>

        {/* Stats Section */}
        <section>
          <div className="grid grid-cols-2 gap-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="bg-white p-4 rounded-sm shadow-sm border border-slate-200 text-center"
              >
                <div className="inline-flex p-2 rounded-sm bg-[#EEF2FF] text-[#1E3B8B] mb-2">
                  <stat.icon size={20} />
                </div>
                <div className="text-2xl font-black text-gray-900 mb-0.5">{stat.value}</div>
                <div className="text-xs text-gray-500 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Mission Section */}
        <section className="bg-white p-5 rounded-sm shadow-sm border border-slate-200 space-y-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-[#1E3B8B] rounded-sm text-xs font-bold mb-3">
              <Target size={14} />
              <span>Our Mission</span>
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-2 leading-tight">
              Empowering the next generation of professionals.
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              We started Hub & Jobs with a simple goal: to make professional opportunities accessible to everyone, 
              regardless of their location. We believe that talent is universal, but opportunity is not. 
              Our platform is designed to level the playing field.
            </p>
          </div>

          <ul className="space-y-2.5">
            {[
              'Curated high-quality job listings',
              'Professional document building tools',
              'Career guidance and resources',
              'Support for job seekers across Nigeria'
            ].map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-xs text-gray-700 font-medium">
                <CheckCircle2 className="text-green-600 shrink-0" size={16} />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          {/* Photo Block */}
          {!photoFailed && (
            <div className="w-full aspect-[4/3] rounded-sm overflow-hidden border border-slate-200 bg-gray-100">
              <img 
                src="/about-team.jpg" 
                alt="Professionals working together on laptops" 
                className="w-full h-full object-cover rounded-sm"
                loading="lazy"
                onError={() => setPhotoFailed(true)}
              />
            </div>
          )}
        </section>

        {/* Values Section */}
        <section className="space-y-3">
          <div className="text-center px-2">
            <h2 className="text-xl font-black text-gray-900 mb-1">Our Core Values</h2>
            <p className="text-xs text-gray-500">The principles that guide everything we do at Hub & Jobs.</p>
          </div>

          <div className="space-y-3">
            {values.map((value) => (
              <div
                key={value.title}
                className="bg-white p-4 rounded-sm border border-slate-200 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-sm ${value.color} flex items-center justify-center shrink-0`}>
                    <value.icon size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-900 mb-1">{value.title}</h3>
                    <p className="text-xs text-gray-600 leading-relaxed">{value.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Contact Section ("Get in Touch" card) */}
        <section>
          <div 
            className="bg-[#1E3B8B] text-white rounded-sm shadow-sm"
            style={{ padding: '20px' }}
          >
            <h2 className="text-2xl font-black text-white mb-2">Get in Touch</h2>
            <p className="text-white/85 text-xs mb-5 leading-relaxed">
              Have questions or want to partner with us? We'd love to hear from you.
            </p>

            <div className="space-y-4">
              {/* Email Us */}
              <div className="flex items-center gap-3">
                <div 
                  className="w-[44px] h-[44px] shrink-0 rounded-sm flex items-center justify-center text-white"
                  style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
                >
                  <Mail size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-white/85 font-semibold">Email Us</div>
                  <a 
                    href="mailto:contact.hubandjobs@gmail.com" 
                    className="text-white font-bold hover:underline leading-snug block"
                    style={{ fontSize: '16px', overflowWrap: 'anywhere' }}
                  >
                    contact.hubandjobs@gmail.com
                  </a>
                </div>
              </div>

              {/* Call Us */}
              <div className="flex items-center gap-3">
                <div 
                  className="w-[44px] h-[44px] shrink-0 rounded-sm flex items-center justify-center text-white"
                  style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
                >
                  <Phone size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-white/85 font-semibold">Call Us</div>
                  <div className="flex flex-wrap items-center gap-2 mt-0.5">
                    <a 
                      href="tel:+2348142114452" 
                      className="text-white text-[16px] font-bold hover:underline leading-snug"
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
                </div>
              </div>
            </div>

            {/* Replaced form with two buttons side by side */}
            <div className="mt-6 pt-5 border-t border-white/15 flex flex-wrap gap-2.5">
              <a
                href="mailto:contact.hubandjobs@gmail.com"
                className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 px-3 py-2.5 bg-white text-[#1E3B8B] font-bold text-sm rounded-sm hover:bg-blue-50 transition-colors shadow-sm"
              >
                <Mail size={16} />
                <span>Email us</span>
              </a>
              <a
                href="https://wa.me/2348142114452"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 px-3 py-2.5 bg-[#E8B736] text-[#1E3B8B] font-bold text-sm rounded-sm hover:bg-amber-400 transition-colors shadow-sm"
              >
                <MessageCircle size={16} />
                <span>Chat on WhatsApp</span>
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;
