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
        <div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!scholarship) {
    return (
      <div className="bg-white p-12 text-center text-xs text-zinc-500 space-y-3 rounded-xl border border-zinc-200/80">
        <p className="text-sm font-medium text-zinc-800">Scholarship scheme not found.</p>
        <Link to="/student/scholarships" className="text-zinc-900 font-medium hover:underline">
          Return to Recommendations
        </Link>
      </div>
    );
  }

  const documents = scholarship.required_documents?.split(',').map(d => d.trim()) || [];

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <Link
        to="/student/scholarships"
        className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Scholarships</span>
      </Link>

      {/* Main Header Banner */}
      <div className="bg-white p-6 sm:p-7 rounded-xl border border-zinc-200/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1.5">
            <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600">
              {scholarship.category}
            </span>
            <h1 className="text-xl font-semibold text-zinc-900 leading-snug">{scholarship.title}</h1>
            <p className="text-xs text-zinc-500 font-normal">{scholarship.provider}</p>
          </div>

          <div className="text-left sm:text-right flex-shrink-0">
            <span className="text-[11px] text-zinc-400 block">Total Grant Amount</span>
            <span className="text-2xl font-bold text-zinc-900">₹{scholarship.amount?.toLocaleString()}</span>
          </div>
        </div>

        <p className="text-xs text-zinc-600 leading-relaxed pt-3 border-t border-zinc-100">
          {scholarship.description}
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-zinc-100 text-xs">
          <div className="flex items-center gap-2 text-zinc-500">
            <Calendar className="w-4 h-4 text-zinc-400" />
            <span>Submission Deadline: <strong className="text-zinc-800 font-medium">{scholarship.deadline}</strong></span>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-medium rounded-lg transition flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Apply Now</span>
          </button>
        </div>
      </div>

      {/* Grid: Eligibility Criteria & Required Documents */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Strict Criteria Checklist */}
        <div className="bg-white p-5 rounded-xl border border-zinc-200/80 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
            <ShieldCheck className="w-4 h-4 text-zinc-500" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-700">Mandatory Eligibility Criteria</h3>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center p-2.5 rounded-lg bg-zinc-50/50 border border-zinc-200/70">
              <span className="text-zinc-600">Minimum CGPA Required</span>
              <span className="font-semibold text-zinc-900">{scholarship.min_cgpa} / 10.0</span>
            </div>

            <div className="flex justify-between items-center p-2.5 rounded-lg bg-zinc-50/50 border border-zinc-200/70">
              <span className="text-zinc-600">Max Family Annual Income</span>
              <span className="font-semibold text-zinc-900">≤ ₹{scholarship.max_income?.toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center p-2.5 rounded-lg bg-zinc-50/50 border border-zinc-200/70">
              <span className="text-zinc-600">Permitted Active Backlogs</span>
              <span className="font-semibold text-zinc-900">≤ {scholarship.max_backlogs}</span>
            </div>

            <div className="flex justify-between items-center p-2.5 rounded-lg bg-zinc-50/50 border border-zinc-200/70">
              <span className="text-zinc-600">Minimum Verified Attendance</span>
              <span className="font-semibold text-zinc-900">≥ {scholarship.min_attendance}%</span>
            </div>

            <div className="flex justify-between items-center p-2.5 rounded-lg bg-zinc-50/50 border border-zinc-200/70">
              <span className="text-zinc-600">Target Social Category</span>
              <span className="font-semibold text-zinc-900">{scholarship.required_category}</span>
            </div>

            <div className="flex justify-between items-center p-2.5 rounded-lg bg-zinc-50/50 border border-zinc-200/70">
              <span className="text-zinc-600">Target Education Level</span>
              <span className="font-semibold text-zinc-900">{scholarship.required_education_level}</span>
            </div>
          </div>
        </div>

        {/* Required Documents Checklist */}
        <div className="bg-white p-5 rounded-xl border border-zinc-200/80 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
            <FileCheck className="w-4 h-4 text-zinc-500" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-700">Required Documents</h3>
          </div>

          <p className="text-xs text-zinc-500">
            Ensure these documents are uploaded to your Document Vault before submitting:
          </p>

          <ul className="space-y-2 text-xs text-zinc-700">
            {documents.map((doc, i) => (
              <li key={i} className="flex items-center gap-2 p-2 rounded-lg bg-zinc-50/50 border border-zinc-200/70">
                <CheckCircle2 className="w-3.5 h-3.5 text-zinc-600 flex-shrink-0" />
                <span className="font-medium text-zinc-800">{doc}</span>
              </li>
            ))}
          </ul>

          <div className="pt-2">
            <Link
              to="/student/profile"
              className="text-xs text-zinc-700 font-medium hover:text-zinc-950 flex items-center gap-1"
            >
              <span>Manage Document Vault →</span>
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

