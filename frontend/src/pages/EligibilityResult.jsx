import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { eligibilityAPI } from '../services/api';
import GaugeScore from '../components/GaugeScore';
import ApplyModal from '../components/ApplyModal';
import { CheckCircle2, AlertTriangle, ArrowRight, Send } from 'lucide-react';

const EligibilityResult = () => {
  const location = useLocation();
  const [result, setResult] = useState(location.state?.result || null);
  const [loading, setLoading] = useState(!location.state?.result);
  const [selectedScholarship, setSelectedScholarship] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchLatest = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    if (!result) {
      fetchLatest();
    }
  }, [result, fetchLatest]);

  const handleOpenApply = (scholarship) => {
    setSelectedScholarship(scholarship);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-xs text-zinc-400">Loading evaluation results...</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="bg-white border border-zinc-200 rounded-lg p-10 text-center max-w-md mx-auto space-y-4">
        <h2 className="text-sm font-semibold text-zinc-900">No Evaluation Found</h2>
        <p className="text-xs text-zinc-500">
          You have not completed an assessment yet. Complete the wizard to generate your dual-engine score and matching schemes.
        </p>
        <Link
          to="/student/assessment"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-md transition-colors"
        >
          <span>Begin Assessment</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header Card */}
      <div className="bg-white border border-zinc-200 rounded-lg p-6 sm:p-7">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-800 text-xs font-medium border border-zinc-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Assessment Completed</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-zinc-950 tracking-tight">
              Evaluation Verdict: {result.final_verdict}
            </h1>
            <p className="text-xs text-zinc-500 max-w-lg leading-relaxed">
              Derived from deterministic statutory rule compliance (45%) and Gradient Boosting multidimensional probability (55%).
            </p>
          </div>

          <div className="shrink-0">
            <GaugeScore
              score={Math.round(result.hybrid_score ?? 0)}
              label="Hybrid Eligibility Score"
            />
          </div>
        </div>
      </div>

      {/* Dual Engine Composition Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ML Engine Contribution */}
        <div className="bg-white border border-zinc-200 rounded-lg p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
            <div>
              <h2 className="text-xs font-semibold text-zinc-900">ML Peer Competitiveness (55%)</h2>
              <p className="text-[11px] text-zinc-500">HistGradientBoosting Ensemble</p>
            </div>
            <span className="text-base font-semibold text-zinc-950">{result.ml_percentage}%</span>
          </div>
          <p className="text-xs text-zinc-600 leading-relaxed">
            Evaluates your complete 79-feature profile against 55,000+ benchmarked student records for peer competitiveness and consistency.
          </p>
          <div className="w-full bg-zinc-100 rounded-full h-1.5">
            <div className="bg-zinc-900 h-1.5 rounded-full" style={{ width: `${result.ml_percentage}%` }}></div>
          </div>
        </div>

        {/* Rule-Based Engine Contribution */}
        <div className="bg-white border border-zinc-200 rounded-lg p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
            <div>
              <h2 className="text-xs font-semibold text-zinc-900">Statutory Rule Compliance (45%)</h2>
              <p className="text-[11px] text-zinc-500">Non-negotiable legal criteria</p>
            </div>
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 border border-zinc-200">
              {result.rule_status}
            </span>
          </div>
          <p className="text-xs text-zinc-600 leading-relaxed">
            Verifies statutory government income ceilings, maximum active backlog constraints, and minimum attendance thresholds.
          </p>
          <div className="w-full bg-zinc-100 rounded-full h-1.5">
            <div className="bg-zinc-900 h-1.5 rounded-full" style={{ width: result.rule_status === 'ELIGIBLE' ? '100%' : '70%' }}></div>
          </div>
        </div>
      </div>

      {/* EXPLAINABLE AI FACTORS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Positive Factors */}
        <div className="bg-white border border-zinc-200 rounded-lg p-5 space-y-3">
          <div className="flex items-center space-x-2 pb-2 border-b border-zinc-100">
            <CheckCircle2 className="w-4 h-4 text-zinc-900" />
            <h2 className="text-xs font-semibold text-zinc-900">Why am I eligible? (Positive Factors)</h2>
          </div>
          <p className="text-xs text-zinc-500">
            Key factors in your submitted profile that strengthened your evaluation:
          </p>

          <div className="space-y-2 pt-1">
            {result.positive_factors?.map((item, idx) => (
              <div key={idx} className="p-3 bg-zinc-50 rounded border border-zinc-200/80 space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-900">{item.factor}</span>
                  <span className="text-[10px] font-medium text-zinc-600 bg-white px-2 py-0.5 rounded border border-zinc-200">
                    {item.impact}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Negative Factors & Recommendations */}
        <div className="bg-white border border-zinc-200 rounded-lg p-5 space-y-3">
          <div className="flex items-center space-x-2 pb-2 border-b border-zinc-100">
            <AlertTriangle className="w-4 h-4 text-zinc-700" />
            <h2 className="text-xs font-semibold text-zinc-900">Actionable Improvement Guidance</h2>
          </div>
          <p className="text-xs text-zinc-500">
            Areas to optimize to qualify for higher-tier scholarship awards:
          </p>

          <div className="space-y-2 pt-1">
            {result.negative_factors?.length > 0 ? (
              result.negative_factors.map((item, idx) => (
                <div key={idx} className="p-3 bg-zinc-50 rounded border border-zinc-200/80 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-900">{item.factor}</span>
                    <span className="text-[10px] font-medium text-zinc-600 bg-white px-2 py-0.5 rounded border border-zinc-200">
                      {item.impact}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-600 leading-relaxed">{item.description}</p>
                </div>
              ))
            ) : (
              <div className="p-3 bg-zinc-50 rounded border border-zinc-200 text-xs text-zinc-500">
                No adverse disqualification factors detected in your profile.
              </div>
            )}

            {/* Improvement Recommendations List */}
            {result.improvement_tips?.length > 0 && (
              <div className="p-3.5 bg-zinc-50 rounded border border-zinc-200 space-y-1.5 mt-2">
                <span className="text-xs font-medium text-zinc-900 block">Expert System Tips:</span>
                <ul className="space-y-1 text-xs text-zinc-600">
                  {result.improvement_tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-zinc-400">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recommended Scholarships for This Student */}
      <div className="bg-white border border-zinc-200 rounded-lg p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-100">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">Recommended Scholarships</h2>
            <p className="text-xs text-zinc-500">Ranked by calculated multidimensional match percentage</p>
          </div>
          <Link
            to="/student/scholarships"
            className="text-xs text-zinc-600 hover:text-zinc-950 font-medium"
          >
            Explore all schemes →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {result.top_recommendations?.slice(0, 6).map((sch) => (
            <div key={sch.id} className="bg-white border border-zinc-200 rounded-lg p-4 flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 border border-zinc-200">
                    {sch.category}
                  </span>
                  <span className="text-xs font-medium text-zinc-900 bg-zinc-50 px-2 py-0.5 rounded border border-zinc-200">
                    {sch.match_percentage}% match
                  </span>
                </div>

                <h3 className="text-xs font-semibold text-zinc-950 line-clamp-2 leading-snug">{sch.title}</h3>
                <p className="text-[11px] text-zinc-500 line-clamp-1">{sch.provider}</p>
                <p className="text-xs text-zinc-600 line-clamp-2 leading-relaxed">{sch.description}</p>
              </div>

              <div className="pt-3 border-t border-zinc-100 space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500">Grant Value:</span>
                  <span className="font-semibold text-zinc-950">₹{sch.amount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500">Deadline:</span>
                  <span className="text-zinc-700">{sch.deadline}</span>
                </div>

                {sch.missing_requirements?.length > 0 && (
                  <p className="text-[10px] text-zinc-500 bg-zinc-50 p-1.5 rounded border border-zinc-200">
                    Prerequisite notice: {sch.missing_requirements[0]}
                  </p>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <Link
                    to={`/student/scholarships/${sch.id}`}
                    className="w-1/2 py-1.5 text-center text-xs font-medium text-zinc-700 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded transition-colors"
                  >
                    Details
                  </Link>
                  <button
                    onClick={() => handleOpenApply(sch)}
                    className="w-1/2 py-1.5 text-center text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded transition-colors flex items-center justify-center gap-1"
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
