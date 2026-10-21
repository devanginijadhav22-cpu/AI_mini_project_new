import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === 'ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else if (user.profile_is_complete) {
        navigate('/student/dashboard', { replace: true });
      } else {
        navigate('/student/onboarding', { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoStudent = () => {
    setEmail('student@scholarship.gov.in');
    setPassword('student123');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#fafafa]">
      <div className="max-w-sm w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-lg bg-zinc-900 text-white flex items-center justify-center mx-auto">
            <GraduationCap className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-semibold text-zinc-950 tracking-tight">Student Sign In</h1>
          <p className="text-xs text-zinc-500">Access your eligibility score and applications</p>
        </div>

        {/* Demo Credentials Quick Button */}
        <div className="p-3 bg-white border border-zinc-200 rounded-lg text-xs flex items-center justify-between">
          <div>
            <p className="font-medium text-zinc-900">Demo Student</p>
            <p className="text-[11px] text-zinc-500 font-mono">student@scholarship.gov.in</p>
          </div>
          <button
            type="button"
            onClick={fillDemoStudent}
            className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-medium rounded transition-colors"
          >
            Auto Fill
          </button>
        </div>

        <div className="bg-white border border-zinc-200 rounded-lg p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full text-xs pl-9 pr-3 py-2 rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-zinc-700">Password</label>
                <Link to="/forgot-password" className="text-[11px] text-zinc-500 hover:text-zinc-900">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs pl-9 pr-3 py-2 rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2 px-4 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-md transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="pt-3 text-center border-t border-zinc-100 text-xs text-zinc-500 space-y-1.5">
            <p>
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-zinc-900 hover:underline">
                Register
              </Link>
            </p>
            <p>
              Authorized personnel?{' '}
              <Link to="/admin-login" className="font-medium text-zinc-700 hover:text-zinc-950">
                Administrator Login →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
