import React from 'react';
import { motion } from 'motion/react';
import { 
  Target, 
  Users, 
  Award, 
  Globe, 
  CheckCircle2, 
  Mail, 
  MapPin, 
  Phone,
  Briefcase,
  Sparkles,
  ShieldCheck,
  TrendingUp
} from 'lucide-react';
import { SEO } from '../components/SEO';

export const About = () => {
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
      color: 'bg-blue-100 text-blue-600'
    },
    {
      title: 'Innovation',
      description: 'Constantly evolving our platform to better serve job seekers and professionals worldwide.',
      icon: Sparkles,
      color: 'bg-amber-100 text-amber-600'
    },
    {
      title: 'Empowerment',
      description: 'Giving you the tools and resources needed to take control of your professional journey.',
      icon: TrendingUp,
      color: 'bg-green-100 text-green-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <SEO 
        title="About Us - Hub & Jobs" 
        description="Learn more about Hub & Jobs, our mission to connect professionals with global opportunities, and the values that drive us."
      />

      {/* Hero Section */}
      <section className="relative py-20 bg-primary overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-accent rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-400 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
              Connecting Ambition <br />
              <span className="text-accent">With Opportunity</span>
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
              Hub & Jobs is a premier platform dedicated to bridging the gap between talented professionals 
              and world-class opportunities across the globe.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 -mt-10 relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 text-center"
              >
                <div className="inline-flex p-3 rounded-xl bg-gray-50 dark:bg-gray-800 text-primary dark:text-accent mb-4">
                  <stat.icon size={24} />
                </div>
                <div className="text-3xl font-black text-gray-900 dark:text-white mb-1">{stat.value}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-sm font-bold mb-6">
                <Target size={16} />
                Our Mission
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-6 leading-tight">
                Empowering the next generation of global professionals.
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                We started Hub & Jobs with a simple goal: to make professional opportunities accessible to everyone, 
                regardless of their location. We believe that talent is universal, but opportunity is not. 
                Our platform is designed to level the playing field.
              </p>
              <ul className="space-y-4">
                {[
                  'Curated high-quality job listings',
                  'Professional document building tools',
                  'Career guidance and resources',
                  'Global community support'
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-gray-700 dark:text-gray-300 font-medium">
                    <CheckCircle2 className="text-green-500" size={20} />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80" 
                  alt="Team collaboration" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 bg-accent p-8 rounded-3xl shadow-xl hidden md:block">
                <div className="text-primary font-black text-2xl mb-1">Founded in 2023</div>
                <div className="text-primary/70 font-bold">Growing every day</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-4">
              Our Core Values
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              The principles that guide everything we do at Hub & Jobs.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-8 rounded-3xl border border-gray-100 dark:border-gray-800 hover:shadow-xl transition-all duration-300"
              >
                <div className={`w-14 h-14 rounded-2xl ${value.color} flex items-center justify-center mb-6`}>
                  <value.icon size={28} />
                </div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-4">{value.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-primary rounded-[2.5rem] p-8 md:p-16 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="grid lg:grid-cols-2 gap-12 relative z-10">
              <div>
                <h2 className="text-3xl md:text-4xl font-black text-white mb-6">
                  Get in Touch
                </h2>
                <p className="text-blue-100 mb-8 text-lg">
                  Have questions or want to partner with us? We'd love to hear from you.
                </p>
                
                <div className="space-y-6">
                  <div className="flex items-center gap-4 text-white">
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                      <Mail size={20} />
                    </div>
                    <div>
                      <div className="text-sm text-blue-200 font-bold">Email Us</div>
                      <div className="font-black">contact@hubandjobs.com</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-white">
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <div className="text-sm text-blue-200 font-bold">Visit Us</div>
                      <div className="font-black">Global Remote Team</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-white">
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                      <Phone size={20} />
                    </div>
                    <div>
                      <div className="text-sm text-blue-200 font-bold">Call Us</div>
                      <div className="font-black">+1 (555) 123-4567</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-2xl">
                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">First Name</label>
                      <input type="text" className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-none focus:ring-2 focus:ring-accent outline-none" placeholder="John" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Last Name</label>
                      <input type="text" className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-none focus:ring-2 focus:ring-accent outline-none" placeholder="Doe" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                    <input type="email" className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-none focus:ring-2 focus:ring-accent outline-none" placeholder="john@example.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Message</label>
                    <textarea rows={4} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-none focus:ring-2 focus:ring-accent outline-none resize-none" placeholder="How can we help?"></textarea>
                  </div>
                  <button className="w-full py-4 bg-primary text-white font-black rounded-xl hover:bg-blue-800 transition-colors shadow-lg shadow-primary/20">
                    Send Message
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
