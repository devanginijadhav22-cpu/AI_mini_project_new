import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { Settings, Lock, CheckCircle2, AlertCircle, Shield, Sliders } from 'lucide-react';

const SettingsPage = () => {
  const { user, logout } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Expert System Weights (Display & configuration)
  const [mlWeight, setMlWeight] = useState(55);
  const [ruleWeight, setRuleWeight] = useState(45);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError(null);
    setMsg(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      await authAPI.forgotPassword({
        email: user.email,
        new_password: newPassword
      });
      setMsg("Password successfully updated.");
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="pb-4 border-b border-zinc-200">
        <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">System & Account Settings</h1>
        <p className="text-xs text-zinc-500 mt-0.5">Security preferences, credentials, and expert engine weight parameters</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Account Info */}
        <div className="bg-white p-5 rounded-xl border border-zinc-200/80 space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-700 flex items-center gap-2 pb-2 border-b border-zinc-100">
            <Shield className="w-4 h-4 text-zinc-500" />
            Account Overview
          </h3>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-zinc-100">
              <span className="text-zinc-500">Full Name</span>
              <span className="font-medium text-zinc-900">{user?.full_name}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-zinc-100">
              <span className="text-zinc-500">Email Address</span>
              <span className="font-mono text-zinc-700">{user?.email}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-zinc-100">
              <span className="text-zinc-500">Account Role</span>
              <span className="font-medium text-zinc-900">{user?.role}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-zinc-100">
              <span className="text-zinc-500">Session Status</span>
              <span className="text-zinc-700 font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Active (JWT Protected)
              </span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={logout}
              className="w-full py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-medium text-xs rounded-lg transition border border-zinc-200"
            >
              Log Out of Workspace
            </button>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white p-5 rounded-xl border border-zinc-200/80 space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-700 flex items-center gap-2 pb-2 border-b border-zinc-100">
            <Lock className="w-4 h-4 text-zinc-500" />
            Change Password
          </h3>

          {msg && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{msg}</span>
            </div>
          )}

          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-xs text-rose-700 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-3 text-xs">
            <div>
              <label className="block text-zinc-600 font-medium mb-1">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-lg bg-zinc-50/30 focus:outline-none focus:border-zinc-400"
              />
            </div>

            <div>
              <label className="block text-zinc-600 font-medium mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-lg bg-zinc-50/30 focus:outline-none focus:border-zinc-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Updating Password...' : 'Save New Password'}
            </button>
          </form>
        </div>
      </div>

      {/* Hybrid Expert System Weights Breakdown */}
      <div className="bg-white p-5 rounded-xl border border-zinc-200/80 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
          <Sliders className="w-4 h-4 text-zinc-500" />
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-700">Hybrid Expert System Weight Calibration</h3>
            <p className="text-xs text-zinc-500">Mathematical weighting used to compute student Hybrid Eligibility Scores</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-zinc-50/60 rounded-lg border border-zinc-200/70 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="font-medium text-zinc-900">Machine Learning Model Weight</span>
              <span className="font-semibold text-zinc-900">{mlWeight}%</span>
            </div>
            <p className="text-zinc-500 text-[11px] leading-relaxed">
              Assesses multidimensional pattern suitability across 79 features (demographics, per capita income, attendance regularity, academic merit).
            </p>
          </div>

          <div className="p-4 bg-zinc-50/60 rounded-lg border border-zinc-200/70 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="font-medium text-zinc-900">Statutory Rule Engine Weight</span>
              <span className="font-semibold text-zinc-900">{ruleWeight}%</span>
            </div>
            <p className="text-zinc-500 text-[11px] leading-relaxed">
              Validates hard statutory non-negotiable clauses (income ceiling limits, maximum backlogs allowed, minimum attendance threshold).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

