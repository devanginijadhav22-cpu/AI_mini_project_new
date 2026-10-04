import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, CheckCircle2, ShieldCheck, ArrowRight, Award, 
  BarChart3, Brain, Search, Users, FileCheck, Layers, HelpCircle
} from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Hybrid AI + Rule-Based Expert System</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight font-sans leading-tight">
              Find Scholarships You’re <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-600">Eligible For</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              An AI-powered scholarship eligibility and recommendation system that helps students discover financial opportunities based on their academic, financial, and personal profile.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                to="/student/assessment"
                className="w-full sm:w-auto px-6 py-3.5 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md shadow-brand-500/25 flex items-center justify-center gap-2 transition hover:-translate-y-0.5"
              >
                <span>Check My Eligibility</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/student/scholarships"
                className="w-full sm:w-auto px-6 py-3.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Explore Scholarships
              </Link>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-12 border-t border-slate-100 mt-12 text-left">
              <div className="p-3">
                <p className="text-2xl font-extrabold text-slate-900">55,000+</p>
                <p className="text-xs text-slate-500 font-medium">Derived Student Records</p>
              </div>
              <div className="p-3">
                <p className="text-2xl font-extrabold text-brand-600">96.4%</p>
                <p className="text-xs text-slate-500 font-medium">Model F1 Validation Score</p>
              </div>
              <div className="p-3">
                <p className="text-2xl font-extrabold text-slate-900">100%</p>
                <p className="text-xs text-slate-500 font-medium">Explainable Decisions</p>
              </div>
              <div className="p-3">
                <p className="text-2xl font-extrabold text-indigo-600">Dual-Engine</p>
                <p className="text-xs text-slate-500 font-medium">Rules + Machine Learning</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 sm:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
            <h2 className="text-xs font-bold text-brand-600 uppercase tracking-widest">Workflow</h2>
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">How the Expert System Works</h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Transparent, real-time assessment connecting student demographics, merit, and financial background to verified opportunities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="card-soft p-6 space-y-3 relative">
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 font-bold flex items-center justify-center text-sm border border-brand-200">
                01
              </div>
              <h4 className="text-base font-bold text-slate-900">Profile Submission</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Enter your academic CGPA, family income bracket, category, and achievements via a guided 5-step form.
              </p>
            </div>

            <div className="card-soft p-6 space-y-3 relative">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center text-sm border border-indigo-200">
                02
              </div>
              <h4 className="text-base font-bold text-slate-900">Rule-Based Verification</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Symbolic expert engine checks statutory government income limits, backlogs, and non-negotiable criteria.
              </p>
            </div>

            <div className="card-soft p-6 space-y-3 relative">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 font-bold flex items-center justify-center text-sm border border-emerald-200">
                03
              </div>
              <h4 className="text-base font-bold text-slate-900">ML Probability Inference</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Gradient Boosting model assesses multidimensional suitability and peer competitiveness trained on 55k rows.
              </p>
            </div>

            <div className="card-soft p-6 space-y-3 relative">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 font-bold flex items-center justify-center text-sm border border-purple-200">
                04
              </div>
              <h4 className="text-base font-bold text-slate-900">Explainable Matches</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Receive personalized scholarship matches with positive contributing factors and clear areas for improvement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Pillars */}
      <section className="py-16 sm:py-24 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                <Brain className="w-3.5 h-3.5" />
                <span>Explainable AI (XAI) Inside</span>
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900 leading-tight">
                No Black-Box Decisions. <br />
                Know Exactly <span className="text-brand-600">Why You Qualify</span>.
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Unlike opaque recommendation algorithms, our system breaks down every decision into positive merit drivers, 
                social equity factors, and actionable improvement steps.
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">"Why am I eligible?" Factor Decomposition</h4>
                    <p className="text-xs text-slate-500">Highlights high CGPA, verified attendance, and household income bracket bonuses.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">"What can I improve?" Action Plan</h4>
                    <p className="text-xs text-slate-500">Actionable advice on clearing backlogs, certificate updates, and attendance targets.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Multi-Model Benchmarking for Administrators</h4>
                    <p className="text-xs text-slate-500">Compare Logistic Regression, Decision Tree, Random Forest, and Gradient Boosting metrics.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Demo Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-800">Sample Assessment Card</span>
                <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  Highly Eligible (88.5%)
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-white rounded-lg border border-slate-200 flex justify-between">
                  <span className="text-slate-500">Mandatory Rule Check</span>
                  <span className="font-bold text-emerald-600">Passed (4/4 Conditions)</span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200 flex justify-between">
                  <span className="text-slate-500">AI Suitability Probability</span>
                  <span className="font-bold text-brand-600">92.4% Match</span>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <p className="font-bold text-emerald-900 text-xs mb-1">Key Positive Factors:</p>
                  <ul className="list-disc list-inside text-[11px] text-emerald-800 space-y-0.5">
                    <li>CGPA 8.65 exceeds merit threshold of 7.5</li>
                    <li>Family income within priority subsidy band</li>
                    <li>Clean backlog history with verified attendance</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Roles Comparison: For Students vs For Administrators */}
      <section className="py-16 sm:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <h2 className="text-xs font-bold text-brand-600 uppercase tracking-widest">User Roles</h2>
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">Tailored Portals for Students & Administrators</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Student Role Card */}
            <div className="card-soft p-8 space-y-4 border-t-4 border-t-brand-600">
              <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-slate-900">For Students</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Discover matching scholarships, track application timelines, upload certificates, and receive explainable eligibility scores in seconds.
              </p>
              <ul className="text-xs text-slate-600 space-y-2 pt-2">
                <li className="flex items-center gap-2">✓ 5-Step Intuitive Profile Assessment</li>
                <li className="flex items-center gap-2">✓ Dynamic Scholarship Match Percentages</li>
                <li className="flex items-center gap-2">✓ Document Verification Status Vault</li>
                <li className="flex items-center gap-2">✓ 1-Click Application Submission</li>
              </ul>
              <div className="pt-4">
                <Link to="/register" className="inline-block px-4 py-2 text-xs font-bold text-brand-600 hover:text-brand-800 bg-brand-50 rounded-lg">
                  Create Student Account →
                </Link>
              </div>
            </div>

            {/* Admin Role Card */}
            <div className="card-soft p-8 space-y-4 border-t-4 border-t-indigo-600">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-slate-900">For Administrators</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Comprehensive analytics, applicant verification workflows, scholarship criteria configuration, and live ML model performance oversight.
              </p>
              <ul className="text-xs text-slate-600 space-y-2 pt-2">
                <li className="flex items-center gap-2">✓ Application Review, Approval & Remarks</li>
                <li className="flex items-center gap-2">✓ Add / Edit / Remove Scholarship Schemes</li>
                <li className="flex items-center gap-2">✓ Recharts Interactive Demographic Analytics</li>
                <li className="flex items-center gap-2">✓ Model Retraining & Confusion Matrix Inspector</li>
              </ul>
              <div className="pt-4">
                <Link to="/admin-login" className="inline-block px-4 py-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 rounded-lg">
                  Access Admin Console →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-brand-700 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 space-y-6">
          <h2 className="text-3xl font-extrabold tracking-tight">
            Ready to Discover Your Eligible Scholarships?
          </h2>
          <p className="text-sm text-brand-100 max-w-xl mx-auto">
            Take the free 5-minute assessment and let our Hybrid Expert System calculate your personalized recommendations.
          </p>
          <div className="pt-2">
            <Link
              to="/student/assessment"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-brand-800 bg-white hover:bg-brand-50 rounded-xl shadow-lg transition"
            >
              <span>Start Assessment Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
