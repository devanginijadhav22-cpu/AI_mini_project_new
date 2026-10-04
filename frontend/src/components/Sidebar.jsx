import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, Sparkles, Award, FileText, UserCheck, 
  Bell, Users, Settings, BarChart3, Cpu, CheckCircle
} from 'lucide-react';

const Sidebar = () => {
  const { user } = useAuth();
  if (!user) return null;

  const studentLinks = [
    { to: '/student/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/student/assessment', icon: Sparkles, label: 'Check Eligibility', highlight: true },
    { to: '/student/results', icon: CheckCircle, label: 'AI Eligibility Result' },
    { to: '/student/scholarships', icon: Award, label: 'Recommendations' },
    { to: '/student/applications', icon: FileText, label: 'Application Tracking' },
    { to: '/student/profile', icon: UserCheck, label: 'Profile & Documents' },
    { to: '/student/notifications', icon: Bell, label: 'Notifications' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  const adminLinks = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Admin Dashboard' },
    { to: '/admin/students', icon: Users, label: 'Student Management' },
    { to: '/admin/scholarships', icon: Award, label: 'Scholarship Schemes' },
    { to: '/admin/analytics', icon: BarChart3, label: 'System Analytics' },
    { to: '/admin/models', icon: Cpu, label: 'ML Performance & XAI' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  const links = user.role === 'ADMIN' ? adminLinks : studentLinks;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 hidden lg:flex flex-col justify-between py-6 px-4 min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        {/* Role Badge Card */}
        <div className="px-3 py-3 rounded-xl bg-slate-50 border border-slate-200/80">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Workspace</p>
          <p className="text-xs font-semibold text-slate-800 mt-0.5 truncate">{user.full_name}</p>
          <div className="flex items-center gap-1.5 mt-2">
            <span className={`w-2 h-2 rounded-full ${user.role === 'ADMIN' ? 'bg-indigo-600' : 'bg-emerald-500'}`}></span>
            <span className="text-[11px] font-medium text-slate-600">
              {user.role === 'ADMIN' ? 'Administrator' : 'Student Portal'}
            </span>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">Main Navigation</p>
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => `
                  flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all
                  ${isActive 
                    ? 'bg-brand-50 text-brand-700 font-semibold border-l-4 border-brand-600 shadow-sm' 
                    : link.highlight
                      ? 'text-brand-700 bg-brand-50/50 hover:bg-brand-50 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }
                `}
              >
                <Icon className={`w-4 h-4 ${link.highlight ? 'text-brand-600' : ''}`} />
                <span>{link.label}</span>
                {link.highlight && (
                  <span className="ml-auto text-[9px] uppercase tracking-wider bg-brand-100 text-brand-800 font-bold px-1.5 py-0.5 rounded">
                    AI
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Bottom Info Card */}
      <div className="p-3.5 rounded-xl bg-gradient-to-br from-slate-50 to-brand-50/40 border border-slate-200 text-center">
        <p className="text-[11px] font-semibold text-slate-800">AI Model Status</p>
        <div className="flex items-center justify-center gap-1 text-[10px] text-emerald-600 font-medium mt-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Gradient Boosting Active</span>
        </div>
        <p className="text-[10px] text-slate-500 mt-1">ROC-AUC: 0.9895 | 55k Dataset</p>
      </div>
    </aside>
  );
};

export default Sidebar;
