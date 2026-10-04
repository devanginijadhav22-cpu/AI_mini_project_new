import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { scholarshipAPI } from '../services/api';
import ApplyModal from '../components/ApplyModal';
import { 
  Award, ArrowLeft, Calendar, DollarSign, FileCheck, 
  ShieldCheck, AlertCircle, CheckCircle2, Send 
} from 'lucide-react';

const ScholarshipDetails = () => {
  const { id } = useParams();
  const [scholarship, setScholarship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const fetchDetails = async () => {
    try {
      const res = await scholarshipAPI.getById(id);
      setScholarship(res.data);
    } catch (err) {
      console.error("Error loading scholarship details", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!scholarship) {
    return (
      <div className="card-soft p-12 text-center text-xs text-slate-500 space-y-3">
        <p className="text-sm font-bold text-slate-800">Scholarship scheme not found.</p>
        <Link to="/student/scholarships" className="text-brand-600 hover:underline">
          Return to Recommendations
        </Link>
      </div>
    );
  }

  const documents = scholarship.required_documents?.split(',').map(d => d.trim()) || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        to="/student/scholarships"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Scholarships</span>
      </Link>

      {/* Main Header Banner */}
      <div className="card-soft p-6 sm:p-8 space-y-4 border-t-4 border-t-brand-600">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
              {scholarship.category}
            </span>
            <h1 className="text-2xl font-bold text-slate-900 leading-snug">{scholarship.title}</h1>
            <p className="text-xs text-brand-600 font-semibold">{scholarship.provider}</p>
          </div>

          <div className="text-left sm:text-right flex-shrink-0">
            <span className="text-xs text-slate-400 block">Total Grant Amount</span>
            <span className="text-3xl font-extrabold text-slate-900">₹{scholarship.amount?.toLocaleString()}</span>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-2 border-t border-slate-100">
          {scholarship.description}
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <Calendar className="w-4 h-4 text-brand-600" />
            <span>Submission Deadline: <strong className="text-slate-800">{scholarship.deadline}</strong></span>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-md shadow-brand-500/25 transition flex items-center gap-1.5"
          >
            <Send className="w-4 h-4" />
            <span>Apply Now</span>
          </button>
        </div>
      </div>

      {/* Grid: Eligibility Criteria & Required Documents */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strict Criteria Checklist */}
        <div className="card-soft p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <ShieldCheck className="w-5 h-5 text-brand-600" />
            <h3 className="text-sm font-bold text-slate-900">Mandatory Eligibility Criteria</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-600">Minimum CGPA Required</span>
              <span className="font-bold text-slate-900">{scholarship.min_cgpa} / 10.0</span>
            </div>

            <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-600">Max Family Annual Income</span>
              <span className="font-bold text-slate-900">≤ ₹{scholarship.max_income?.toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-600">Permitted Active Backlogs</span>
              <span className="font-bold text-slate-900">≤ {scholarship.max_backlogs}</span>
            </div>

            <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-600">Minimum Verified Attendance</span>
              <span className="font-bold text-slate-900">≥ {scholarship.min_attendance}%</span>
            </div>

            <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-600">Target Social Category</span>
              <span className="font-bold text-brand-700">{scholarship.required_category}</span>
            </div>

            <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-600">Target Education Level</span>
              <span className="font-bold text-slate-900">{scholarship.required_education_level}</span>
            </div>
          </div>
        </div>

        {/* Required Documents Checklist */}
        <div className="card-soft p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <FileCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Required Verification Documents</h3>
          </div>

          <p className="text-xs text-slate-500">
            Ensure these documents are uploaded and stamped in your Profile Vault prior to administrative review:
          </p>

          <ul className="space-y-2.5 text-xs text-slate-700">
            {documents.map((doc, i) => (
              <li key={i} className="flex items-start gap-2.5 p-2 rounded-lg bg-emerald-50/40 border border-emerald-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span className="font-medium">{doc}</span>
              </li>
            ))}
          </ul>

          <div className="pt-2">
            <Link
              to="/student/profile"
              className="text-xs text-brand-600 font-semibold hover:underline flex items-center gap-1"
            >
              <span>Manage document uploads in profile vault →</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      <ApplyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        scholarship={scholarship}
      />
    </div>
  );
};

export default ScholarshipDetails;
