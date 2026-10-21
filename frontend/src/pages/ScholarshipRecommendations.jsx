import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { applicationAPI, scholarshipAPI } from '../services/api';
import ApplyModal from '../components/ApplyModal';
import { 
  Award, Search, Filter, Send, AlertTriangle, CheckCircle2, 
  Clock, XCircle, DollarSign, ArrowRight, RefreshCw
} from 'lucide-react';

const ScholarshipRecommendations = () => {
  const [scholarships, setScholarships] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedAppFilter, setSelectedAppFilter] = useState('All');
  const [selectedScholarship, setSelectedScholarship] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [recsRes, appsRes] = await Promise.all([
        applicationAPI.getRecommendations(),
        applicationAPI.getAll().catch(err => {
          console.error("Could not fetch student applications:", err);
          return { data: [] };
        })
      ]);
      setScholarships(recsRes.data || []);
      setApplications(appsRes.data || []);
    } catch (err) {
      console.error("Falling back to general scholarships:", err);
      try {
        const [fallback, appsRes] = await Promise.all([
          scholarshipAPI.getAll(),
          applicationAPI.getAll().catch(() => ({ data: [] }))
        ]);
        const mapped = (fallback.data || []).map(s => ({
          ...s,
          match_percentage: 82.0,
          eligibility_status: "Eligible",
          missing_requirements: [],
          required_documents: s.required_documents?.split(',') || []
        }));
        setScholarships(mapped);
        setApplications(appsRes.data || []);
      } catch (fallbackErr) {
        console.error("Error loading fallback:", fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApplyClick = (sch) => {
    setSelectedScholarship(sch);
    setIsModalOpen(true);
  };

  const getApplicationForScholarship = (sch) => {
    // 1. Check in real student applications array fetched from /api/applications
    const matchedApp = applications.find(a => a.scholarship_id === sch.id);
    if (matchedApp) return matchedApp;

    // 2. Check if embedded in recommendation object
    if (sch.application_status) {
      return {
        id: sch.application_id,
        status: sch.application_status,
        award_status: sch.award_status,
        decision_remarks: sch.decision_remarks,
        disbursed_at: sch.disbursed_at,
        disbursement_reference: sch.disbursement_reference
      };
    }

    return null;
  };

  const getCardPresentation = (sch) => {
    const app = getApplicationForScholarship(sch);

    // Case 1: Not Applied
    if (!app || !app.status) {
      return {
        statusGroup: 'NOT_APPLIED',
        badge: null,
        banner: null,
        actions: (
          <div className="flex items-center gap-2 pt-1">
            <Link
              to={`/student/scholarships/${sch.id}`}
              className="w-1/2 py-2 text-center text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition"
            >
              View Criteria
            </Link>
            <button
              onClick={() => handleApplyClick(sch)}
              className="w-1/2 py-2 text-center text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Apply</span>
            </button>
          </div>
        )
      };
    }

    // Case 2: Genuine Disbursement
    if (app.award_status === 'DISBURSED') {
      return {
        statusGroup: 'DISBURSED',
        badge: (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200">
            <DollarSign className="w-3.5 h-3.5" />
            <span>Disbursed</span>
          </span>
        ),
        banner: (
          <div className="p-2.5 rounded-lg bg-purple-50/80 border border-purple-200 text-[11px] text-purple-900 space-y-0.5">
            <p className="font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-700 shrink-0" />
              <span>Grant Disbursed via DBT</span>
            </p>
            {app.disbursement_reference && (
              <p className="text-[10px] text-purple-800 font-mono">
                Ref: {app.disbursement_reference}
              </p>
            )}
          </div>
        ),
        actions: (
          <div className="flex items-center gap-2 pt-1">
            <Link
              to={`/student/scholarships/${sch.id}`}
              className="w-1/2 py-2 text-center text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition"
            >
              View Criteria
            </Link>
            <Link
              to="/student/applications"
              className="w-1/2 py-2 text-center text-xs font-semibold text-white bg-purple-700 hover:bg-purple-800 rounded-lg transition inline-flex items-center justify-center gap-1 shadow-sm"
            >
              <span>View Award Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )
      };
    }

    // Case 3: Approved / Award Confirmed
    if (app.status === 'APPROVED') {
      return {
        statusGroup: 'AWARDED',
        badge: (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Scholarship Awarded</span>
          </span>
        ),
        banner: app.decision_remarks ? (
          <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-[11px] text-emerald-900">
            <span className="font-semibold">Committee Decision: </span>
            <span className="text-emerald-800">{app.decision_remarks}</span>
          </div>
        ) : null,
        actions: (
          <div className="flex items-center gap-2 pt-1">
            <Link
              to={`/student/scholarships/${sch.id}`}
              className="w-1/2 py-2 text-center text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition"
            >
              View Criteria
            </Link>
            <Link
              to="/student/applications"
              className="w-1/2 py-2 text-center text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition inline-flex items-center justify-center gap-1 shadow-sm"
            >
              <span>View Award Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )
      };
    }

    // Case 4: Needs Information (Action Required)
    if (app.status === 'NEEDS_INFORMATION') {
      return {
        statusGroup: 'NEEDS_INFORMATION',
        badge: (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Action Required</span>
          </span>
        ),
        banner: (
          <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900 space-y-1">
            <p className="font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Correction Requested by Scrutiny Committee</span>
            </p>
            <p className="text-zinc-700 text-[10px] leading-relaxed line-clamp-2">
              {app.decision_remarks || "Please review your document vault or profile details."}
            </p>
          </div>
        ),
        actions: (
          <div className="flex items-center gap-2 pt-1">
            <Link
              to={`/student/scholarships/${sch.id}`}
              className="w-1/2 py-2 text-center text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition"
            >
              View Criteria
            </Link>
            <Link
              to="/student/applications"
              className="w-1/2 py-2 text-center text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition inline-flex items-center justify-center gap-1 shadow-sm"
            >
              <span>Action Required</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )
      };
    }

    // Case 5: Under Committee Review
    if (app.status === 'UNDER_REVIEW') {
      return {
        statusGroup: 'UNDER_REVIEW',
        badge: (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200">
            <Clock className="w-3.5 h-3.5" />
            <span>Under Review</span>
          </span>
        ),
        banner: null,
        actions: (
          <div className="flex items-center gap-2 pt-1">
            <Link
              to={`/student/scholarships/${sch.id}`}
              className="w-1/2 py-2 text-center text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition"
            >
              View Criteria
            </Link>
            <Link
              to="/student/applications"
              className="w-1/2 py-2 text-center text-xs font-medium text-zinc-800 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 rounded-lg transition inline-flex items-center justify-center gap-1"
            >
              <span>View Application</span>
            </Link>
          </div>
        )
      };
    }

    // Case 6: Rejected
    if (app.status === 'REJECTED') {
      return {
        statusGroup: 'REJECTED',
        badge: (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-rose-50 text-rose-800 border border-rose-200">
            <XCircle className="w-3.5 h-3.5" />
            <span>Application Rejected</span>
          </span>
        ),
        banner: app.decision_remarks ? (
          <div className="p-2.5 rounded-lg bg-rose-50/70 border border-rose-200 text-[11px] text-rose-900">
            <span className="font-semibold">Review Outcome: </span>
            <span className="text-rose-800">{app.decision_remarks}</span>
          </div>
        ) : null,
        actions: (
          <div className="flex items-center gap-2 pt-1">
            <Link
              to={`/student/scholarships/${sch.id}`}
              className="w-1/2 py-2 text-center text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition"
            >
              View Criteria
            </Link>
            <Link
              to="/student/applications"
              className="w-1/2 py-2 text-center text-xs font-medium text-zinc-800 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 rounded-lg transition inline-flex items-center justify-center gap-1"
            >
              <span>View Application</span>
            </Link>
          </div>
        )
      };
    }

    // Case 7: Pending Initial Verification
    return {
      statusGroup: 'PENDING',
      badge: (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
          <Clock className="w-3.5 h-3.5" />
          <span>Application Submitted</span>
        </span>
      ),
      banner: null,
      actions: (
        <div className="flex items-center gap-2 pt-1">
          <Link
            to={`/student/scholarships/${sch.id}`}
            className="w-1/2 py-2 text-center text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition"
          >
            View Criteria
          </Link>
          <Link
            to="/student/applications"
            className="w-1/2 py-2 text-center text-xs font-medium text-zinc-800 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 rounded-lg transition inline-flex items-center justify-center gap-1"
          >
            <span>View Application</span>
          </Link>
        </div>
      )
    };
  };

  const filteredScholarships = scholarships.filter(sch => {
    const matchesSearch = sch.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          sch.provider.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'All' || sch.category === selectedCategory;

    // Filter by Application Status if selected
    if (selectedAppFilter !== 'All') {
      const app = getApplicationForScholarship(sch);
      if (selectedAppFilter === 'Not Applied') {
        if (app && app.status) return false;
      } else if (selectedAppFilter === 'Applied / In Progress') {
        if (!app || ['APPROVED', 'REJECTED'].includes(app.status)) return false;
      } else if (selectedAppFilter === 'Awarded / Disbursed') {
        if (!app || (app.status !== 'APPROVED' && app.award_status !== 'DISBURSED')) return false;
      } else if (selectedAppFilter === 'Rejected') {
        if (!app || app.status !== 'REJECTED') return false;
      }
    }

    return matchesSearch && matchesCat;
  });

  const categories = [
    'All', 'Merit-cum-Means', 'Girl Child & STEM', 'Category Specific', 
    'Merit', 'Need-Based', 'Disability / PwD', 'Rural Upliftment'
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">Personalized Scholarship Matches</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Ranked by dual-engine AI compatibility and regulatory qualification criteria, synchronized with your live application records
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-medium rounded-lg border border-zinc-200 transition inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <Link
            to="/student/assessment"
            className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium rounded-lg transition"
          >
            Re-evaluate Profile →
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-zinc-200/80 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search scholarship name, provider, or keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-zinc-200 focus:outline-none focus:border-zinc-400 bg-zinc-50/30"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 bg-zinc-50 px-2.5 py-1 rounded-lg border border-zinc-200">
            <Filter className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="text-[11px] text-zinc-500">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs bg-transparent focus:outline-none text-zinc-800 cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Application Status Filter */}
          <div className="flex items-center gap-1.5 bg-zinc-50 px-2.5 py-1 rounded-lg border border-zinc-200">
            <span className="text-[11px] text-zinc-500">Status:</span>
            <select
              value={selectedAppFilter}
              onChange={(e) => setSelectedAppFilter(e.target.value)}
              className="text-xs bg-transparent focus:outline-none text-zinc-800 cursor-pointer"
            >
              <option value="All">All Scholarships</option>
              <option value="Not Applied">Not Applied</option>
              <option value="Applied / In Progress">Applied / In Progress</option>
              <option value="Awarded / Disbursed">Awarded / Disbursed</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Scholarships List */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin"></div>
        </div>
      ) : filteredScholarships.length === 0 ? (
        <div className="bg-white p-12 text-center text-xs text-zinc-500 space-y-2 rounded-xl border border-zinc-200/80">
          <Award className="w-8 h-8 text-zinc-300 mx-auto" />
          <p className="font-medium text-zinc-800 text-sm">No scholarships match your filter criteria.</p>
          <p>Try clearing your search query or adjusting your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredScholarships.map((sch) => {
            const isEligible = sch.eligibility_status === 'Eligible';
            const isConditional = sch.eligibility_status === 'Conditionally Eligible';
            const presentation = getCardPresentation(sch);

            return (
              <div 
                key={sch.id} 
                className="bg-white p-5 rounded-2xl border border-zinc-200/80 flex flex-col justify-between space-y-4 hover:border-zinc-300 transition shadow-xs"
              >
                <div className="space-y-3">
                  {/* Category and Match Score Row */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600">
                      {sch.category}
                    </span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                      isEligible
                        ? 'bg-zinc-50 text-zinc-900 border-zinc-300'
                        : isConditional
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-zinc-100 text-zinc-500 border-zinc-200'
                    }`}>
                      {sch.match_percentage}% Match
                    </span>
                  </div>

                  {/* Application Status Badge (If Applied) */}
                  {presentation.badge && (
                    <div className="pt-0.5">
                      {presentation.badge}
                    </div>
                  )}

                  {/* Scholarship Details */}
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-zinc-900 leading-snug line-clamp-2">
                      {sch.title}
                    </h3>
                    <p className="text-xs text-zinc-500 font-normal">{sch.provider}</p>
                    <p className="text-xs text-zinc-600 leading-relaxed line-clamp-3 pt-1">
                      {sch.description}
                    </p>
                  </div>
                </div>

                {/* Footer Section */}
                <div className="pt-3 border-t border-zinc-100 space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-zinc-400 block text-[10px] uppercase font-medium">Scholarship Grant</span>
                      <span className="font-bold text-zinc-900 text-xs">₹{sch.amount?.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block text-[10px] uppercase font-medium">Deadline</span>
                      <span className="text-zinc-600 font-medium">{sch.deadline}</span>
                    </div>
                  </div>

                  {/* Custom Banner (Disbursed, Decision Remarks, Action Required) */}
                  {presentation.banner}

                  {/* Missing Criteria Notice (only if not applied or conditional) */}
                  {presentation.statusGroup === 'NOT_APPLIED' && sch.missing_requirements?.length > 0 && (
                    <div className="p-2 rounded-lg bg-amber-50/60 border border-amber-200/80 text-[11px] text-amber-900 space-y-0.5">
                      <p className="font-medium flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                        Criteria Notice:
                      </p>
                      <p className="line-clamp-2 text-zinc-600">{sch.missing_requirements[0]}</p>
                    </div>
                  )}

                  {/* Contextual Action Buttons */}
                  {presentation.actions}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Apply Modal */}
      <ApplyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        scholarship={selectedScholarship}
        onSuccess={fetchData}
      />
    </div>
  );
};

export default ScholarshipRecommendations;
