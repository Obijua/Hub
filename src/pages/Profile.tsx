import { useAuth } from '../components/AuthProvider';
import { User, Briefcase, FileText, ChevronRight, LogOut, Settings, Bell, Shield, HelpCircle } from 'lucide-react';
import { auth } from '../lib/firebase';
import { Link } from 'react-router-dom';

export const Profile = () => {
  const { user, profile } = useAuth();

  const stats = [
    { label: 'APPS', value: '0', color: 'bg-emerald-50 text-emerald-600' },
    { label: 'INTERVIEWS', value: '0', color: 'bg-emerald-50 text-emerald-600' },
    { label: 'CV %', value: '0%', color: 'bg-emerald-50 text-emerald-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white px-6 pt-10 pb-6 rounded-b-[3rem] shadow-sm">
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-24 h-24 bg-emerald-500 rounded-2xl flex items-center justify-center text-white text-4xl font-bold">
              {user?.email?.substring(0, 1).toUpperCase() || <User size={48} />}
            </div>
            <button className="absolute bottom-[-8px] right-[-8px] w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center border border-gray-100">
              <Settings size={16} className="text-gray-400" />
            </button>
          </div>
          <h2 className="mt-4 text-xl font-bold text-gray-900">{profile?.fullName || (user?.email?.split('@')[0]) || 'User'}</h2>
          <span className="mt-1 px-3 py-1 bg-gray-100 text-gray-400 text-[10px] font-black uppercase tracking-widest rounded-lg">
            Free Account
          </span>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center shadow-sm">
              <span className="text-[10px] font-bold text-gray-400">{stat.label}</span>
              <span className="text-xl font-black text-emerald-500 mt-1">{stat.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 mt-8 space-y-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">My Applications</h3>
          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm flex flex-col items-center text-center">
            <div className="text-gray-200 mb-4">
              <Briefcase size={48} />
            </div>
            <p className="text-gray-400 text-sm mb-4 font-medium">No applications yet. Start exploring!</p>
            <Link to="/jobs" className="text-emerald-500 font-bold text-sm flex items-center hover:bg-emerald-50 px-4 py-2 rounded-lg transition-colors">
              GO TO JOBS <ChevronRight size={16} className="ml-1" />
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center justify-between group cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500">
              <FileText size={24} />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">Build Your CV</h4>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Boost your hiring chance</p>
            </div>
          </div>
          <ChevronRight className="text-gray-300 group-hover:text-emerald-500 transition-colors" />
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest px-1">Settings</h3>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50 overflow-hidden">
            <MenuItem icon={<Bell size={20} />} label="Notifications" />
            <MenuItem icon={<Shield size={20} />} label="Privacy & Security" />
            <MenuItem icon={<HelpCircle size={20} />} label="Help Center" />
            <button 
              onClick={() => auth.signOut()}
              className="w-full flex items-center justify-between p-4 bg-red-50/50 hover:bg-red-50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="text-red-500">
                  <LogOut size={20} />
                </div>
                <span className="font-bold text-red-600">Logout</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const MenuItem = ({ icon, label }: { icon: React.ReactNode, label: string }) => (
  <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group">
    <div className="flex items-center gap-3">
      <div className="text-gray-400 group-hover:text-emerald-500 transition-colors">
        {icon}
      </div>
      <span className="font-bold text-gray-700">{label}</span>
    </div>
    <ChevronRight size={18} className="text-gray-300" />
  </button>
);
