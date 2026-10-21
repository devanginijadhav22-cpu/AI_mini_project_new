import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI, scholarshipAPI } from '../services/api';
import { 
  FileText, Search, Filter, CheckCircle2, Clock, XCircle, AlertCircle, 
  Eye, ShieldCheck, Award, RefreshCw
} from 'lucide-react';

const AdminApplications = () => {
  const [applications, setApplications] = useState([]);
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [scholarshipFilter, setScholarshipFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [statusFilter, scholarshipFilter]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [appsRes, schsRes] = await Promise.all([
        adminAPI.getApplications(),
        scholarshipAPI.getAll()
      ]);
      setApplications(appsRes.data || []);
      setScholarships(schsRes.data || []);
    } catch (err) {
      console.error("Failed to load applications data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const params = {};
      if (statusFilter && statusFilter !== 'ALL') params.status = statusFilter;
      if (scholarshipFilter) params.scholarship_id = scholarshipFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await adminAPI.getApplications(params);
      setApplications(res.data || []);
    } catch (err) {
      console.error("Failed to fetch filtered applications:", err);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchApplications();
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
          label: 'Award Confirmed'
        };
      default:
        return null;
    }
  };

  // Metrics summary
  const totalApps = applications.length;
  const uniqueStudents = new Set(applications.map(a => a.student_id)).size;
  const pendingCount = applications.filter(a => a.status === 'PENDING').length;
  const underReviewCount = applications.filter(a => a.status === 'UNDER_REVIEW').length;
  const needsInfoCount = applications.filter(a => a.status === 'NEEDS_INFORMATION').length;
  const approvedCount = applications.filter(a => a.status === 'APPROVED').length;
  const rejectedCount = applications.filter(a => a.status === 'REJECTED').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-zinc-500 mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Scholarship Administration</span>
          </div>
          <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">
            Application Review & Award Command
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Audit applicant eligibility dossiers, verify statutory compliance certificates, and execute admin-controlled award determinations.
          </p>
        </div>

        <button
          onClick={fetchApplications}
          className="self-start sm:self-auto px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-medium rounded-lg transition flex items-center gap-1.5 border border-zinc-200"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-zinc-200/80">
          <p className="text-[10px] uppercase font-semibold text-zinc-400">Total Submissions</p>
          <p className="text-lg font-bold text-zinc-900 mt-1">{totalApps}</p>
          <p className="text-[10px] text-zinc-500 mt-0.5">All applications</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-zinc-200/80">
          <p className="text-[10px] uppercase font-semibold text-zinc-400">Unique Applicants</p>
          <p className="text-lg font-bold text-zinc-900 mt-1">{uniqueStudents}</p>
          <p className="text-[10px] text-zinc-500 mt-0.5">Individual students</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-zinc-200/80">
          <p className="text-[10px] uppercase font-semibold text-zinc-400">Pending Review</p>
          <p className="text-lg font-bold text-amber-600 mt-1">{pendingCount + underReviewCount}</p>
          <p className="text-[10px] text-zinc-500 mt-0.5">{pendingCount} new, {underReviewCount} in review</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-zinc-200/80">
          <p className="text-[10px] uppercase font-semibold text-zinc-400">Needs Info</p>
          <p className="text-lg font-bold text-blue-600 mt-1">{needsInfoCount}</p>
          <p className="text-[10px] text-zinc-500 mt-0.5">Awaiting correction</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-zinc-200/80">
          <p className="text-[10px] uppercase font-semibold text-zinc-400">Approved</p>
          <p className="text-lg font-bold text-emerald-600 mt-1">{approvedCount}</p>
          <p className="text-[10px] text-zinc-500 mt-0.5">Sanctioned grants</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-zinc-200/80">
          <p className="text-[10px] uppercase font-semibold text-zinc-400">Rejected</p>
          <p className="text-lg font-bold text-zinc-600 mt-1">{rejectedCount}</p>
          <p className="text-[10px] text-zinc-500 mt-0.5">Declined dossiers</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-zinc-200/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student name, email, or scholarship..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-20 py-2 text-xs bg-zinc-50/70 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-800 focus:bg-white transition"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-zinc-900 text-white text-[10px] font-medium rounded-md hover:bg-zinc-800 transition"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-zinc-50 px-2.5 py-1.5 rounded-lg border border-zinc-200">
            <Filter className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-transparent text-zinc-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending Scrutiny</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="NEEDS_INFORMATION">Needs Information</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          {/* Scholarship Scheme Filter */}
          <div className="flex items-center gap-1.5 bg-zinc-50 px-2.5 py-1.5 rounded-lg border border-zinc-200">
            <Award className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={scholarshipFilter}
              onChange={(e) => setScholarshipFilter(e.target.value)}
              className="text-xs bg-transparent text-zinc-800 focus:outline-none max-w-[160px] truncate cursor-pointer"
            >
              <option value="">All Scholarships</option>
              {scholarships.map((sch) => (
                <option key={sch.id} value={sch.id}>
                  {sch.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Applications Table */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin"></div>
        </div>
      ) : applications.length === 0 ? (
        <div className="bg-white p-12 text-center text-xs text-zinc-500 space-y-2 rounded-xl border border-zinc-200/80">
          <FileText className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
          <p className="font-medium text-zinc-800 text-sm">No applications found matching criteria.</p>
          <p>Try resetting the search terms or status filters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-zinc-200/80 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50/80 text-zinc-500 border-b border-zinc-200 font-semibold">
                <tr>
                  <th className="py-3 px-4">App ID</th>
                  <th className="py-3 px-4">Applicant</th>
                  <th className="py-3 px-4">Scholarship Scheme</th>
                  <th className="py-3 px-4">Grant</th>
                  <th className="py-3 px-4">Submitted</th>
                  <th className="py-3 px-4">Scholarship Match</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-700">
                {applications.map((app) => {
                  const badge = getStatusBadge(app.status);
                  const BadgeIcon = badge.icon;
                  const awardBadge = getAwardBadge(app.award_status);

                  return (
                    <tr key={app.id} className="hover:bg-zinc-50/70 transition">
                      <td className="py-3 px-4 font-mono text-[11px] text-zinc-500 font-medium">
                        #SCH-APP-{app.id}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-zinc-900">{app.student_name}</div>
                        <div className="text-[11px] text-zinc-400">{app.student_email}</div>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-medium text-zinc-900 truncate">{app.scholarship_title}</div>
                        <div className="text-[11px] text-zinc-400">{app.provider}</div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-zinc-900 whitespace-nowrap">
                        ₹{app.amount?.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-zinc-500 whitespace-nowrap">
                        {new Date(app.applied_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200">
                          {app.match_score != null ? `${app.match_score}%` : 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${badge.bg}`}>
                            <BadgeIcon className="w-3 h-3" />
                            <span>{badge.label}</span>
                          </span>
                          {awardBadge && (
                            <span className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-medium border ${awardBadge.bg}`}>
                              {awardBadge.label}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <Link
                          to={`/admin/applications/${app.id}`}
                          className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium rounded-lg transition inline-flex items-center gap-1 shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Review</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminApplications;
