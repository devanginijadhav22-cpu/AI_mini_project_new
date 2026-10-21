import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, LogOut, ShieldCheck } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-zinc-200">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Left: Branding */}
          <Link 
            to={user ? (user.role === 'ADMIN' ? '/admin/dashboard' : '/student/dashboard') : '/login'} 
            className="flex items-center space-x-2.5 group shrink-0"
          >
            <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-white shrink-0">
              <GraduationCap className="w-4 h-4" />
            </div>
            <span className="text-sm sm:text-base font-semibold text-zinc-950 tracking-tight">
              ScholarAI
            </span>
          </Link>

          {/* Right: Account Section */}
          <div className="flex items-center space-x-3 sm:space-x-4 shrink-0">
            {user ? (
              <div className="flex items-center space-x-2.5 sm:space-x-3">
                <div className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-800 flex items-center justify-center font-medium text-xs border border-zinc-200 shrink-0">
                  {user.full_name?.charAt(0) || 'U'}
                </div>
                <div className="text-left flex flex-col justify-center">
                  <span className="text-xs font-semibold text-zinc-900 leading-tight">
                    {user.full_name}
                  </span>
                  <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider leading-none mt-0.5">
                    {user.role}
                  </span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors ml-1 shrink-0"
                  title="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-xs font-medium text-zinc-700 hover:text-zinc-950 rounded-md hover:bg-zinc-100 transition-colors"
                >
                  Student Login
                </Link>
                <Link
                  to="/admin-login"
                  className="px-2.5 py-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-800 rounded-md hover:bg-zinc-100 transition-colors flex items-center gap-1"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Admin
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-md transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
