import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { studentAPI } from '../services/api';
import MetricCard from '../components/MetricCard';
import GaugeScore from '../components/GaugeScore';
import { 
  Sparkles, Award, FileText, CheckCircle2, Clock, 
  ArrowRight, AlertCircle, TrendingUp, Calendar, ChevronRight,
  UserCircle2, Lock
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';

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

  const statusData = [
    { name: 'Approved', value: stats?.applications_approved || 0, fill: '#10B981' },
    { name: 'Pending Review', value: stats?.applications_pending || 0, fill: '#F59E0B' },
    { name: 'Available', value: stats?.eligible_scholarships_count || 0, fill: '#0c87eb' }
  ];

  const categoryDistribution = [
    { category: 'Merit-cum-Means', count: 3 },
    { category: 'STEM & Technical', count: 2 },
    { category: 'Special Affirmative', count: 2 },
    { category: 'Need-Based', count: 1 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500">Loading student dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-brand-700 via-brand-600 to-indigo-700 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="max-w-2xl relative z-10 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-white text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Driven Eligibility Assessment</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome{user?.full_name ? `, ${user.full_name}` : ''}!
          </h1>
          
          {!profileComplete ? (
            <p className="text-xs sm:text-sm text-brand-100 leading-relaxed">
              Complete your 5-step profile to unlock AI eligibility verification and discover scholarships you qualify for.
            </p>
          ) : (
            <p className="text-xs sm:text-sm text-brand-100 leading-relaxed">
              Your profile is complete. You can now run AI eligibility verification to discover matching scholarships.
            </p>
          )}

          <div className="pt-2 flex flex-wrap items-center gap-3">
            {!profileComplete ? (
              <Link
                to="/student/assessment"
                className="px-5 py-2.5 bg-white text-brand-800 hover:bg-brand-50 text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2"
              >
                <UserCircle2 className="w-4 h-4 text-brand-600" />
                <span>Complete My Profile ({profileCompletion}%)</span>
              </Link>
            ) : (
              <Link
                to="/student/assessment"
                className="px-5 py-2.5 bg-white text-brand-800 hover:bg-brand-50 text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-brand-600" />
                <span>Run AI Eligibility Verification</span>
              </Link>
            )}
            <Link
              to="/student/scholarships"
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
            >
              <span>View Scholarships</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Decorative circle */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-white/5 pointer-events-none"></div>
      </div>

      {/* Profile Incomplete Banner — only shown when profile is not complete */}
      {!profileComplete && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-amber-900">Profile Status: Incomplete ({profileCompletion}% complete)</h3>
            <p className="text-xs text-amber-700 mt-1">
              Complete your profile to unlock AI eligibility verification. The AI assessment button will be enabled once your profile reaches 100%.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 bg-amber-200 rounded-full h-2">
                <div 
                  className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${profileCompletion}%` }}
                />
              </div>
              <span className="text-xs font-bold text-amber-800">{profileCompletion}%</span>
            </div>
            <Link
              to="/student/assessment"
              className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-amber-700 hover:text-amber-900 underline"
            >
              Complete Profile Now <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* 4 Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Profile Completion"
          value={`${profileCompletion}%`}
          subtitle={profileCompletion < 100 ? "Complete your 5-step profile" : "All sections verified"}
          icon={CheckCircle2}
          color="emerald"
        />
        <MetricCard
          title="Eligible Scholarships"
          value={profileComplete ? (stats?.eligible_scholarships_count || 0) : '—'}
          subtitle={profileComplete ? "Meets all strict criteria" : "Complete profile to check"}
          icon={Award}
          color="blue"
        />
        <MetricCard
          title="Potential Schemes"
          value={profileComplete ? (stats?.potential_scholarships_count || 0) : '—'}
          subtitle={profileComplete ? "Minor criteria adjustment" : "Complete profile to check"}
          icon={TrendingUp}
          color="amber"
        />
        <MetricCard
          title="Applications Tracked"
          value={stats?.applications_submitted || 0}
          subtitle={`${stats?.applications_pending || 0} pending authority review`}
          icon={FileText}
          color="purple"
        />
      </div>

      {/* Middle Section: Hybrid Score Gauge & Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Hybrid Score Card */}
        <div className="card-soft p-6 flex flex-col justify-between items-center text-center">
          <div className="w-full text-left">
            <h3 className="text-sm font-bold text-slate-900">Current Eligibility Score</h3>
            <p className="text-xs text-slate-500">Dual-Engine synthesis (ML + Symbolic Rules)</p>
          </div>

          <div className="my-4 w-full">
            {hasResult ? (
              <GaugeScore
                score={Math.round(stats.latest_score)}
                label={stats.latest_verdict || "Eligible"}
              />
            ) : (
              <div className="flex flex-col items-center gap-3 py-6">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                  <Lock className="w-7 h-7 text-slate-400" />
                </div>
                <p className="text-xs text-slate-500 text-center">
                  {profileComplete 
                    ? "Run AI verification to see your score" 
                    : "Complete your profile to unlock AI verification"
                  }
                </p>
              </div>
            )}
          </div>

          <div className="w-full pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">ML Confidence:</span>
            <span className="font-bold text-brand-600">
              {hasResult ? `${stats.latest_probability}%` : '—'}
            </span>
          </div>
          {hasResult ? (
            <Link
              to="/student/results"
              className="w-full mt-3 py-2 text-xs font-semibold text-brand-600 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 rounded-lg transition"
            >
              View Full Explainable AI Report →
            </Link>
          ) : (
            <Link
              to="/student/assessment"
              className="w-full mt-3 py-2 text-xs font-semibold text-amber-600 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg transition"
            >
              {profileComplete ? "Run AI Verification →" : "Complete Profile First →"}
            </Link>
          )}
        </div>

        {/* Center: Category Distribution Chart */}
        <div className="card-soft p-6 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Available Scholarships by Category</h3>
              <p className="text-xs text-slate-500">Distribution across active state & national funds</p>
            </div>
            <span className="text-[11px] font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200">
              {stats?.total_active_scholarships || 8} Active Schemes
            </span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#0c87eb" radius={[6, 6, 0, 0]} barSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Upcoming Deadlines & Action Prompts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-soft p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-600" />
              <h3 className="text-sm font-bold text-slate-900">Upcoming Scholarship Deadlines</h3>
            </div>
            <Link to="/student/scholarships" className="text-xs text-brand-600 hover:underline">
              View all
            </Link>
          </div>

          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900">Central Sector Scheme for College Students</p>
                <p className="text-[11px] text-slate-500">Ministry of Education • ₹20,000 / year</p>
              </div>
              <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                30 Nov 2026
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900">Pragati Scholarship for Female STEM Scholars</p>
                <p className="text-[11px] text-slate-500">AICTE • ₹50,000 / year</p>
              </div>
              <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                15 Dec 2026
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900">Reliance Foundation Undergraduate Scholarship</p>
                <p className="text-[11px] text-slate-500">Reliance Foundation • ₹2,00,000 total</p>
              </div>
              <span className="text-[11px] font-semibold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-200">
                10 Jan 2027
              </span>
            </div>
          </div>
        </div>

        {/* Application Status Visualizer */}
        <div className="card-soft p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Application Pipeline Status</h3>
          <p className="text-xs text-slate-500">Current progress of your submitted scholarship files</p>

          <div className="h-52 w-full flex items-center justify-center">
            {(stats?.applications_submitted || 0) > 0 || (stats?.eligible_scholarships_count || 0) > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                  <FileText className="w-6 h-6 text-slate-300" />
                </div>
                <p className="text-xs text-slate-400">No applications yet</p>
                {profileComplete && (
                  <Link
                    to="/student/scholarships"
                    className="text-xs text-brand-600 hover:underline"
                  >
                    Browse Scholarships →
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
