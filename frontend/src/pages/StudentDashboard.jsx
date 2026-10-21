import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { studentAPI } from '../services/api';
import MetricCard from '../components/MetricCard';
import GaugeScore from '../components/GaugeScore';
import { 
  Sparkles, 
  ArrowRight, AlertCircle, ChevronRight, Lock
} from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await studentAPI.getDashboard();
      setStats(res.data);
    } catch (err) {
      console.error("Error loading dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  const profileComplete = stats?.profile_is_complete === true;
  const profileCompletion = stats?.profile_completion || 0;
  const hasResult = stats?.latest_score !== null && stats?.latest_score !== undefined;

  const upcomingDeadlines = [
    {
      title: "Central Sector Scheme for College Students",
      provider: "Ministry of Education",
      amount: "₹20,000 / year",
      deadline: "30 Nov 2026"
    },
    {
      title: "Pragati Scholarship for Female STEM Scholars",
      provider: "AICTE",
      amount: "₹50,000 / year",
      deadline: "15 Dec 2026"
    },
    {
      title: "Reliance Foundation Undergraduate Scholarship",
      provider: "Reliance Foundation",
      amount: "₹2,00,000 total",
      deadline: "10 Jan 2027"
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-xs text-zinc-400">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-zinc-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-zinc-950 tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Overview of your eligibility status, matching schemes, and applications
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!profileComplete ? (
            <Link
              to="/student/assessment"
              className="px-3.5 py-2 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-md transition-colors flex items-center gap-1.5"
            >
              <span>Complete Profile ({profileCompletion}%)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <Link
              to="/student/assessment"
              className="px-3.5 py-2 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-md transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Run AI Verification</span>
            </Link>
          )}
          <Link
            to="/student/scholarships"
            className="px-3.5 py-2 text-xs font-medium text-zinc-700 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-md transition-colors"
          >
            Explore Schemes
          </Link>
        </div>
      </div>

      {/* Profile Incomplete Notification */}
      {!profileComplete && (
        <div className="bg-white border border-zinc-200 rounded-lg p-4 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-md bg-zinc-100 flex items-center justify-center shrink-0 mt-0.5">
              <AlertCircle className="w-4 h-4 text-zinc-600" />
            </div>
            <div>
              <h2 className="text-xs font-semibold text-zinc-900">
                Profile Incomplete ({profileCompletion}% completed)
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Complete all 4 sections (Personal, Academic, Financial, Achievements) to unlock AI verification.
              </p>
              <div className="mt-2 w-48 bg-zinc-100 rounded-full h-1.5">
                <div 
                  className="bg-zinc-900 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${profileCompletion}%` }}
                />
              </div>
            </div>
          </div>
          <Link
            to="/student/assessment"
            className="text-xs font-medium text-zinc-900 hover:underline shrink-0 self-center"
          >
            Finish now →
          </Link>
        </div>
      )}

      {/* 4 Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Profile Completion"
          value={`${profileCompletion}%`}
          subtitle={profileCompletion === 100 ? "All pillars complete" : "4-section profile"}
        />
        <MetricCard
          title="Eligible Schemes"
          value={profileComplete ? (stats?.eligible_scholarships_count || 0) : '—'}
          subtitle={profileComplete ? "Matches all criteria" : "Requires complete profile"}
        />
        <MetricCard
          title="Active Opportunities"
          value={stats?.total_active_scholarships || 8}
          subtitle="National & state schemes"
        />
        <MetricCard
          title="Applications"
          value={stats?.applications_submitted || 0}
          subtitle={`${stats?.applications_pending || 0} pending review`}
        />
      </div>

      {/* Middle Grid: Assessment Status & Matching Schemes Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: AI Assessment Result Card */}
        <div className="bg-white border border-zinc-200 rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h2 className="text-xs font-semibold text-zinc-900">Assessment Status</h2>
              <span className="text-[10px] font-mono text-zinc-400 uppercase">Dual-Engine</span>
            </div>

            <div className="py-4">
              {hasResult ? (
                <GaugeScore
                  score={Math.round(stats.latest_score)}
                  label={stats.latest_verdict || "Eligible"}
                />
              ) : (
                <div className="py-10 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <p className="text-xs text-zinc-500">
                    {profileComplete ? "Verification ready to run" : "Requires 100% profile completion"}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-100 text-xs">
            <div className="flex justify-between py-1 text-zinc-500">
              <span>ML Probability:</span>
              <span className="font-medium text-zinc-900">
                {hasResult ? `${stats.latest_probability}%` : '—'}
              </span>
            </div>
            {hasResult ? (
              <Link
                to="/student/results"
                className="mt-3 block text-center py-2 text-xs font-medium text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-md transition-colors"
              >
                View Full XAI Breakdown
              </Link>
            ) : (
              <Link
                to="/student/assessment"
                className="mt-3 block text-center py-2 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-md transition-colors"
              >
                {profileComplete ? "Run AI Verification" : "Complete Profile"}
              </Link>
            )}
          </div>
        </div>

        {/* Right: Upcoming Deadlines & Schemes */}
        <div className="bg-white border border-zinc-200 rounded-lg p-5 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div>
              <h2 className="text-xs font-semibold text-zinc-900">Featured Active Scholarships</h2>
              <p className="text-[11px] text-zinc-500">Top schemes matching national academic standards</p>
            </div>
            <Link to="/student/scholarships" className="text-xs text-zinc-600 hover:text-zinc-950 font-medium">
              View all ({stats?.total_active_scholarships || 8}) →
            </Link>
          </div>

          <div className="divide-y divide-zinc-100">
            {upcomingDeadlines.map((item, idx) => (
              <div key={idx} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-zinc-900">{item.title}</p>
                  <p className="text-[11px] text-zinc-500">{item.provider} • <span className="font-medium text-zinc-700">{item.amount}</span></p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-mono text-zinc-500 bg-zinc-50 px-2 py-0.5 rounded border border-zinc-200">
                    Deadline: {item.deadline}
                  </span>
                  <Link
                    to="/student/scholarships"
                    className="text-xs text-zinc-400 hover:text-zinc-900"
                    aria-label="View scheme"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
            <span>Deterministic checks guarantee legal compliance before application submission.</span>
            <Link to="/student/assessment" className="text-zinc-900 font-medium hover:underline shrink-0">
              Run evaluation →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
