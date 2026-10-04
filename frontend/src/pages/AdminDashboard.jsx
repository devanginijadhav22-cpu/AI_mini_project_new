import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../services/api';
import MetricCard from '../components/MetricCard';
import { 
  Users, Award, FileText, CheckCircle2, TrendingUp, 
  Cpu, BarChart3, AlertCircle, ArrowRight, ShieldCheck 
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';

const AdminDashboard = () => {
  const [dashboardStats, setDashboardStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const [statsRes, analyticsRes] = await Promise.all([
        adminAPI.getDashboard(),
        adminAPI.getAnalytics()
      ]);
      setDashboardStats(statsRes.data);
      setAnalytics(analyticsRes.data);
    } catch (err) {
      console.error("Error loading admin data", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="max-w-2xl relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-indigo-300 text-xs font-semibold border border-white/10">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>National Scholarship Administration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Central Administrative Command Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Monitor real-time applicant submissions, oversee automated rule enforcement, and track live machine learning performance metrics across 55,000+ benchmarked profiles.
          </p>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Total Registered"
          value={dashboardStats?.total_students || 0}
          subtitle="Active student accounts"
          icon={Users}
          color="blue"
        />
        <MetricCard
          title="Active Schemes"
          value={dashboardStats?.total_scholarships || 0}
          subtitle="Configured programs"
          icon={Award}
          color="emerald"
        />
        <MetricCard
          title="Applications"
          value={dashboardStats?.total_applications || 0}
          subtitle={`${dashboardStats?.pending_applications || 0} awaiting review`}
          icon={FileText}
          color="indigo"
        />
        <MetricCard
          title="Eligible Students"
          value={dashboardStats?.eligible_students_count || 0}
          subtitle="Passed statutory checks"
          icon={CheckCircle2}
          color="purple"
        />
        <MetricCard
          title="Avg Hybrid Score"
          value={`${dashboardStats?.average_eligibility_score || 0}%`}
          subtitle="Across applicant pool"
          icon={TrendingUp}
          color="amber"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Eligibility Distribution */}
        <div className="card-soft p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Student Eligibility Distribution</h3>
              <p className="text-xs text-slate-500">Breakdown of student pool by AI qualification verdict</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics?.eligibility_distribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {(analytics?.eligibility_distribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Applications by Scholarship */}
        <div className="card-soft p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Application Volume by Scheme</h3>
              <p className="text-xs text-slate-500">Top scholarship schemes by student demand</p>
            </div>
            <Link to="/admin/scholarships" className="text-xs text-brand-600 hover:underline">
              Manage Schemes
            </Link>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.applications_by_scholarship || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="title" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="applications" fill="#6366F1" radius={[6, 6, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/admin/students"
          className="card-soft p-6 space-y-3 hover:border-indigo-400 group transition"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition">
            Student Management →
          </h4>
          <p className="text-xs text-slate-500">
            Inspect verified applicant profiles, academic marks, and certificate authenticity.
          </p>
        </Link>

        <Link
          to="/admin/models"
          className="card-soft p-6 space-y-3 hover:border-indigo-400 group transition"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition">
            ML Performance & Retraining →
          </h4>
          <p className="text-xs text-slate-500">
            Audit Confusion Matrix, ROC-AUC curves (0.9895), feature importance, and trigger retrain.
          </p>
        </Link>

        <Link
          to="/admin/analytics"
          className="card-soft p-6 space-y-3 hover:border-indigo-400 group transition"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <BarChart3 className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition">
            Deep Demographic Analytics →
          </h4>
          <p className="text-xs text-slate-500">
            Examine income spread, category quotas, and geographical representation across India.
          </p>
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;
