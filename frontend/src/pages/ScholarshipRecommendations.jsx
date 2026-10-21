import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applicationAPI, scholarshipAPI } from '../services/api';
import ApplyModal from '../components/ApplyModal';
import { 
  Award, Search, Filter, Send, AlertTriangle 
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">Personalized Scholarship Matches</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Ranked by dual-engine AI compatibility and regulatory qualification criteria</p>
        </div>
        <Link
          to="/student/assessment"
          className="self-start sm:self-auto px-3.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-medium rounded-lg border border-zinc-200 transition"
        >
          Re-evaluate Profile →
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-zinc-200/80 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search scholarship name, provider, or keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-zinc-200 focus:outline-none focus:border-zinc-400 bg-zinc-50/30"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <Filter className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
          <span className="text-xs text-zinc-500">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-zinc-200 focus:outline-none focus:border-zinc-400 bg-white text-zinc-800"
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
          <div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin"></div>
        </div>
      ) : filteredScholarships.length === 0 ? (
        <div className="bg-white p-12 text-center text-xs text-zinc-500 space-y-2 rounded-xl border border-zinc-200/80">
          <Award className="w-8 h-8 text-zinc-300 mx-auto" />
          <p className="font-medium text-zinc-800 text-sm">No scholarships match your filter criteria.</p>
          <p>Try clearing your search query or selecting 'All' categories.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredScholarships.map((sch) => {
            const isEligible = sch.eligibility_status === 'Eligible';
            const isConditional = sch.eligibility_status === 'Conditionally Eligible';

            return (
              <div key={sch.id} className="bg-white p-5 rounded-xl border border-zinc-200/80 flex flex-col justify-between space-y-4 hover:border-zinc-300 transition">
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600">
                      {sch.category}
                    </span>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md border ${
                      isEligible
                        ? 'bg-zinc-50 text-zinc-900 border-zinc-300'
                        : isConditional
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-zinc-100 text-zinc-500 border-zinc-200'
                    }`}>
                      {sch.match_percentage}% Match
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-zinc-900 leading-snug line-clamp-2">
                    {sch.title}
                  </h3>
                  <p className="text-xs text-zinc-500 font-normal">{sch.provider}</p>
                  <p className="text-xs text-zinc-600 leading-relaxed line-clamp-3">
                    {sch.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-zinc-100 space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-zinc-400 block text-[10px]">Scholarship Grant</span>
                      <span className="font-semibold text-zinc-900 text-xs">₹{sch.amount?.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block text-[10px]">Application Deadline</span>
                      <span className="text-zinc-600">{sch.deadline}</span>
                    </div>
                  </div>

                  {sch.missing_requirements?.length > 0 && (
                    <div className="p-2 rounded-lg bg-amber-50/60 border border-amber-200/80 text-[11px] text-amber-900 space-y-0.5">
                      <p className="font-medium flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-600 flex-shrink-0" />
                        Criteria Notice:
                      </p>
                      <p className="line-clamp-2 text-zinc-600">{sch.missing_requirements[0]}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <Link
                      to={`/student/scholarships/${sch.id}`}
                      className="w-1/2 py-1.5 text-center text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition"
                    >
                      View Criteria
                    </Link>
                    <button
                      onClick={() => handleApplyClick(sch)}
                      className="w-1/2 py-1.5 text-center text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition flex items-center justify-center gap-1"
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

