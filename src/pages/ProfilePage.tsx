import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthProvider';
import { 
  User, 
  Briefcase, 
  FileText, 
  ChevronRight, 
  LogOut, 
  Settings, 
  Bell, 
  Shield, 
  HelpCircle, 
  CheckCircle2, 
  Award 
} from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';

export const ProfilePage = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<any[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);

  useEffect(() => {
    const fetchApplications = async () => {
      if (!auth.currentUser) {
        setLoadingApps(false);
        return;
      }
      try {
        const q = query(collection(db, 'applications'), where('userId', '==', auth.currentUser.uid));
        const snap = await getDocs(q);
        const apps = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setApplications(apps);
      } catch (e) {
        console.error("Error fetching applications:", e);
      } finally {
        setLoadingApps(false);
      }
    };
    fetchApplications();
  }, []);

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      navigate('/');
    } catch (e) {
      console.error(e);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'review':
        return <span className="bg-yellow-50 text-yellow-700 text-xs px-2 py-0.5 rounded-sm font-medium">Review</span>;
      case 'interview':
        return <span className="bg-purple-50 text-purple-600 text-xs px-2 py-0.5 rounded-sm font-medium">Interview</span>;
      case 'decided':
        return <span className="bg-blue-50 text-[#1E3B8B] text-xs px-2 py-0.5 rounded-sm font-medium">Decided</span>;
      default:
        return <span className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-sm font-medium">Applied</span>;
    }
  };

  const interviewCount = applications.filter(a => a.status === 'interview').length;
  const cvScore = user ? '85%' : '0%';

  return (
    <div className="min-h-screen bg-[#EEF2FF] px-4 pt-4 pb-24 space-y-4">
      {/* Profile Header Section */}
      <div className="bg-white shadow-sm rounded-sm p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 bg-[#1E3B8B] rounded-sm flex items-center justify-center text-white text-2xl font-bold shrink-0">
            {profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : <User size={32} />)}
          </div>
          <div>
            <h2 className="font-bold text-lg text-slate-900">{profile?.fullName || user?.email?.split('@')[0] || 'Job Seeker'}</h2>
            <p className="text-sm text-slate-500">{user?.email || 'guest@hubandjobs.com'}</p>
          </div>
        </div>
        <button className="border border-[#1E3B8B] text-[#1E3B8B] text-sm font-medium px-4 py-1.5 rounded-sm hover:bg-blue-50 transition-colors">
          Edit Profile
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white shadow-sm rounded-sm p-3 text-center">
          <p className="text-xl font-bold text-slate-900">{applications.length}</p>
          <p className="text-xs text-slate-400 uppercase tracking-wide mt-0.5">Applications</p>
        </div>
        <div className="bg-white shadow-sm rounded-sm p-3 text-center">
          <p className="text-xl font-bold text-slate-900">{interviewCount}</p>
          <p className="text-xs text-slate-400 uppercase tracking-wide mt-0.5">Interviews</p>
        </div>
        <div className="bg-white shadow-sm rounded-sm p-3 text-center">
          <p className="text-xl font-bold text-slate-900">{cvScore}</p>
          <p className="text-xs text-slate-400 uppercase tracking-wide mt-0.5">CV Score</p>
        </div>
      </div>

      {/* My Applications Section */}
      <div>
        <h3 className="font-semibold text-slate-900 mb-3 text-base">My Applications</h3>
        {loadingApps ? (
          <div className="space-y-2">
            {[1, 2].map(n => (
              <div key={n} className="bg-white shadow-sm rounded-sm p-3 h-20 animate-pulse" />
            ))}
          </div>
        ) : applications.length === 0 ? (
          <div className="bg-white shadow-sm rounded-sm p-6 text-center">
            <Briefcase size={36} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm text-slate-500 font-medium mb-3">No applications submitted yet.</p>
            <Link to="/jobs" className="inline-block bg-[#1E3B8B] text-white text-xs font-semibold px-4 py-2 rounded-sm shadow-sm hover:bg-[#162d6e]">
              Explore Jobs
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {applications.map((app) => (
              <div key={app.id} className="bg-white shadow-sm rounded-sm p-3 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-sm text-slate-900 line-clamp-1">{app.postTitle}</h4>
                  <p className="text-xs text-slate-500 line-clamp-1">{app.company || 'Company'}</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {app.createdAt?.toDate ? new Date(app.createdAt.toDate()).toLocaleDateString() : 'Recently'}
                  </span>
                </div>
                <div>
                  {getStatusBadge(app.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Links Section */}
      <div className="bg-white shadow-sm rounded-sm overflow-hidden divide-y divide-slate-100">
        <Link to="/documents/cv" className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
          <div className="flex items-center gap-3">
            <FileText size={20} className="text-[#1E3B8B]" />
            <span className="text-sm font-medium text-slate-800">CV Builder</span>
          </div>
          <ChevronRight size={18} className="text-slate-400" />
        </Link>
        <Link to="/documents" className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
          <div className="flex items-center gap-3">
            <Award size={20} className="text-[#1E3B8B]" />
            <span className="text-sm font-medium text-slate-800">ATS Score Checker</span>
          </div>
          <ChevronRight size={18} className="text-slate-400" />
        </Link>
        <div className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer">
          <div className="flex items-center gap-3">
            <Settings size={20} className="text-[#1E3B8B]" />
            <span className="text-sm font-medium text-slate-800">Settings</span>
          </div>
          <ChevronRight size={18} className="text-slate-400" />
        </div>
      </div>

      {/* Sign Out Button */}
      <div className="pt-2 pb-4 text-center">
        <button 
          onClick={handleSignOut}
          className="text-red-500 font-medium text-sm hover:underline py-2 px-4 inline-block"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
