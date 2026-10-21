import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { BarChart3, TrendingUp, PieChart as PieIcon, Users } from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  PieChart, Pie, Cell, Legend, AreaChart, Area 
} from 'recharts';

const AnalyticsPage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await adminAPI.getAnalytics();
      setAnalytics(res.data);
    } catch (err) {
      console.error("Error loading analytics", err);
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="pb-4 border-b border-zinc-200">
        <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">System Analytics & Inclusivity Reports</h1>
        <p className="text-xs text-zinc-500 mt-0.5">Demographic breakdowns, income bands, academic spreads, and predictive distributions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Category Representation */}
        <div className="bg-white p-5 rounded-xl border border-zinc-200/80 space-y-4">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-700">Demographic & Category Representation</h3>
            <p className="text-xs text-zinc-500">Student enrollment distribution across social categories</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.category_distribution || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#71717a' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#71717a' }} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e4e4e7', fontSize: '11px' }} />
                <Bar dataKey="students" fill="#18181b" radius={[4, 4, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Income Distribution */}
        <div className="bg-white p-5 rounded-xl border border-zinc-200/80 space-y-4">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-700">Household Annual Income Brackets</h3>
            <p className="text-xs text-zinc-500">Applicant concentration across socioeconomic tiers</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics?.income_brackets || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="bracket" tick={{ fontSize: 10, fill: '#71717a' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#71717a' }} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e4e4e7', fontSize: '11px' }} />
                <Area type="monotone" dataKey="students" stroke="#18181b" fill="#f4f4f5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Academic Performance Distribution */}
        <div className="bg-white p-5 rounded-xl border border-zinc-200/80 space-y-4">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-700">Academic Merit Distribution (CGPA Tiers)</h3>
            <p className="text-xs text-zinc-500">Spread of cumulative grade points across active students</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.academic_performance_distribution || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="range" tick={{ fontSize: 10, fill: '#71717a' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#71717a' }} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e4e4e7', fontSize: '11px' }} />
                <Bar dataKey="students" fill="#3f3f46" radius={[4, 4, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Model Prediction Distribution */}
        <div className="bg-white p-5 rounded-xl border border-zinc-200/80 space-y-4">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-700">AI Confidence & Probability Bands</h3>
            <p className="text-xs text-zinc-500">Output probabilities computed by the Gradient Boosting model</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.model_prediction_distribution || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="probability" tick={{ fontSize: 10, fill: '#71717a' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#71717a' }} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e4e4e7', fontSize: '11px' }} />
                <Bar dataKey="count" fill="#71717a" radius={[4, 4, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;

