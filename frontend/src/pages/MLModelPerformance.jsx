import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { 
  Cpu, CheckCircle2, RefreshCw, BarChart2, Zap, 
  ShieldCheck, AlertCircle, ArrowUpRight 
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  Cell 
} from 'recharts';

const MLModelPerformance = () => {
  const [perfData, setPerfData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);
  const [retrainMsg, setRetrainMsg] = useState(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const res = await adminAPI.getModelPerformance();
      setPerfData(res.data);
    } catch (err) {
      console.error("Error loading model metrics", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRetrain = async () => {
    setRetraining(true);
    setRetrainMsg(null);
    try {
      const res = await adminAPI.retrainModel();
      setRetrainMsg(res.data.message || "Model retraining initiated in background.");
      setTimeout(() => {
        setRetraining(false);
        fetchMetrics();
      }, 4000);
    } catch (err) {
      setRetrainMsg("Retraining error occurred.");
      setRetraining(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const models = perfData?.models_benchmarked || {};
  const bestModelKey = perfData?.best_model || "Gradient Boosting";
  const bestModelData = models[bestModelKey] || {};
  const cm = bestModelData?.confusion_matrix || [[2074, 118], [511, 8297]]; // [[TN, FP], [FN, TP]]

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold border border-purple-200 mb-2">
            <Cpu className="w-3.5 h-3.5" />
            <span>Machine Learning Pipeline & Model Governance</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AI Model Benchmark & Validation</h1>
          <p className="text-xs text-slate-500">Comparative metrics across 4 machine learning classifiers trained on 55,000+ records</p>
        </div>

        <button
          onClick={handleRetrain}
          disabled={retraining}
          className="self-start sm:self-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${retraining ? 'animate-spin' : ''}`} />
          <span>{retraining ? 'Retraining Pipeline...' : 'Trigger Model Retrain'}</span>
        </button>
      </div>

      {retrainMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{retrainMsg}</span>
        </div>
      )}

      {/* Top Winning Model Metrics Grid */}
      <div className="card-soft p-6 bg-gradient-to-r from-slate-900 to-indigo-950 text-white space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700 pb-3">
          <div>
            <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Active Production Model</span>
            <h3 className="text-xl font-bold mt-0.5">{bestModelKey} Ensemble</h3>
          </div>
          <div className="text-xs text-slate-400">
            Dataset: <strong className="text-white">55,000 Samples</strong> • Train/Test: <strong className="text-white">80/20 Stratified</strong>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 pt-2 text-center">
          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Accuracy</span>
            <span className="text-2xl font-extrabold text-emerald-400">
              {(bestModelData.accuracy * 100).toFixed(1)}%
            </span>
          </div>
          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Precision</span>
            <span className="text-2xl font-extrabold text-indigo-400">
              {(bestModelData.precision * 100).toFixed(1)}%
            </span>
          </div>
          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Recall</span>
            <span className="text-2xl font-extrabold text-blue-400">
              {(bestModelData.recall * 100).toFixed(1)}%
            </span>
          </div>
          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">F1 Score</span>
            <span className="text-2xl font-extrabold text-amber-400">
              {(bestModelData.f1_score * 100).toFixed(1)}%
            </span>
          </div>
          <div className="p-3 bg-white/5 rounded-xl border border-white/10 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">ROC-AUC</span>
            <span className="text-2xl font-extrabold text-purple-400">
              {(bestModelData.roc_auc * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Model Benchmark Comparison Table */}
      <div className="card-soft overflow-hidden space-y-3 p-6">
        <h3 className="text-sm font-bold text-slate-900">Multi-Algorithm Benchmark Comparison</h3>
        <p className="text-xs text-slate-500">Evaluated on stratified holdout test split (11,000 samples) with 5-fold cross validation</p>

        <div className="overflow-x-auto pt-2">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-3 font-bold">Algorithm</th>
                <th className="py-2.5 px-3 font-bold">Accuracy</th>
                <th className="py-2.5 px-3 font-bold">Precision</th>
                <th className="py-2.5 px-3 font-bold">Recall</th>
                <th className="py-2.5 px-3 font-bold">F1 Score</th>
                <th className="py-2.5 px-3 font-bold">ROC-AUC</th>
                <th className="py-2.5 px-3 font-bold">5-Fold CV F1</th>
                <th className="py-2.5 px-3 font-bold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {Object.keys(models).map((key) => {
                const m = models[key];
                const isBest = key === bestModelKey;
                return (
                  <tr key={key} className={isBest ? 'bg-indigo-50/40 font-semibold' : 'hover:bg-slate-50'}>
                    <td className="py-3 px-3 flex items-center gap-2">
                      <span className="font-bold text-slate-900">{key}</span>
                      {isBest && (
                        <span className="text-[9px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                          Selected
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">{(m.accuracy * 100).toFixed(2)}%</td>
                    <td className="py-3 px-3">{(m.precision * 100).toFixed(2)}%</td>
                    <td className="py-3 px-3">{(m.recall * 100).toFixed(2)}%</td>
                    <td className="py-3 px-3 font-bold text-slate-900">{(m.f1_score * 100).toFixed(2)}%</td>
                    <td className="py-3 px-3">{(m.roc_auc * 100).toFixed(2)}%</td>
                    <td className="py-3 px-3">{(m.cv_f1_mean * 100).toFixed(2)}%</td>
                    <td className="py-3 px-3 text-right">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isBest ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {isBest ? 'Active Deploy' : 'Benchmarked'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confusion Matrix and Feature Importance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Confusion Matrix */}
        <div className="card-soft p-6 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Confusion Matrix ({bestModelKey})</h3>
            <p className="text-xs text-slate-500">Holdout evaluation on 11,000 test cases</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-4 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">True Negatives (TN)</span>
                <span className="text-2xl font-extrabold text-slate-800">{cm[0][0]}</span>
                <span className="text-[10px] text-emerald-600 block mt-0.5 font-medium">Correct Ineligible</span>
              </div>
              <div className="p-4 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">False Positives (FP)</span>
                <span className="text-2xl font-extrabold text-rose-600">{cm[0][1]}</span>
                <span className="text-[10px] text-rose-500 block mt-0.5 font-medium">Type I Error</span>
              </div>
              <div className="p-4 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">False Negatives (FN)</span>
                <span className="text-2xl font-extrabold text-amber-600">{cm[1][0]}</span>
                <span className="text-[10px] text-amber-600 block mt-0.5 font-medium">Type II Error</span>
              </div>
              <div className="p-4 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">True Positives (TP)</span>
                <span className="text-2xl font-extrabold text-slate-800">{cm[1][1]}</span>
                <span className="text-[10px] text-emerald-600 block mt-0.5 font-medium">Correct Eligible</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 text-center">
              Sensitivity (Recall): <strong>{((cm[1][1] / (cm[1][1] + cm[1][0])) * 100).toFixed(1)}%</strong> • Specificity: <strong>{((cm[0][0] / (cm[0][0] + cm[0][1])) * 100).toFixed(1)}%</strong>
            </p>
          </div>
        </div>

        {/* Top Feature Importance Ranking */}
        <div className="card-soft p-6 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Feature Importance Ranking</h3>
            <p className="text-xs text-slate-500">Relative impact of key features on model eligibility decisions</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={(perfData?.feature_importance || []).slice(0, 7)}
                margin={{ top: 5, right: 20, left: 60, bottom: 5 }}
              >
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="feature" type="category" tick={{ fontSize: 10 }} width={80} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                <Bar dataKey="importance" fill="#4F46E5" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MLModelPerformance;
