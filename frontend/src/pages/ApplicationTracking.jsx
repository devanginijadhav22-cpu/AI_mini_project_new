import React, { useState, useEffect } from 'react';
import { applicationAPI } from '../services/api';
import { 
  FileText, Clock, CheckCircle2, XCircle, AlertCircle, 
  Award, Calendar, ArrowRight 
} from 'lucide-react';
import { Link } from 'react-router-dom';

const ApplicationTracking = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const res = await applicationAPI.getAll();
      setApplications(res.data);
    } catch (err) {
      console.error("Error loading applications", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: CheckCircle2,
          label: 'Approved & Sanctioned'
        };
      case 'UNDER_REVIEW':
        return {
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          icon: Clock,
          label: 'Under Committee Review'
        };
      case 'REJECTED':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          icon: XCircle,
          label: 'Rejected'
        };
      default:
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: Clock,
          label: 'Pending Initial Verification'
        };
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Application Tracking</h1>
          <p className="text-xs text-slate-500">Monitor official lifecycle and verification stages for your scholarship files</p>
        </div>
        <Link
          to="/student/scholarships"
          className="self-start sm:self-auto px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
        >
          Discover More Scholarships
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
        </div>
      ) : applications.length === 0 ? (
        <div className="card-soft p-12 text-center text-xs text-slate-500 space-y-3">
          <FileText className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="font-semibold text-slate-700 text-sm">No applications submitted yet.</p>
          <p>Browse recommended scholarships and click "Apply" to submit your verified profile.</p>
          <Link
            to="/student/scholarships"
            className="inline-block mt-2 px-4 py-2 text-xs font-bold text-brand-600 hover:text-brand-800 bg-brand-50 rounded-lg"
          >
            Explore Matching Scholarships →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => {
            const badge = getStatusBadge(app.status);
            const BadgeIcon = badge.icon;

            return (
              <div key={app.id} className="card-soft p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Application ID: #SCH-APP-{app.id}
                    </span>
                    <h3 className="text-base font-bold text-slate-900">{app.scholarship_title}</h3>
                    <p className="text-xs text-slate-500">{app.provider} • Grant: <strong>₹{app.amount?.toLocaleString()}</strong></p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badge.bg}`}>
                      <BadgeIcon className="w-3.5 h-3.5" />
                      <span>{badge.label}</span>
                    </span>
                  </div>
                </div>

                {/* Tracking Progress Stepper */}
                <div className="grid grid-cols-3 gap-2 text-center pt-2">
                  <div className="space-y-1">
                    <div className="h-1.5 w-full rounded-full bg-emerald-500"></div>
                    <span className="text-[10px] font-bold text-emerald-700">1. Submitted</span>
                    <p className="text-[10px] text-slate-400">{new Date(app.applied_at).toLocaleDateString()}</p>
                  </div>
                  <div className="space-y-1">
                    <div className={`h-1.5 w-full rounded-full ${
                      app.status !== 'PENDING' ? 'bg-indigo-600' : 'bg-slate-200'
                    }`}></div>
                    <span className={`text-[10px] font-bold ${
                      app.status !== 'PENDING' ? 'text-indigo-700' : 'text-slate-400'
                    }`}>
                      2. Under Review
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className={`h-1.5 w-full rounded-full ${
                      app.status === 'APPROVED' ? 'bg-emerald-500' : (app.status === 'REJECTED' ? 'bg-rose-500' : 'bg-slate-200')
                    }`}></div>
                    <span className={`text-[10px] font-bold ${
                      app.status === 'APPROVED' ? 'text-emerald-700' : (app.status === 'REJECTED' ? 'text-rose-700' : 'text-slate-400')
                    }`}>
                      3. Final Decision
                    </span>
                  </div>
                </div>

                {/* Remarks & Snapshot */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex flex-col sm:flex-row justify-between gap-2">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Verification Remarks:</span>
                    <span className="font-medium text-slate-700">{app.remarks || "Application logged in central registry. Official scrutiny in progress."}</span>
                  </div>
                  <div className="sm:text-right">
                    <span className="text-slate-500 block text-[10px]">AI Eligibility Score at Application:</span>
                    <span className="font-extrabold text-brand-600">{app.score_at_application} / 100</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ApplicationTracking;
