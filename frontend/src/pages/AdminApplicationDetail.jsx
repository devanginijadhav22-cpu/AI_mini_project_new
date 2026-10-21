import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminAPI, documentAPI } from '../services/api';
import {
  FileText, CheckCircle2, Clock, XCircle, AlertCircle,
  Download, UserCheck, ShieldCheck, Award, DollarSign,
  RefreshCw, X, FileCheck, ArrowLeft, AlertTriangle,
  Check
} from 'lucide-react';

const AdminApplicationDetail = () => {
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [appDetail, setAppDetail] = useState(null);

  // Administrative decision states
  const [actionRemarks, setActionRemarks] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Disbursement state
  const [showDisburseModal, setShowDisburseModal] = useState(false);
  const [disburseRef, setDisburseRef] = useState('');
  const [disburseNotes, setDisburseNotes] = useState('');
  const [disbursing, setDisbursing] = useState(false);

  // Document inline verification
  const [editingDocId, setEditingDocId] = useState(null);
  const [docRemarks, setDocRemarks] = useState('');

  const fetchApplicationDetail = useCallback(async () => {
    if (!id || isNaN(parseInt(id, 10))) {
      setError(`Invalid Application ID specified: "${id}".`);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await adminAPI.getApplicationDetail(id);
      setAppDetail(res.data);
      if (res.data?.application?.decision_remarks) {
        setActionRemarks(res.data.application.decision_remarks);
      }
    } catch (err) {
      console.error("Failed to fetch application dossier:", err);
      const msg = err.response?.data?.detail || "Application record could not be retrieved from the server.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchApplicationDetail();
  }, [fetchApplicationDetail]);


  const handleStatusTransition = async (newStatus) => {
    if (['APPROVED', 'REJECTED', 'NEEDS_INFORMATION'].includes(newStatus)) {
      if (!actionRemarks || !actionRemarks.trim()) {
        const fieldName = newStatus === 'APPROVED' 
          ? 'Approval justification remarks' 
          : (newStatus === 'REJECTED' ? 'Rejection rationale' : 'Information request instructions');
        setActionError(`${fieldName} are required before proceeding.`);
        return;
      }
    }

    try {
      setSubmittingAction(true);
      setActionError('');
      setActionSuccess('');
      await adminAPI.updateApplicationStatus(id, {
        status: newStatus,
        remarks: actionRemarks.trim() || undefined
      });

      setActionSuccess(`Application status successfully updated to ${newStatus}.`);
      await fetchApplicationDetail();
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to update application decision status.";
      setActionError(msg);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleUpdateDocStatus = async (docId, newStatus) => {
    try {
      await adminAPI.updateDocumentStatus(docId, {
        verification_status: newStatus,
        admin_remarks: docRemarks.trim() || undefined
      });
      await fetchApplicationDetail();
      setEditingDocId(null);
      setDocRemarks('');
    } catch (err) {
      console.error("Failed to update document status:", err);
      alert("Failed to update certificate verification status.");
    }
  };

  const handleDownloadDoc = async (docId, filename) => {
    try {
      const res = await documentAPI.download(docId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename || `doc_${docId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Failed to download document:", err);
      alert("Failed to securely download document. Ensure you have authorized administrative credentials.");
    }
  };

  const handleDisbursement = async (e) => {
    e.preventDefault();
    if (!disburseRef.trim()) {
      alert("Disbursement transaction / DBT reference number is mandatory.");
      return;
    }

    try {
      setDisbursing(true);
      await adminAPI.disburseAward(id, {
        disbursement_reference: disburseRef.trim(),
        disbursement_notes: disburseNotes.trim() || undefined
      });
      setShowDisburseModal(false);
      setDisburseRef('');
      setDisburseNotes('');
      await fetchApplicationDetail();
      setActionSuccess("Grant disbursement recorded and audit trail created.");
    } catch (err) {
      alert(err.response?.data?.detail || "Disbursement recording failed.");
    } finally {
      setDisbursing(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          icon: CheckCircle2,
          label: 'Approved'
        };
      case 'UNDER_REVIEW':
        return {
          bg: 'bg-blue-50 text-blue-800 border-blue-200',
          icon: Clock,
          label: 'Under Review'
        };
      case 'NEEDS_INFORMATION':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          icon: AlertCircle,
          label: 'Needs Information'
        };
      case 'REJECTED':
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-200',
          icon: XCircle,
          label: 'Rejected'
        };
      default:
        return {
          bg: 'bg-zinc-100 text-zinc-700 border-zinc-200',
          icon: Clock,
          label: 'Pending Scrutiny'
        };
    }
  };

  const getAwardBadge = (awardStatus) => {
    switch (awardStatus) {
      case 'DISBURSED':
        return {
          bg: 'bg-purple-50 text-purple-800 border-purple-200',
          label: 'Disbursed'
        };
      case 'AWARDED':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          label: 'Award Sanctioned'
        };
      default:
        return null;
    }
  };

  // Safe formatting helpers
  const formatCurrency = (val) => {
    if (val === null || val === undefined || isNaN(Number(val))) return 'N/A';
    return `₹${Number(val).toLocaleString()}`;
  };

  const formatDate = (val) => {
    if (!val) return 'N/A';
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return 'N/A';
      return d.toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  const formatDateTime = (val) => {
    if (!val) return 'N/A';
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return 'N/A';
      return d.toLocaleString();
    } catch {
      return 'N/A';
    }
  };

  const getFactorLabel = (f) => {
    if (!f) return '';
    if (typeof f === 'string') return f;
    return f.factor || f.description || JSON.stringify(f);
  };

  const getFactorImpact = (f) => {
    if (!f || typeof f === 'string') return null;
    return f.impact || null;
  };

  const getFactorDesc = (f) => {
    if (!f || typeof f === 'string') return null;
    return f.description || null;
  };

  // --- RENDER STATES ---

  // Loading State
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-7 h-7 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin"></div>
        <p className="text-xs text-zinc-500 font-medium">Loading applicant dossier #{id} from secure registry...</p>
      </div>
    );
  }

  // Error State
  if (error || !appDetail) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="bg-white border border-rose-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4 text-center">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto border border-rose-100">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-zinc-900">Application Not Found or Inaccessible</h2>
            <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
              {error || `We could not locate application dossier #${id}. It may have been archived or the ID is incorrect.`}
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Link
              to="/admin/applications"
              className="px-4 py-2 bg-zinc-900 text-white text-xs font-medium rounded-lg hover:bg-zinc-800 transition inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Applications</span>
            </Link>
            <button
              onClick={fetchApplicationDetail}
              className="px-4 py-2 bg-zinc-100 text-zinc-700 text-xs font-medium rounded-lg hover:bg-zinc-200 transition inline-flex items-center gap-1.5 border border-zinc-200"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Destructure application and student data safely
  const application = appDetail.application || {};
  const student = appDetail.student || {};
  const profile = student.profile || {};
  const academics = student.academics || {};
  const financials = student.financials || {};
  const achievements = student.achievements || {};
  const scholarship = appDetail.scholarship || {};
  const criteria = appDetail.criteria_evaluation || {};
  const assessment = appDetail.eligibility_assessment || {};
  const documents = appDetail.documents || [];

  const statusBadge = getStatusBadge(application.status);
  const StatusIcon = statusBadge.icon;
  const awardBadge = getAwardBadge(application.award_status);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Breadcrumb & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200">
        <div className="flex items-center gap-2">
          <Link
            to="/admin/applications"
            className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition inline-flex items-center gap-1 text-xs font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Applications List</span>
          </Link>
          <span className="text-zinc-300">/</span>
          <span className="text-xs font-mono font-medium text-zinc-500">
            Dossier #SCH-APP-{application.id}
          </span>
        </div>

        <button
          onClick={fetchApplicationDetail}
          className="self-start sm:self-auto px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-medium rounded-lg transition flex items-center gap-1.5 border border-zinc-200"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Dossier</span>
        </button>
      </div>

      {/* Main Dossier Header Banner */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 border border-zinc-200">
                #SCH-APP-{application.id}
              </span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium border ${statusBadge.bg}`}>
                <StatusIcon className="w-3.5 h-3.5" />
                <span>{statusBadge.label}</span>
              </span>
              {awardBadge && (
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium border ${awardBadge.bg}`}>
                  <Award className="w-3.5 h-3.5" />
                  <span>{awardBadge.label}</span>
                </span>
              )}
            </div>

            <h1 className="text-lg sm:text-xl font-bold text-zinc-900 tracking-tight mt-1">
              {scholarship.title || application.scholarship_title || 'Scholarship Scheme'}
            </h1>
            <p className="text-xs text-zinc-500">
              Offered by <strong className="text-zinc-700">{scholarship.provider || application.provider || 'Statutory Authority'}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-zinc-50 p-3.5 rounded-xl border border-zinc-200/60 text-xs">
            <div>
              <span className="text-[10px] uppercase font-semibold text-zinc-400 block">Sanctioned Grant</span>
              <span className="text-base font-bold text-zinc-900">
                {formatCurrency(scholarship.amount || application.amount)}
              </span>
            </div>
            <div className="h-8 w-px bg-zinc-200"></div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-zinc-400 block">Submitted On</span>
              <span className="font-medium text-zinc-800">
                {formatDate(application.applied_at)}
              </span>
            </div>
            <div className="h-8 w-px bg-zinc-200"></div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-zinc-400 block">AI/Hybrid Score</span>
              <span className="font-bold text-zinc-900">
                {application.score_at_application != null ? `${application.score_at_application}%` : 'N/A'}
              </span>
            </div>
            <div className="h-8 w-px bg-zinc-200"></div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-zinc-400 block">Scholarship Match</span>
              <span className="font-bold text-emerald-700">
                {application.match_score != null ? `${application.match_score}%` : (scholarship.match_percentage != null ? `${scholarship.match_percentage}%` : 'N/A')}
              </span>
            </div>
          </div>
        </div>

        {/* Applicant Identity Card */}
        <div className="pt-3 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-zinc-900 text-white flex items-center justify-center font-semibold text-sm">
              {(student.full_name || application.student_name || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="font-semibold text-zinc-900">
                {student.full_name || application.student_name || 'Anonymous Student'}
              </div>
              <div className="text-[11px] text-zinc-500 flex items-center gap-2">
                <span>{student.email || application.student_email || 'No email provided'}</span>
                {profile.phone && (
                  <>
                    <span>•</span>
                    <span>{profile.phone}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-zinc-400">Student ID: #{student.id || application.student_id}</span>
            <span className="bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded font-medium border border-zinc-200">
              Profile Completion: {student.profile_completion ?? 100}%
            </span>
          </div>
        </div>
      </div>

      {/* Decision Alerts */}
      {actionError && (
        <div className="p-3.5 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="p-3.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Grid: 2 Columns on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Sections 1, 2, 3, 4 */}
        <div className="lg:col-span-2 space-y-6">
          {/* SECTION 1: Verified Student Profile Record */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h2 className="font-semibold text-zinc-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-zinc-700" />
                <span>1. Verified Student Profile Record</span>
              </h2>
              <span className="text-[11px] font-medium text-zinc-500">
                Institutional Data Vault
              </span>
            </div>

            {/* Metrics 4-grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/70">
                <span className="text-[10px] uppercase font-semibold text-zinc-400 block">Academic CGPA</span>
                <span className="text-base font-bold text-zinc-900 mt-0.5 block">
                  {academics.cgpa != null ? `${Number(academics.cgpa).toFixed(2)} / 10.0` : 'N/A'}
                </span>
                <span className="text-[10px] text-zinc-500">
                  {academics.percentage != null ? `${academics.percentage}% marks` : ''}
                </span>
              </div>

              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/70">
                <span className="text-[10px] uppercase font-semibold text-zinc-400 block">Family Annual Income</span>
                <span className="text-base font-bold text-zinc-900 mt-0.5 block">
                  {formatCurrency(financials.family_income)}
                </span>
                <span className="text-[10px] text-zinc-500">
                  {financials.parent_occupation || 'Household income'}
                </span>
              </div>

              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/70">
                <span className="text-[10px] uppercase font-semibold text-zinc-400 block">Institutional Attendance</span>
                <span className="text-base font-bold text-zinc-900 mt-0.5 block">
                  {academics.attendance != null ? `${academics.attendance}%` : 'N/A'}
                </span>
                <span className="text-[10px] text-zinc-500">Verified biometric</span>
              </div>

              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/70">
                <span className="text-[10px] uppercase font-semibold text-zinc-400 block">Active Backlogs</span>
                <span className="text-base font-bold text-zinc-900 mt-0.5 block">
                  {academics.backlogs != null ? academics.backlogs : '0'}
                </span>
                <span className="text-[10px] text-zinc-500">
                  {academics.backlogs === 0 ? 'Clear record' : 'Pending backlogs'}
                </span>
              </div>
            </div>

            {/* Profile Detail Specs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-2 border-t border-zinc-100">
              <div>
                <span className="text-zinc-400 block text-[10px] uppercase font-medium">Course & Year</span>
                <span className="font-medium text-zinc-800">
                  {academics.course || 'Not specified'} (Year {academics.year_of_study || 1})
                </span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[10px] uppercase font-medium">Education Level</span>
                <span className="font-medium text-zinc-800">
                  {academics.education_level || 'Undergraduate'}
                </span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[10px] uppercase font-medium">Institution & State</span>
                <span className="font-medium text-zinc-800">
                  {profile.institution_type || 'Accredited'} • {profile.state || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[10px] uppercase font-medium">Category (If Provided)</span>
                <span className="font-medium text-zinc-800">
                  {profile.category || 'General / Unspecified'}
                </span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[10px] uppercase font-medium">First Generation Learner</span>
                <span className="font-medium text-zinc-800">
                  {profile.first_generation ? 'Yes (Social Equity Eligible)' : 'No'}
                </span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[10px] uppercase font-medium">Achievements & Honors</span>
                <span className="font-medium text-zinc-800">
                  {achievements.academic_achievement && achievements.academic_achievement !== 'None' 
                    ? achievements.academic_achievement 
                    : (achievements.sports_achievement && achievements.sports_achievement !== 'None' ? achievements.sports_achievement : 'Standard Academic Record')}
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 2: General AI/Hybrid Eligibility Assessment */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-100 gap-2">
              <div>
                <h2 className="font-semibold text-zinc-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-zinc-700" />
                  <span>2. General AI/Hybrid Eligibility Assessment</span>
                </h2>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  General institutional qualification (Rules 45% + Gradient Boosting 55%) assessed at application time. Independent of specific scheme criteria.
                </p>
              </div>

              <div className="text-left sm:text-right bg-zinc-50 sm:bg-transparent p-2 sm:p-0 rounded-lg">
                <span className="text-[10px] font-semibold text-zinc-400 uppercase block">General AI/Hybrid Score</span>
                <span className="text-lg font-bold text-zinc-900">
                  {assessment.hybrid_score != null ? `${assessment.hybrid_score}%` : (application.score_at_application != null ? `${application.score_at_application}%` : 'N/A')}
                </span>
              </div>
            </div>

            {/* Score 3-card breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/70">
                <span className="text-[10px] uppercase font-semibold text-zinc-400 block">Deterministic Rule Engine</span>
                <span className={`font-bold text-xs mt-0.5 block ${
                  assessment.rule_status === 'ELIGIBLE' ? 'text-emerald-700' : 'text-amber-700'
                }`}>
                  Status: {assessment.rule_status || 'EVALUATED'}
                </span>
                <p className="text-[10px] text-zinc-500 mt-1">
                  Evaluated against merit and need baseline thresholds without protected demographic bias.
                </p>
              </div>

              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/70">
                <span className="text-[10px] uppercase font-semibold text-zinc-400 block">Gradient Boosting Propensity</span>
                <span className="font-bold text-zinc-900 text-xs mt-0.5 block">
                  Probability: {assessment.ml_probability != null ? `${(Number(assessment.ml_probability) * 100).toFixed(1)}%` : 'N/A'}
                </span>
                <p className="text-[10px] text-zinc-500 mt-1">
                  Empirical award probability trained on 24 merit and socioeconomic features.
                </p>
              </div>

              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/70">
                <span className="text-[10px] uppercase font-semibold text-zinc-400 block">Advisory Verdict</span>
                <span className="font-bold text-zinc-900 text-xs mt-0.5 block">
                  {assessment.final_verdict || 'Evaluation Complete'}
                </span>
                <p className="text-[10px] text-zinc-500 mt-1">
                  Objective recommendation designed to assist—not replace—committee discretion.
                </p>
              </div>
            </div>

            {/* Explanatory Factors */}
            {Array.isArray(assessment.positive_factors) && assessment.positive_factors.length > 0 && (
              <div className="pt-2 border-t border-zinc-100 space-y-2">
                <span className="text-[10px] uppercase font-semibold text-emerald-800 block">
                  Key Positive Merit & Financial Factors
                </span>
                <div className="space-y-1.5">
                  {assessment.positive_factors.map((f, idx) => {
                    const label = getFactorLabel(f);
                    const impact = getFactorImpact(f);
                    const desc = getFactorDesc(f);
                    return (
                      <div key={idx} className="p-2 bg-emerald-50/60 rounded-lg border border-emerald-200/70 text-[11px] flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-emerald-900">{label}</span>
                            {impact && (
                              <span className="text-[9px] px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-medium">
                                {impact}
                              </span>
                            )}
                          </div>
                          {desc && desc !== label && (
                            <p className="text-[10px] text-emerald-800/80 mt-0.5">{desc}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Negative Factors if any */}
            {Array.isArray(assessment.negative_factors) && assessment.negative_factors.length > 0 && (
              <div className="pt-2 border-t border-zinc-100 space-y-2">
                <span className="text-[10px] uppercase font-semibold text-rose-800 block">
                  Discrepancy / Risk Factors Identified
                </span>
                <div className="space-y-1.5">
                  {assessment.negative_factors.map((f, idx) => {
                    const label = getFactorLabel(f);
                    const desc = getFactorDesc(f);
                    return (
                      <div key={idx} className="p-2 bg-rose-50/60 rounded-lg border border-rose-200/70 text-[11px] flex items-start gap-2">
                        <X className="w-3.5 h-3.5 text-rose-700 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <span className="font-semibold text-rose-900">{label}</span>
                          {desc && desc !== label && (
                            <p className="text-[10px] text-rose-800/80 mt-0.5">{desc}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: Scheme Published Criteria Scrutiny */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-100 gap-2">
              <div>
                <h2 className="font-semibold text-zinc-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-zinc-700" />
                  <span>3. Scheme Published Criteria Scrutiny</span>
                </h2>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  Audit against published eligibility rules for {scholarship.title || 'this scholarship'}.
                </p>
              </div>

              <span className={`px-2.5 py-1 rounded text-xs font-semibold border self-start sm:self-auto ${
                criteria.all_criteria_met 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}>
                {criteria.all_criteria_met ? '✓ All Scheme Criteria Met' : '⚠ Discrepancy / Incomplete Criteria'}
              </span>
            </div>

            {/* Scholarship Match Fit Card */}
            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-semibold text-zinc-500 block">
                  Scholarship Match Fit Score
                </span>
                <p className="text-[11px] text-zinc-600">
                  Weighted compatibility: ML Propensity (35%) + Academic Fit (35%) + Financial Need (20%) + Statutory Requirement (10%). Mandatory scheme criteria below must also be met.
                </p>
              </div>
              <div className="shrink-0 text-left sm:text-right">
                <span className="text-base font-bold text-emerald-700">
                  {application.match_score != null ? `${application.match_score}%` : (scholarship.match_percentage != null ? `${scholarship.match_percentage}%` : 'N/A')}
                </span>
                <span className="block text-[10px] text-zinc-400">Scholarship Match</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className={`p-2.5 rounded-xl border ${
                criteria.cgpa?.met ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/50 border-rose-200'
              }`}>
                <span className="text-zinc-500 block text-[10px] uppercase font-medium">Min CGPA</span>
                <span className="font-bold text-zinc-900 mt-0.5 block">
                  Req: {criteria.cgpa?.required ?? 'None'} • Act: {criteria.cgpa?.actual ?? 'N/A'}
                </span>
                <span className={`block text-[10px] font-semibold mt-1 ${criteria.cgpa?.met ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {criteria.cgpa?.met ? '✓ Satisfied' : '✕ Below Cutoff'}
                </span>
              </div>

              <div className={`p-2.5 rounded-xl border ${
                criteria.income?.met ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/50 border-rose-200'
              }`}>
                <span className="text-zinc-500 block text-[10px] uppercase font-medium">Income Ceiling</span>
                <span className="font-bold text-zinc-900 mt-0.5 block">
                  Max: {formatCurrency(criteria.income?.required_max)}
                </span>
                <span className={`block text-[10px] font-semibold mt-1 ${criteria.income?.met ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {criteria.income?.met ? '✓ Within Limit' : '✕ Exceeds Income'}
                </span>
              </div>

              <div className={`p-2.5 rounded-xl border ${
                criteria.backlogs?.met ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/50 border-rose-200'
              }`}>
                <span className="text-zinc-500 block text-[10px] uppercase font-medium">Max Backlogs</span>
                <span className="font-bold text-zinc-900 mt-0.5 block">
                  Max: {criteria.backlogs?.required_max ?? 0} • Act: {criteria.backlogs?.actual ?? 0}
                </span>
                <span className={`block text-[10px] font-semibold mt-1 ${criteria.backlogs?.met ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {criteria.backlogs?.met ? '✓ Satisfied' : '✕ Backlogs Exceeded'}
                </span>
              </div>

              <div className={`p-2.5 rounded-xl border ${
                criteria.category?.met ? 'bg-emerald-50/50 border-emerald-200' : 'bg-amber-50/50 border-amber-200'
              }`}>
                <span className="text-zinc-500 block text-[10px] uppercase font-medium">Statutory Category</span>
                <span className="font-bold text-zinc-900 mt-0.5 block">
                  Req: {criteria.category?.required || 'All'}
                </span>
                <span className={`block text-[10px] font-semibold mt-1 ${criteria.category?.met ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {criteria.category?.met ? '✓ Met / General' : '⚠ Requires Quota Doc'}
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 4: Submitted Supporting Documents Vault */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div>
                <h2 className="font-semibold text-zinc-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-zinc-700" />
                  <span>4. Submitted Supporting Documents Vault ({documents.length})</span>
                </h2>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  Authorized admin review: inspect uploaded certificates, verify legitimacy, or request corrections.
                </p>
              </div>
            </div>

            {documents.length === 0 ? (
              <div className="p-6 text-center text-zinc-400 bg-zinc-50 rounded-xl border border-zinc-200/60 text-xs">
                No documents uploaded by this applicant yet.
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div key={doc.id} className="p-3.5 bg-zinc-50/80 rounded-xl border border-zinc-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-zinc-900">{doc.document_type}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                          doc.verification_status === 'VERIFIED'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : doc.verification_status === 'NEEDS_CORRECTION'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : doc.verification_status === 'REJECTED'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                        }`}>
                          {doc.verification_status}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500">
                        {doc.filename} • {doc.file_size_kb} KB • Uploaded {formatDate(doc.uploaded_at)}
                      </p>
                      {doc.admin_remarks && (
                        <p className="text-[11px] text-amber-800 italic bg-amber-50 p-1.5 rounded border border-amber-200">
                          Admin audit notes: {doc.admin_remarks}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleDownloadDoc(doc.id, doc.filename)}
                        className="px-2.5 py-1.5 bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-200 rounded-lg text-xs font-medium transition inline-flex items-center gap-1.5 shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Inspect File</span>
                      </button>

                      {editingDocId === doc.id ? (
                        <div className="flex flex-wrap items-center gap-1.5 bg-white p-1 rounded-lg border border-zinc-300">
                          <input
                            type="text"
                            placeholder="Reason / fix needed..."
                            value={docRemarks}
                            onChange={(e) => setDocRemarks(e.target.value)}
                            className="px-2 py-1 text-xs border border-zinc-200 rounded focus:outline-none w-36"
                          />
                          <button
                            onClick={() => handleUpdateDocStatus(doc.id, 'VERIFIED')}
                            className="px-2.5 py-1 bg-emerald-700 text-white text-[11px] font-medium rounded hover:bg-emerald-800 transition"
                          >
                            Verify
                          </button>
                          <button
                            onClick={() => handleUpdateDocStatus(doc.id, 'NEEDS_CORRECTION')}
                            className="px-2.5 py-1 bg-amber-600 text-white text-[11px] font-medium rounded hover:bg-amber-700 transition"
                          >
                            Request Fix
                          </button>
                          <button
                            onClick={() => handleUpdateDocStatus(doc.id, 'REJECTED')}
                            className="px-2.5 py-1 bg-rose-700 text-white text-[11px] font-medium rounded hover:bg-rose-800 transition"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => setEditingDocId(null)}
                            className="p-1 text-zinc-400 hover:text-zinc-600"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingDocId(doc.id);
                            setDocRemarks(doc.admin_remarks || '');
                          }}
                          className="px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-xs font-medium transition"
                        >
                          Update Status
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 span): Administrative Determination & Award */}
        <div className="space-y-6">
          {/* SECTION 5: Administrative Determination Controls */}
          <div className="bg-zinc-900 text-white rounded-2xl p-5 shadow-lg space-y-4">
            <div className="pb-3 border-b border-zinc-800">
              <h2 className="font-semibold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>5. Administrative Determination</span>
              </h2>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Audit trail recorded with reviewer timestamp and broadcast to student tracking portal.
              </p>
              {application.reviewed_at && (
                <div className="mt-2 text-[10px] text-zinc-400 bg-zinc-800/80 p-2 rounded-lg border border-zinc-700">
                  Last reviewed: <span className="text-white font-medium">{formatDateTime(application.reviewed_at)}</span> by <span className="text-white font-medium">{application.reviewer_name || 'Admin'}</span>
                </div>
              )}
            </div>

            {/* Remarks Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-zinc-300 flex items-center justify-between">
                <span>Decision Remarks / Official Audit Notes:</span>
              </label>
              <textarea
                rows={4}
                value={actionRemarks}
                onChange={(e) => setActionRemarks(e.target.value)}
                placeholder="State specific audit findings, verified statutory credentials, or list exact documents student must rectify..."
                className="w-full p-2.5 bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-white transition"
              />
              <p className="text-[10px] text-zinc-400">
                * Required for Approval, Rejection, and Information Requests.
              </p>
            </div>

            {/* Lifecycle Action Buttons */}
            <div className="space-y-2 pt-1">
              {application.status === 'PENDING' && (
                <button
                  disabled={submittingAction}
                  onClick={() => handleStatusTransition('UNDER_REVIEW')}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Clock className="w-4 h-4" />
                  <span>Mark Under Review</span>
                </button>
              )}

              <button
                disabled={submittingAction}
                onClick={() => handleStatusTransition('NEEDS_INFORMATION')}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <AlertCircle className="w-4 h-4" />
                <span>Request Information</span>
              </button>

              <button
                disabled={submittingAction}
                onClick={() => handleStatusTransition('REJECTED')}
                className="w-full py-2.5 bg-rose-700 hover:bg-rose-600 text-white text-xs font-semibold rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject Application</span>
              </button>

              <button
                disabled={submittingAction}
                onClick={() => handleStatusTransition('APPROVED')}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-md mt-1"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve & Sanction Award</span>
              </button>
            </div>
          </div>

          {/* SECTION 6: Award & Grant Disbursement */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-1.5 text-zinc-900 font-semibold text-xs uppercase tracking-wider pb-2 border-b border-zinc-100">
              <DollarSign className="w-4 h-4 text-purple-600" />
              <span>Grant Sanction & Disbursement</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center text-zinc-500">
                <span>Sanctioned Amount:</span>
                <span className="font-bold text-zinc-900 text-sm">
                  {formatCurrency(scholarship.amount || application.amount)}
                </span>
              </div>
              <div className="flex justify-between items-center text-zinc-500">
                <span>Award Status:</span>
                <span className="font-semibold text-zinc-900">
                  {application.award_status || 'NOT_AWARDED'}
                </span>
              </div>

              {application.disbursed_at && (
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-purple-900 text-[11px] space-y-1">
                  <div className="font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-700" />
                    <span>Disbursed via DBT</span>
                  </div>
                  <p>Ref: <strong className="font-mono">{application.disbursement_reference}</strong></p>
                  <p className="text-[10px] text-purple-700">Date: {formatDateTime(application.disbursed_at)}</p>
                  {application.disbursement_notes && (
                    <p className="text-[10px] italic mt-1 border-t border-purple-200 pt-1">
                      Notes: {application.disbursement_notes}
                    </p>
                  )}
                </div>
              )}

              {application.status === 'APPROVED' && application.award_status !== 'DISBURSED' && (
                <button
                  onClick={() => setShowDisburseModal(true)}
                  className="w-full mt-2 py-2.5 bg-purple-700 hover:bg-purple-600 text-white text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 shadow-md"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Execute Grant Disbursement</span>
                </button>
              )}

              {application.status !== 'APPROVED' && (
                <p className="text-[10px] text-zinc-400 text-center pt-2">
                  Grant disbursement is unlocked once the application is Approved.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Genuine Disbursement Modal */}
      {showDisburseModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-zinc-200 max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h3 className="font-semibold text-zinc-900 text-sm flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-purple-600" />
                <span>Record Grant Disbursement</span>
              </h3>
              <button
                onClick={() => setShowDisburseModal(false)}
                className="text-zinc-400 hover:text-zinc-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDisbursement} className="space-y-3.5 text-xs">
              <p className="text-zinc-500 leading-relaxed">
                Recording a disbursement issues an audited payment confirmation to applicant <strong>{student.full_name || application.student_name}</strong> for the amount of <strong>{formatCurrency(scholarship.amount || application.amount)}</strong>.
              </p>

              <div className="space-y-1">
                <label className="font-medium text-zinc-800">
                  Transaction / DBT PFMS Reference Number <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DBT-PFMS-2026-904812"
                  value={disburseRef}
                  onChange={(e) => setDisburseRef(e.target.value)}
                  className="w-full p-2.5 border border-zinc-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-800 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-zinc-800">Disbursement Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Bank transfer credited via Direct Benefit Transfer gateway."
                  value={disburseNotes}
                  onChange={(e) => setDisburseNotes(e.target.value)}
                  className="w-full p-2.5 border border-zinc-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-800 text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDisburseModal(false)}
                  className="px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={disbursing}
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-xs font-semibold disabled:opacity-50 transition shadow-sm"
                >
                  {disbursing ? 'Recording...' : 'Confirm Disbursement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminApplicationDetail;
