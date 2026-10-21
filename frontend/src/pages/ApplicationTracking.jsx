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
          bg: 'bg-zinc-100 text-zinc-900 border-zinc-300',
          icon: CheckCircle2,
          label: 'Approved & Sanctioned'
        };
      case 'UNDER_REVIEW':
        return {
          bg: 'bg-zinc-100 text-zinc-800 border-zinc-200',
          icon: Clock,
          label: 'Under Committee Review'
        };
      case 'REJECTED':
        return {
          bg: 'bg-zinc-100 text-zinc-600 border-zinc-200',
          icon: XCircle,
          label: 'Rejected'
        };
      default:
        return {
          bg: 'bg-zinc-100 text-zinc-700 border-zinc-200',
          icon: Clock,
          label: 'Pending Initial Verification'
        };
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">Application Tracking</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Monitor review lifecycle and verification stages for your scholarship files</p>
        </div>
        <Link
          to="/student/scholarships"
          className="self-start sm:self-auto px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium rounded-lg transition"
        >
          Discover More Scholarships
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin"></div>
        </div>
      ) : applications.length === 0 ? (
        <div className="bg-white p-12 text-center text-xs text-zinc-500 space-y-3 rounded-xl border border-zinc-200/80">
          <FileText className="w-8 h-8 text-zinc-300 mx-auto" />
          <p className="font-medium text-zinc-800 text-sm">No applications submitted yet.</p>
          <p>Browse recommended scholarships and click "Apply" to submit your verified profile.</p>
          <Link
            to="/student/scholarships"
            className="inline-block mt-2 px-3.5 py-1.5 text-xs font-medium text-zinc-800 hover:text-zinc-950 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition border border-zinc-200"
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
              <div key={app.id} className="bg-white p-5 rounded-xl border border-zinc-200/80 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                      Application ID: #SCH-APP-{app.id}
                    </span>
                    <h3 className="text-sm font-semibold text-zinc-900">{app.scholarship_title}</h3>
                    <p className="text-xs text-zinc-500">{app.provider} • Grant: <strong className="text-zinc-800 font-medium">₹{app.amount?.toLocaleString()}</strong></p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${badge.bg}`}>
                      <BadgeIcon className="w-3.5 h-3.5" />
                      <span>{badge.label}</span>
                    </span>
                  </div>
                </div>

                {/* Tracking Progress Stepper */}
                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div className="space-y-1">
                    <div className="h-1 w-full rounded-full bg-zinc-900"></div>
                    <span className="text-[10px] font-medium text-zinc-900">1. Submitted</span>
                    <p className="text-[10px] text-zinc-400">{new Date(app.applied_at).toLocaleDateString()}</p>
                  </div>
                  <div className="space-y-1">
                    <div className={`h-1 w-full rounded-full ${
                      app.status !== 'PENDING' ? 'bg-zinc-900' : 'bg-zinc-200'
                    }`}></div>
                    <span className={`text-[10px] font-medium ${
                      app.status !== 'PENDING' ? 'text-zinc-900' : 'text-zinc-400'
                    }`}>
                      2. Under Review
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className={`h-1 w-full rounded-full ${
                      app.status === 'APPROVED' ? 'bg-zinc-900' : (app.status === 'REJECTED' ? 'bg-rose-600' : 'bg-zinc-200')
                    }`}></div>
                    <span className={`text-[10px] font-medium ${
                      app.status === 'APPROVED' ? 'text-zinc-900' : (app.status === 'REJECTED' ? 'text-rose-700' : 'text-zinc-400')
                    }`}>
                      3. Final Decision
                    </span>
                  </div>
                </div>

                {/* Remarks & Snapshot */}
                <div className="p-3 bg-zinc-50/60 rounded-lg border border-zinc-200/70 text-xs flex flex-col sm:flex-row justify-between gap-2">
                  <div>
                    <span className="text-zinc-400 block text-[10px] uppercase font-medium">Verification Remarks</span>
                    <span className="text-zinc-700">{app.remarks || "Application logged in central registry. Official scrutiny in progress."}</span>
                  </div>
                  <div className="sm:text-right">
                    <span className="text-zinc-400 block text-[10px] uppercase font-medium">Score at Application</span>
                    <span className="font-semibold text-zinc-900">{app.score_at_application} / 100</span>
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

