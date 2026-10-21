import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../services/api';
import MetricCard from '../components/MetricCard';
import { 
  Users, FileText, 
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
        <div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Refined neutral palette for pie chart slices
  const neutralFills = ['#18181b', '#52525b', '#a1a1aa', '#e4e4e7'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-zinc-500 mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>National Administration</span>
          </div>
          <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">
            Central Administrative Command Center
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Monitor real-time applicant submissions, verify statutory criteria, and audit machine learning inference pipelines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/models"
            className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium rounded-lg transition flex items-center gap-1.5"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>ML Status</span>
          </Link>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Total Registered"
          value={dashboardStats?.total_students || 0}
          subtitle="Active student accounts"
        />
        <MetricCard
          title="Active Schemes"
          value={dashboardStats?.total_scholarships || 0}
          subtitle="Configured programs"
        />
        <Link to="/admin/applications" className="block hover:opacity-95 transition">
          <MetricCard
            title="Applications"
            value={dashboardStats?.total_applications || 0}
            subtitle={`${dashboardStats?.pending_applications || 0} awaiting review (${dashboardStats?.unique_applicants || 0} applicants)`}
          />
        </Link>
        <MetricCard
          title="Eligible Students"
          value={dashboardStats?.eligible_students_count || 0}
          subtitle="Passed statutory checks"
        />
        <MetricCard
          title="Avg Hybrid Score"
          value={`${dashboardStats?.average_eligibility_score || 0}%`}
          subtitle="Across applicant pool"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Eligibility Distribution */}
        <div className="bg-white p-5 rounded-xl border border-zinc-200/80 space-y-4">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-700">Student Eligibility Distribution</h3>
            <p className="text-xs text-zinc-500">Breakdown of student pool by AI qualification verdict</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics?.eligibility_distribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {(analytics?.eligibility_distribution || []).map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.fill || neutralFills[index % neutralFills.length]} 
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e4e4e7', fontSize: '11px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Applications by Scholarship */}
        <div className="bg-white p-5 rounded-xl border border-zinc-200/80 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-700">Application Volume by Scheme</h3>
              <p className="text-xs text-zinc-500">Top scholarship schemes by student demand</p>
            </div>
            <Link to="/admin/scholarships" className="text-xs text-zinc-700 hover:text-zinc-950 hover:underline">
              Manage Schemes →
            </Link>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.applications_by_scholarship || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="title" tick={{ fontSize: 10, fill: '#71717a' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#71717a' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e4e4e7', fontSize: '11px' }}
                />
                <Bar dataKey="applications" fill="#18181b" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link
          to="/admin/applications"
          className="bg-white p-5 rounded-xl border border-zinc-200/80 space-y-2.5 hover:border-zinc-300 transition"
        >
          <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-700 flex items-center justify-center border border-zinc-200">
            <FileText className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-semibold text-zinc-900 flex items-center gap-1">
            Application Review →
          </h4>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Audit applicant files, verify statutory certificates, approve grants, and disburse awards.
          </p>
        </Link>
        <Link
          to="/admin/students"
          className="bg-white p-5 rounded-xl border border-zinc-200/80 space-y-2.5 hover:border-zinc-300 transition"
        >
          <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-700 flex items-center justify-center border border-zinc-200">
            <Users className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-semibold text-zinc-900 flex items-center gap-1">
            Student Management →
          </h4>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Inspect verified applicant profiles, academic marks, and certificate authenticity in the central roster.
          </p>
        </Link>

        <Link
          to="/admin/models"
          className="bg-white p-5 rounded-xl border border-zinc-200/80 space-y-2.5 hover:border-zinc-300 transition"
        >
          <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-700 flex items-center justify-center border border-zinc-200">
            <Cpu className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-semibold text-zinc-900 flex items-center gap-1">
            ML Performance & Retraining →
          </h4>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Audit Confusion Matrix, ROC-AUC metrics (0.9895), feature importance, and trigger automated retraining.
          </p>
        </Link>

        <Link
          to="/admin/analytics"
          className="bg-white p-5 rounded-xl border border-zinc-200/80 space-y-2.5 hover:border-zinc-300 transition"
        >
          <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-700 flex items-center justify-center border border-zinc-200">
            <BarChart3 className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-semibold text-zinc-900 flex items-center gap-1">
            Demographic Analytics →
          </h4>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Examine income spread, category quotas, and geographical representation across regional applicant cohorts.
          </p>
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;

