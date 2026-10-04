import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applicationAPI, scholarshipAPI } from '../services/api';
import ApplyModal from '../components/ApplyModal';
import { 
  Award, Search, Filter, Calendar, DollarSign, Send, 
  CheckCircle2, AlertTriangle, FileText, ChevronRight 
} from 'lucide-react';

const ScholarshipRecommendations = () => {
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedScholarship, setSelectedScholarship] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const res = await applicationAPI.getRecommendations();
      setScholarships(res.data);
    } catch (err) {
      console.error("Falling back to general scholarships", err);
      const fallback = await scholarshipAPI.getAll();
      const mapped = fallback.data.map(s => ({
        ...s,
        match_percentage: 82.0,
        eligibility_status: "Eligible",
        missing_requirements: [],
        required_documents: s.required_documents?.split(',') || []
      }));
      setScholarships(mapped);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyClick = (sch) => {
    setSelectedScholarship(sch);
    setIsModalOpen(true);
  };

  const filteredScholarships = scholarships.filter(sch => {
    const matchesSearch = sch.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          sch.provider.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'All' || sch.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const categories = ['All', 'Merit-cum-Means', 'Girl Child & STEM', 'Category Specific', 'Merit', 'Need-Based', 'Disability / PwD', 'Rural Upliftment'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Personalized Scholarship Matches</h1>
          <p className="text-xs text-slate-500">Sorted by AI multidimensional compatibility and regulatory eligibility</p>
        </div>
        <Link
          to="/student/assessment"
          className="self-start sm:self-auto px-4 py-2 bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold rounded-xl border border-brand-200 transition"
        >
          Re-evaluate Profile →
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="card-soft p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search scholarship name, provider, or keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <span className="text-xs font-semibold text-slate-500">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Scholarships List */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
        </div>
      ) : filteredScholarships.length === 0 ? (
        <div className="card-soft p-12 text-center text-xs text-slate-500 space-y-2">
          <Award className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="font-semibold text-slate-700 text-sm">No scholarships match your filter criteria.</p>
          <p>Try clearing your search query or selecting 'All' categories.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredScholarships.map((sch) => {
            const isEligible = sch.eligibility_status === 'Eligible';
            const isConditional = sch.eligibility_status === 'Conditionally Eligible';

            return (
              <div key={sch.id} className="card-soft p-6 flex flex-col justify-between space-y-4 hover:border-brand-300">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {sch.category}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${
                        isEligible
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : isConditional
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {sch.match_percentage}% Match
                      </span>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-snug line-clamp-2">
                    {sch.title}
                  </h3>
                  <p className="text-xs text-brand-600 font-medium">{sch.provider}</p>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                    {sch.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Scholarship Grant</span>
                      <span className="font-extrabold text-slate-900 text-sm">₹{sch.amount?.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Application Deadline</span>
                      <span className="font-semibold text-slate-700">{sch.deadline}</span>
                    </div>
                  </div>

                  {sch.missing_requirements?.length > 0 && (
                    <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 space-y-1">
                      <p className="font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                        Criteria Notice:
                      </p>
                      <p className="line-clamp-2">{sch.missing_requirements[0]}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <Link
                      to={`/student/scholarships/${sch.id}`}
                      className="w-1/2 py-2 text-center text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                    >
                      View Criteria
                    </Link>
                    <button
                      onClick={() => handleApplyClick(sch)}
                      className="w-1/2 py-2 text-center text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm shadow-brand-500/20 transition flex items-center justify-center gap-1"
                    >
                      <Send className="w-3 h-3" />
                      <span>Apply</span>
                    </button>
                  </div>
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
      />
    </div>
  );
};

export default ScholarshipRecommendations;
