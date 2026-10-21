import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { user } = useAuth();
  if (!user) return null;

  const studentLinks = [
    { to: '/student/dashboard', label: 'Dashboard' },
    ...(!user.profile_is_complete ? [{ to: '/student/onboarding', label: 'Eligibility Wizard' }] : []),
    { to: '/student/results', label: 'AI Evaluation' },
    { to: '/student/scholarships', label: 'Recommendations' },
    { to: '/student/applications', label: 'Applications' },
    { to: '/student/profile', label: 'Profile & Documents' },
    { to: '/student/notifications', label: 'Notifications' },
    { to: '/settings', label: 'Settings' },
  ];

  const adminLinks = [
    { to: '/admin/dashboard', label: 'Overview' },
    { to: '/admin/applications', label: 'Applications' },
    { to: '/admin/students', label: 'Students' },
    { to: '/admin/scholarships', label: 'Scholarship Schemes' },
    { to: '/admin/analytics', label: 'Analytics' },
    { to: '/admin/models', label: 'Model Health & XAI' },
    { to: '/settings', label: 'Settings' },
  ];

  const links = user.role === 'ADMIN' ? adminLinks : studentLinks;

  return (
    <aside className="w-60 bg-white border-r border-zinc-200 hidden lg:flex flex-col py-5 px-3 min-h-[calc(100vh-4rem)] select-none">
      <div className="space-y-6">
        {/* Workspace Identity Profile Card */}
        <div className="px-3.5 py-3 rounded-xl bg-zinc-50/90 border border-zinc-200/70 shadow-[0_1px_2px_rgba(0,0,0,0.03)] text-left">
          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">
            {user.role === 'ADMIN' ? 'Administrator' : 'Student Portal'}
          </p>
          <p className="text-sm font-semibold text-zinc-900 mt-1 leading-snug break-words">
            {user.full_name}
          </p>
        </div>

        {/* Navigation Section */}
        <div>
          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest px-3 mb-2">
            Navigation
          </p>
          <nav className="space-y-1" aria-label="Sidebar navigation">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => `
                  group relative flex items-center px-3.5 py-2.5 rounded-lg text-xs leading-5 transition-all duration-150 outline-none
                  focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-1
                  ${isActive 
                    ? 'bg-zinc-100 text-zinc-950 font-semibold' 
                    : 'text-zinc-600 font-medium hover:text-zinc-950 hover:bg-zinc-50'
                  }
                `}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span 
                        aria-hidden="true" 
                        className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r bg-zinc-900" 
                      />
                    )}
                    <span className="truncate">{link.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
