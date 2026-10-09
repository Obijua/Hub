import { useState, useEffect } from 'react';
import { Post } from '../types';
import { 
  Plus, 
  LayoutDashboard, 
  LogOut, 
  TrendingUp, 
  Users, 
  FileText, 
  CheckCircle2, 
  ArrowRight,
  Eye,
  Calendar,
  Briefcase,
  BarChart3,
  UserPlus,
  Settings,
  DollarSign,
  Star,
  Tag
} from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { auth, db } from '../lib/firebase';
import { getAdminPosts, getSubscribersCount, getRecentSubscribers } from '../lib/posts';
import { cn } from '../lib/utils';
import { Subscriber, MonetizationConfig } from '../types';
import { doc, getDoc, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

export const AdminDashboard = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [recentSubscribers, setRecentSubscribers] = useState<Subscriber[]>([]);
  const [monetizationConfig, setMonetizationConfig] = useState<MonetizationConfig | null>(null);
  const [documentStats, setDocumentStats] = useState({
    totalCount: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    todayRevenue: 0,
    mostPopular: 'N/A',
    promoCodesUsed: 0,
    recentPayments: [] as any[]
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fetchedPosts, count, subscribers, monetDoc, paymentsSnap] = await Promise.all([
        getAdminPosts(),
        getSubscribersCount(),
        getRecentSubscribers(5),
        getDoc(doc(db, 'settings', 'monetization')),
        getDocs(query(collection(db, 'document_payments'), orderBy('paidAt', 'desc'), limit(10)))
      ]);
      setPosts(fetchedPosts);
      setSubscriberCount(count);
      setRecentSubscribers(subscribers);
      if (monetDoc.exists()) {
        setMonetizationConfig(monetDoc.data() as MonetizationConfig);
      }

      // Process document payments
      const payments = paymentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const totalRevenue = payments.reduce((acc: number, p: any) => acc + (p.amount || 0), 0);
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      const thisMonth = payments.filter((p: any) => {
        const date = p.paidAt?.toDate();
        return date && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      });
      
      const todayPayments = payments.filter((p: any) => {
        const date = p.paidAt?.toDate();
        return date && date >= today;
      });

      const monthlyRevenue = thisMonth.reduce((acc: number, p: any) => acc + (p.amount || 0), 0);
      const todayRevenue = todayPayments.reduce((acc: number, p: any) => acc + (p.amount || 0), 0);

      // Find most popular document type
      const typeCounts: Record<string, number> = {};
      payments.forEach((p: any) => {
        typeCounts[p.documentType] = (typeCounts[p.documentType] || 0) + 1;
      });
      const mostPopular = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

      const promoCodesUsed = payments.filter((p: any) => p.promoCode).length;

      setDocumentStats({
        totalCount: payments.length,
        totalRevenue,
        monthlyRevenue,
        todayRevenue,
        mostPopular,
        promoCodesUsed,
        recentPayments: payments
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const stats = [
    { label: 'Total Posts', value: posts.length, icon: FileText, color: 'bg-blue-500' },
    { label: 'Active Posts', value: posts.filter(p => p.isActive).length, icon: CheckCircle2, color: 'bg-green-500' },
    { label: 'Total Views', value: posts.reduce((acc, p) => acc + (p.views || 0), 0), icon: TrendingUp, color: 'bg-purple-500' },
    { label: 'Subscribers', value: subscriberCount, icon: Users, color: 'bg-orange-500' },
    { label: 'Total Purchases', value: documentStats.totalCount, icon: FileText, color: 'bg-indigo-500' },
    { label: 'Doc Revenue', value: `₦${documentStats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'bg-green-600' },
    { label: 'Revenue Today', value: `₦${documentStats.todayRevenue.toLocaleString()}`, icon: TrendingUp, color: 'bg-blue-600' },
    { label: 'Most Popular', value: documentStats.mostPopular, icon: Star, color: 'bg-purple-600' },
    { label: 'Promo Used', value: documentStats.promoCodesUsed, icon: Tag, color: 'bg-pink-600' },
  ];

  const chartData = [...posts]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 5)
    .map(p => ({
      name: p.title.length > 20 ? p.title.substring(0, 20) + '...' : p.title,
      views: p.views || 0,
    }));

  const COLORS = ['#1E3A8A', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] dark:bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 dark:bg-gray-950 transition-colors duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 space-y-6 md:space-y-0">
        <div className="flex items-center space-x-4">
          <div className="p-4 bg-primary text-white rounded-2xl shadow-xl shadow-primary/20">
            <LayoutDashboard className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Admin Dashboard</h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium">Welcome back, Admin</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <Link
            to="/admin/settings"
            className="flex items-center px-6 py-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-700 dark:text-white font-black rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all shadow-sm"
          >
            <Settings className="mr-2 h-5 w-5" /> Settings
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center px-6 py-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-700 dark:text-white font-black rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all shadow-sm"
          >
            <LogOut className="mr-2 h-5 w-5" /> Logout
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {stats.map((stat) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all"
          >
            <div className={cn("inline-flex p-4 rounded-2xl text-white mb-6 shadow-lg", stat.color)}>
              <stat.icon className="h-6 w-6" />
            </div>
            <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-2">{stat.label}</p>
            <h3 className="text-4xl font-black text-gray-900 dark:text-white">{stat.value.toLocaleString()}</h3>
          </motion.div>
        ))}
      </div>

      {/* Analytics & Subscribers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Most Viewed Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-primary rounded-lg">
                <BarChart3 className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white">Most Viewed Posts</h3>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#9CA3AF' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#9CA3AF' }}
                />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    backgroundColor: '#1E3A8A',
                    color: '#fff'
                  }}
                  itemStyle={{ color: '#fff', fontWeight: 700 }}
                  labelStyle={{ display: 'none' }}
                />
                <Bar dataKey="views" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Subscribers */}
        <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center space-x-3 mb-8">
            <div className="p-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 rounded-lg">
              <UserPlus className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white">Recent Subscribers</h3>
          </div>
          <div className="space-y-6">
            {recentSubscribers.length > 0 ? (
              recentSubscribers.map((sub) => (
                <div key={sub.id} className="flex items-center space-x-4">
                  <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-primary font-black text-xs">
                    {sub.email.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{sub.email}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                      {format(sub.subscribedAt.toDate(), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-400 text-sm font-medium">No subscribers yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Ad Monetization Overview */}
        <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center space-x-3 mb-8">
            <div className="p-2 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-lg">
              <DollarSign className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white">Ad Monetization</h3>
          </div>
          
          <div className="space-y-6">
            {monetizationConfig ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Master Switch</span>
                      <div className={cn(
                        "h-2 w-2 rounded-full",
                        monetizationConfig.masterSwitch ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-gray-300"
                      )} />
                    </div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">
                      {monetizationConfig.masterSwitch ? 'Active' : 'Disabled'}
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Homepage Ads</span>
                      <div className={cn(
                        "h-2 w-2 rounded-full",
                        monetizationConfig.homepageAdsEnabled ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-gray-300"
                      )} />
                    </div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">
                      {monetizationConfig.homepageAdsEnabled ? 'Active' : 'Disabled'}
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Article Ads</span>
                      <div className={cn(
                        "h-2 w-2 rounded-full",
                        monetizationConfig.articleAdsEnabled ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-gray-300"
                      )} />
                    </div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">
                      {monetizationConfig.articleAdsEnabled ? 'Active' : 'Disabled'}
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Blog Ads</span>
                      <div className={cn(
                        "h-2 w-2 rounded-full",
                        monetizationConfig.blogAdsEnabled ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-gray-300"
                      )} />
                    </div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">
                      {monetizationConfig.blogAdsEnabled ? 'Active' : 'Disabled'}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Quick Links</h4>
                  <div className="flex flex-wrap gap-2">
                    <a href="https://adsense.google.com" target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-primary rounded-lg text-[10px] font-bold hover:bg-primary hover:text-white transition-all">AdSense</a>
                    <a href="https://adsterra.com" target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-primary rounded-lg text-[10px] font-bold hover:bg-primary hover:text-white transition-all">Adsterra</a>
                    <a href="https://monetag.com" target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-primary rounded-lg text-[10px] font-bold hover:bg-primary hover:text-white transition-all">Monetag</a>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
                  <p className="text-[10px] text-primary font-bold leading-relaxed">
                    Tip: Check your ad network dashboards for real-time RPM and earnings data.
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-400 text-sm font-medium">Monetization not configured</p>
                <Link to="/admin/settings" className="text-primary text-xs font-bold hover:underline mt-2 inline-block">Configure Now</Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Link 
          to="/admin/posts/new"
          className="group bg-primary p-8 rounded-3xl text-white flex items-center justify-between hover:bg-blue-900 transition-all shadow-xl shadow-primary/20"
        >
          <div className="flex items-center space-x-6">
            <div className="p-4 bg-white/10 rounded-2xl">
              <Plus className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-2xl font-black">Add New Post</h3>
              <p className="text-blue-100 font-medium text-sm">Create opportunity</p>
            </div>
          </div>
          <ArrowRight className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-all translate-x-[-20px] group-hover:translate-x-0" />
        </Link>
        <Link 
          to="/admin/posts"
          className="group bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 flex items-center justify-between hover:shadow-xl transition-all shadow-sm"
        >
          <div className="flex items-center space-x-6">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl text-primary">
              <FileText className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white">Manage Posts</h3>
              <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">Edit listings</p>
            </div>
          </div>
          <ArrowRight className="h-8 w-8 text-primary opacity-0 group-hover:opacity-100 transition-all translate-x-[-20px] group-hover:translate-x-0" />
        </Link>
        <Link 
          to="/admin/settings"
          onClick={() => localStorage.setItem('admin_settings_tab', 'documents')}
          className="group bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 flex items-center justify-between hover:shadow-xl transition-all shadow-sm"
        >
          <div className="flex items-center space-x-6">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl text-primary">
              <FileText className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white">Manage Docs</h3>
              <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">Prices & Settings</p>
            </div>
          </div>
          <ArrowRight className="h-8 w-8 text-primary opacity-0 group-hover:opacity-100 transition-all translate-x-[-20px] group-hover:translate-x-0" />
        </Link>
        <Link 
          to="/admin/settings"
          className="group bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 flex items-center justify-between hover:shadow-xl transition-all shadow-sm"
        >
          <div className="flex items-center space-x-6">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl text-primary">
              <Settings className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white">Site Settings</h3>
              <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">Configure platform</p>
            </div>
          </div>
          <ArrowRight className="h-8 w-8 text-primary opacity-0 group-hover:opacity-100 transition-all translate-x-[-20px] group-hover:translate-x-0" />
        </Link>
      </div>

      {/* Recent Posts Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white">Recent Posts</h2>
            <Link to="/admin/posts" className="text-primary font-black text-sm hover:underline flex items-center">
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                <tr>
                  <th className="px-8 py-5">Opportunity</th>
                  <th className="px-8 py-5">Views</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {posts.slice(0, 5).map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 rounded-xl bg-gray-100 dark:bg-gray-800 overflow-hidden flex-shrink-0">
                          {post.thumbnail ? (
                            <img src={post.thumbnail} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-gray-300 dark:text-gray-600">
                              <Briefcase className="h-6 w-6" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-900 dark:text-white line-clamp-1">{post.title}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center text-sm font-bold text-gray-500 dark:text-gray-400">
                        {post.views || 0}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <Link
                        to={`/admin/posts/edit/${post.id}`}
                        className="inline-flex p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                      >
                        <FileText className="h-5 w-5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white">Document Sales</h2>
            <div className="text-xs font-black text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full uppercase tracking-widest">
              +₦{documentStats.monthlyRevenue.toLocaleString()} this month
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                <tr>
                  <th className="px-8 py-5">Email</th>
                  <th className="px-8 py-5">Type</th>
                  <th className="px-8 py-5">Amount</th>
                  <th className="px-8 py-5 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {documentStats.recentPayments.map((payment: any) => (
                  <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="px-8 py-6">
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[150px]">{payment.email}</p>
                    </td>
                    <td className="px-8 py-6">
                      <span className="bg-amber-50 dark:bg-amber-900/20 text-amber-600 text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-widest">
                        {payment.documentType}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-sm font-black text-gray-900 dark:text-white">₦{payment.amount.toLocaleString()}</p>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        {payment.paidAt ? format(payment.paidAt.toDate(), 'MMM dd, HH:mm') : 'N/A'}
                      </p>
                    </td>
                  </tr>
                ))}
                {documentStats.recentPayments.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-8 py-12 text-center text-gray-400 text-sm font-medium">
                      No document sales yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
