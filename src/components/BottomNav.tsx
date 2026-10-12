import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, FileText, User } from 'lucide-react';
import { cn } from '../lib/utils';

export const BottomNav = () => {
  const location = useLocation();

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'CV Builder', path: '/documents/cv', icon: FileText },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] px-4 py-2">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          
          return (
            <Link 
              key={item.name} 
              to={item.path}
              className="flex flex-col items-center gap-0.5 py-1 px-3 group"
            >
              <Icon className={cn("h-5 w-5", isActive ? "text-[#1E3B8B]" : "text-slate-400")} />
              <span className={cn(
                "text-[10px] font-medium uppercase tracking-wide",
                isActive ? "text-[#1E3B8B] font-semibold" : "text-slate-400"
              )}>
                {item.name}
              </span>
              {isActive && (
                <div className="w-1 h-1 rounded-sm mt-0.5" style={{ backgroundColor: '#E8B736' }} />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
