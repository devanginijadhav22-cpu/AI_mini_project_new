import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { eligibilityAPI } from '../services/api';
import GaugeScore from '../components/GaugeScore';
import ApplyModal from '../components/ApplyModal';
import { 
  Sparkles, CheckCircle2, XCircle, AlertTriangle, ArrowRight, 
  Award, Shield, HelpCircle, RefreshCw, Send, Check
} from 'lucide-react';

const EligibilityResult = () => {
  const location = useLocation();
  const [result, setResult] = useState(location.state?.result || null);
  const [loading, setLoading] = useState(!location.state?.result);
  const [selectedScholarship, setSelectedScholarship] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!result) {
      fetchLatest();
    }
  }, []);

  const fetchLatest = async () => {
    setLoading(true);
    try {
      const res = await eligibilityAPI.getLatestResult();
      if (res.data.status !== "none") {
        setResult(res.data);
      }
    } catch (err) {
      console.error("Error fetching latest result", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenApply = (scholarship) => {
    setSelectedScholarship(scholarship);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500">Loading AI assessment result...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="card-soft p-12 text-center max-w-lg mx-auto space-y-4">
        <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center mx-auto">
          <Sparkles className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">No Assessment Found</h3>
        <p className="text-xs text-slate-500">
          You haven't completed an eligibility check yet. Take our 5-minute guided assessment to calculate your score.
        </p>
        <Link
          to="/student/assessment"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md transition"
        >
          <span>Take Assessment Now</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Banner Card */}
      <div className="card-soft p-6 sm:p-8 bg-gradient-to-r from-white via-slate-50 to-brand-50/30 border border-slate-200">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Assessment Completed Successfully</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              AI Eligibility Verdict: <span className="text-brand-600">{result.final_verdict}</span>
            </h1>
            <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
              Synthesized using a Hybrid Rule Engine (45% Statutory criteria) and Gradient Boosting Machine Learning (55% Holistic merit & equity probability).
            </p>
          </div>

          <div className="flex-shrink-0">
            <GaugeScore
              score={Math.round(result.hybrid_score ?? 0)}
              label="Hybrid Eligibility Score"
            />
          </div>
        </div>
      </div>

      {/* Dual Engine Score Explanation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ML Engine Contribution */}
        <div className="card-soft p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-xs">
                ML
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">Machine Learning Probability</h3>
                <p className="text-[10px] text-slate-500">Gradient Boosting Ensemble Classifier</p>
              </div>
            </div>
            <span className="text-lg font-extrabold text-brand-600">{result.ml_percentage}%</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Evaluates your complete 79-dimensional profile (family size dependency, attendance consistency, academic excellence, regional demographics) against historical patterns from 55,000+ benchmarked records.
          </p>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div className="bg-brand-600 h-2 rounded-full transition-all duration-1000" style={{ width: `${result.ml_percentage}%` }}></div>
          </div>
        </div>

        {/* Rule-Based Engine Contribution */}
        <div className="card-soft p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                RE
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">Rule-Based Compliance</h3>
                <p className="text-[10px] text-slate-500">Statutory Legal Criteria Check</p>
              </div>
            </div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
              result.rule_status === 'ELIGIBLE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              {result.rule_status}
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Deterministic rule engine verified: Family Income ≤ ceiling limits, active backlogs ≤ 1, attendance ≥ 65%, and category quota compliance.
          </p>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div className="bg-emerald-600 h-2 rounded-full transition-all duration-1000" style={{ width: result.rule_status === 'ELIGIBLE' ? '100%' : '70%' }}></div>
          </div>
        </div>
      </div>

      {/* EXPLAINABLE AI FACTORS SECTION (Why am I eligible? & What can I improve?) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Positive Factors: Why am I eligible? */}
        <div className="card-soft p-6 space-y-4 border-l-4 border-l-emerald-500">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Why am I eligible? (Positive Factors)</h3>
          </div>
          <p className="text-xs text-slate-500">
            Attributes in your profile that significantly boosted your eligibility probability:
          </p>

          <div className="space-y-3">
            {result.positive_factors?.map((item, idx) => (
              <div key={idx} className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900">{item.factor}</span>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                    {item.impact}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Negative Factors & Improvement Tips: What can I improve? */}
        <div className="card-soft p-6 space-y-4 border-l-4 border-l-amber-500">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900">What can I improve? (Actionable Advice)</h3>
          </div>
          <p className="text-xs text-slate-500">
            Key areas to optimize to unlock 100% of national and institutional scholarships:
          </p>

          <div className="space-y-3">
            {result.negative_factors?.length > 0 ? (
              result.negative_factors.map((item, idx) => (
                <div key={idx} className="p-3 bg-rose-50/50 rounded-xl border border-rose-100 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-900">{item.factor}</span>
                    <span className="text-[10px] font-semibold text-rose-700 bg-rose-100/70 px-2 py-0.5 rounded-full">
                      {item.impact}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
                </div>
              ))
            ) : (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                No major negative factors detected in your submitted profile.
              </div>
            )}

            {/* Improvement Recommendations */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 mt-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Expert System Recommendations:</h4>
              <ul className="space-y-1.5 text-xs text-slate-600">
                {result.improvement_tips?.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-brand-600 font-bold">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Scholarships for This Student */}
      <div className="card-soft p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recommended Scholarships</h3>
            <p className="text-xs text-slate-500">Ranked by calculated Match Percentage for your profile</p>
          </div>
          <Link
            to="/student/scholarships"
            className="text-xs text-brand-600 hover:text-brand-800 font-semibold"
          >
            Explore all scholarships →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {result.top_recommendations?.slice(0, 6).map((sch) => (
            <div key={sch.id} className="card-soft p-5 flex flex-col justify-between space-y-4 hover:border-brand-300">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                    {sch.category}
                  </span>
                  <div className="flex items-center gap-1 text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <span>{sch.match_percentage}%</span>
                    <span className="text-[10px] font-medium text-slate-400">Match</span>
                  </div>
                </div>

                <h4 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">{sch.title}</h4>
                <p className="text-[11px] text-slate-500 line-clamp-1">{sch.provider}</p>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{sch.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Grant:</span>
                  <span className="font-extrabold text-slate-900">₹{sch.amount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Deadline:</span>
                  <span className="font-medium text-slate-700">{sch.deadline}</span>
                </div>

                {sch.missing_requirements?.length > 0 && (
                  <div className="text-[10px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                    Notice: {sch.missing_requirements[0]}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <Link
                    to={`/student/scholarships/${sch.id}`}
                    className="w-1/2 py-2 text-center text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                  >
                    Details
                  </Link>
                  <button
                    onClick={() => handleOpenApply(sch)}
                    className="w-1/2 py-2 text-center text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm shadow-brand-500/20 transition flex items-center justify-center gap-1"
                  >
                    <Send className="w-3 h-3" />
                    <span>Apply</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Apply Modal */}
      <ApplyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        scholarship={selectedScholarship}
      />
    </div>
  );
};

export default EligibilityResult;
