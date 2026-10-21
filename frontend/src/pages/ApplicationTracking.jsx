import React, { useState, useEffect } from 'react';
import { applicationAPI } from '../services/api';
import { 
  FileText, Clock, CheckCircle2, XCircle, AlertCircle, 
  Award, Calendar, ArrowRight, AlertTriangle, UploadCloud, 
  ExternalLink, DollarSign, ShieldCheck 
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
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          icon: CheckCircle2,
          label: 'Approved & Award Sanctioned'
        };
      case 'UNDER_REVIEW':
        return {
          bg: 'bg-blue-50 text-blue-800 border-blue-200',
          icon: Clock,
          label: 'Under Committee Review'
        };
      case 'NEEDS_INFORMATION':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          icon: AlertTriangle,
          label: 'Additional Information Required'
        };
      case 'REJECTED':
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-200',
          icon: XCircle,
          label: 'Not Approved'
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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">Application Tracking</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Real-time audit tracking, committee review lifecycle, and sanction disbursements for your scholarship applications
          </p>
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

            const isPending = app.status === 'PENDING';
            const isUnderReview = app.status === 'UNDER_REVIEW';
            const isNeedsInfo = app.status === 'NEEDS_INFORMATION';
            const isApproved = app.status === 'APPROVED';
            const isRejected = app.status === 'REJECTED';
            const isFinal = isApproved || isRejected;

            return (
              <div key={app.id} className="bg-white p-5 rounded-xl border border-zinc-200/80 space-y-4 shadow-sm">
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                      Application ID: #SCH-APP-{app.id}
                    </span>
                    <h3 className="text-sm font-semibold text-zinc-900">{app.scholarship_title}</h3>
                    <p className="text-xs text-zinc-500">
                      {app.provider} • Grant: <strong className="text-zinc-800 font-medium">₹{app.amount?.toLocaleString()}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${badge.bg}`}>
                      <BadgeIcon className="w-3.5 h-3.5" />
                      <span>{badge.label}</span>
                    </span>

                    {app.award_status === 'DISBURSED' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200">
                        <DollarSign className="w-3 h-3" />
                        <span>Disbursed</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* 4-Stage Real Administrative Review Progress Stepper */}
                <div className="grid grid-cols-4 gap-2 text-center pt-1">
                  {/* Stage 1: Submitted */}
                  <div className="space-y-1">
                    <div className="h-1.5 w-full rounded-full bg-zinc-900"></div>
                    <span className="text-[10px] font-semibold text-zinc-900 block">1. Submitted</span>
                    <p className="text-[9px] text-zinc-400">
                      {new Date(app.applied_at).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Stage 2: Under Review */}
                  <div className="space-y-1">
                    <div className={`h-1.5 w-full rounded-full ${
                      !isPending ? 'bg-zinc-900' : 'bg-zinc-200'
                    }`}></div>
                    <span className={`text-[10px] font-medium block ${
                      !isPending ? 'text-zinc-900 font-semibold' : 'text-zinc-400'
                    }`}>
                      2. Under Review
                    </span>
                    <p className="text-[9px] text-zinc-400">
                      {!isPending ? 'Scrutiny Initiated' : 'Awaiting Assignment'}
                    </p>
                  </div>

                  {/* Stage 3: Verification / Audit */}
                  <div className="space-y-1">
                    <div className={`h-1.5 w-full rounded-full ${
                      isNeedsInfo 
                        ? 'bg-amber-500' 
                        : (isFinal ? 'bg-zinc-900' : (isUnderReview ? 'bg-zinc-400 animate-pulse' : 'bg-zinc-200'))
                    }`}></div>
                    <span className={`text-[10px] font-medium block ${
                      isNeedsInfo 
                        ? 'text-amber-800 font-bold' 
                        : (isFinal ? 'text-zinc-900 font-semibold' : (isUnderReview ? 'text-zinc-700' : 'text-zinc-400'))
                    }`}>
                      {isNeedsInfo ? '3. Info Required' : '3. Verification'}
                    </span>
                    <p className="text-[9px] text-zinc-400">
                      {isNeedsInfo ? 'Action needed' : (isFinal ? 'Audit completed' : (isUnderReview ? 'In progress' : 'Pending'))}
                    </p>
                  </div>

                  {/* Stage 4: Final Decision */}
                  <div className="space-y-1">
                    <div className={`h-1.5 w-full rounded-full ${
                      isApproved 
                        ? 'bg-emerald-600' 
                        : (isRejected ? 'bg-rose-600' : 'bg-zinc-200')
                    }`}></div>
                    <span className={`text-[10px] font-medium block ${
                      isApproved 
                        ? 'text-emerald-800 font-bold' 
                        : (isRejected ? 'text-rose-700 font-bold' : 'text-zinc-400')
                    }`}>
                      4. Final Decision
                    </span>
                    <p className="text-[9px] text-zinc-400">
                      {app.reviewed_at 
                        ? new Date(app.reviewed_at).toLocaleDateString() 
                        : 'Awaiting Decision'}
                    </p>
                  </div>
                </div>

                {/* Attention Required Banner (if NEEDS_INFORMATION) */}
                {isNeedsInfo && (
                  <div className="p-4 bg-amber-50 border border-amber-200/90 rounded-xl space-y-2.5 text-xs text-amber-900">
                    <div className="flex items-center gap-2 font-semibold">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Action Required: Scrutiny Committee Request</span>
                    </div>
                    <div className="bg-white/80 p-3 rounded-lg border border-amber-200 text-amber-950 font-mono text-[11px] leading-relaxed">
                      {app.decision_remarks || app.remarks || "Please upload corrected certificates or supplementary academic documents."}
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-amber-800">
                        Please update your Document Vault or profile promptly to resume processing.
                      </span>
                      <Link
                        to="/student/profile"
                        className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white font-medium rounded-lg text-xs transition inline-flex items-center gap-1.5 shadow-sm"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Open Document Vault →</span>
                      </Link>
                    </div>
                  </div>
                )}

                {/* Approved & Disbursed Details Card */}
                {isApproved && (
                  <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-emerald-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Official Scholarship Award Confirmed
                      </span>
                      <span className="font-bold text-emerald-950 text-sm">
                        ₹{app.amount?.toLocaleString()}
                      </span>
                    </div>

                    {app.award_status === 'DISBURSED' && app.disbursed_at ? (
                      <div className="pt-2 border-t border-emerald-200/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-emerald-950">
                        <div>
                          <span className="text-emerald-700 block text-[10px] uppercase font-semibold">Disbursement Reference</span>
                          <span className="font-mono font-semibold">{app.disbursement_reference}</span>
                        </div>
                        <div>
                          <span className="text-emerald-700 block text-[10px] uppercase font-semibold">Payment Executed On</span>
                          <span>{new Date(app.disbursed_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-emerald-800 pt-1 border-t border-emerald-200/60">
                        Award sanctioned by committee. Finance department disbursement clearance is currently in queue.
                      </p>
                    )}
                  </div>
                )}

                {/* Administrative Decision Remarks & Metadata */}
                <div className="p-3.5 bg-zinc-50/80 rounded-lg border border-zinc-200/70 text-xs flex flex-col sm:flex-row justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="text-zinc-400 block text-[10px] uppercase font-medium">
                      Committee Scrutiny & Remarks
                    </span>
                    <span className="text-zinc-800 leading-relaxed block">
                      {app.decision_remarks || app.remarks || "Application registered in central repository. Official administrative verification in progress."}
                    </span>
                    {app.reviewer_name && (
                      <span className="text-[10px] text-zinc-400 block mt-1">
                        Reviewed by: <strong>{app.reviewer_name}</strong>
                      </span>
                    )}
                  </div>
                  <div className="sm:text-right shrink-0">
                    <span className="text-zinc-400 block text-[10px] uppercase font-medium">AI Eligibility Score</span>
                    <span className="font-bold text-zinc-900 text-sm">{app.score_at_application}%</span>
                    <span className="text-[10px] text-zinc-400 block mt-0.5">Category-Independent Advisory</span>
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
