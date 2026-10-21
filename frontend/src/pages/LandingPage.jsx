import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Shield, Cpu, Users } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="bg-[#fafafa] min-h-screen">
      {/* Hero Section */}
      <section className="pt-16 pb-20 lg:pt-24 lg:pb-28 border-b border-zinc-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-50 border border-zinc-200 text-zinc-700 text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-900"></span>
            <span>Deterministic Rules & Gradient Boosting AI</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-5xl font-semibold text-zinc-950 tracking-tight leading-[1.15] max-w-3xl mx-auto">
            Transparent, multi-criteria scholarship matching for students.
          </h1>

          <p className="text-sm sm:text-base text-zinc-600 max-w-2xl mx-auto mt-5 leading-relaxed">
            A dual-engine platform combining statutory rule compliance with machine learning to evaluate student eligibility, explain decisions, and match verified schemes.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-8">
            <Link
              to="/student/assessment"
              className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <span>Check Eligibility</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/student/scholarships"
              className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-zinc-700 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-lg transition-colors"
            >
              Explore Schemes
            </Link>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-12 border-t border-zinc-100 mt-16 text-left">
            <div>
              <p className="text-xl font-semibold text-zinc-950 tracking-tight">55,000+</p>
              <p className="text-xs text-zinc-500 mt-0.5">Benchmarked Records</p>
            </div>
            <div>
              <p className="text-xl font-semibold text-zinc-950 tracking-tight">96.4%</p>
              <p className="text-xs text-zinc-500 mt-0.5">Model F1 Score</p>
            </div>
            <div>
              <p className="text-xl font-semibold text-zinc-950 tracking-tight">100%</p>
              <p className="text-xs text-zinc-500 mt-0.5">Explainable Decisions</p>
            </div>
            <div>
              <p className="text-xl font-semibold text-zinc-950 tracking-tight">45 / 55</p>
              <p className="text-xs text-zinc-500 mt-0.5">Rules / ML Synergy</p>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="py-16 sm:py-20 bg-[#fafafa]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-left mb-10">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Process</p>
            <h2 className="text-xl sm:text-2xl font-semibold text-zinc-950 mt-1">How the Expert System Works</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border border-zinc-200 rounded-lg p-5 space-y-2">
              <span className="text-xs font-mono font-medium text-zinc-400">01</span>
              <h3 className="text-sm font-semibold text-zinc-900">Profile Submission</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Provide academic credentials, examination marks, and family income in a structured wizard.
              </p>
            </div>

            <div className="bg-white border border-zinc-200 rounded-lg p-5 space-y-2">
              <span className="text-xs font-mono font-medium text-zinc-400">02</span>
              <h3 className="text-sm font-semibold text-zinc-900">Rule Validation</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Deterministic checks verify income limits, backlog thresholds, and minimum attendance norms.
              </p>
            </div>

            <div className="bg-white border border-zinc-200 rounded-lg p-5 space-y-2">
              <span className="text-xs font-mono font-medium text-zinc-400">03</span>
              <h3 className="text-sm font-semibold text-zinc-900">ML Inference</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Gradient Boosting model calculates peer competitiveness across 79 transformed features.
              </p>
            </div>

            <div className="bg-white border border-zinc-200 rounded-lg p-5 space-y-2">
              <span className="text-xs font-mono font-medium text-zinc-400">04</span>
              <h3 className="text-sm font-semibold text-zinc-900">Explainable Match</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Receive ranked recommendations with positive factors and actionable improvement suggestions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Explainable AI Section */}
      <section className="py-16 sm:py-20 bg-white border-t border-b border-zinc-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Transparency</p>
                <h2 className="text-2xl font-semibold text-zinc-950 mt-1">
                  Decisions you can understand and trust.
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                Unlike opaque black-box scoring, our system deconstructs evaluations into explicit regulatory compliance and positive merit drivers.
              </p>

              <div className="space-y-3 pt-2 text-xs">
                <div className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-zinc-900 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-zinc-900">Positive Factors:</span>
                    <span className="text-zinc-600 ml-1">Identifies merit achievements, high attendance, and need-based priority.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-zinc-900 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-zinc-900">Actionable Advice:</span>
                    <span className="text-zinc-600 ml-1">Pinpoints specific areas like backlog clearance and certificate uploads.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-zinc-900 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-zinc-900">Administrative Oversight:</span>
                    <span className="text-zinc-600 ml-1">Provides confusion matrices and feature importance rankings for governance.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sample Evaluation Preview */}
            <div className="bg-[#fafafa] border border-zinc-200 rounded-lg p-5 space-y-3.5">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
                <span className="text-xs font-medium text-zinc-900">Evaluation Sample</span>
                <span className="text-xs font-medium px-2 py-0.5 bg-zinc-100 text-zinc-800 rounded border border-zinc-200">
                  Score: 88.5 / 100
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-white rounded border border-zinc-200 flex justify-between">
                  <span className="text-zinc-600">Statutory Rules Compliance</span>
                  <span className="font-medium text-zinc-900">Passed (4/4)</span>
                </div>
                <div className="p-3 bg-white rounded border border-zinc-200 flex justify-between">
                  <span className="text-zinc-600">ML Peer Competitiveness</span>
                  <span className="font-medium text-zinc-900">92.4% Probability</span>
                </div>
                <div className="p-3 bg-white rounded border border-zinc-200 space-y-1">
                  <p className="font-medium text-zinc-900">Primary Positive Drivers</p>
                  <p className="text-zinc-500 text-[11px] leading-relaxed">
                    CGPA 8.65 exceeds requirement • Family income within priority band • Clean academic record
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* User Portals Overview */}
      <section className="py-16 sm:py-20 bg-[#fafafa]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Student Workspace Card */}
            <div className="bg-white border border-zinc-200 rounded-lg p-6 space-y-4">
              <div className="w-8 h-8 rounded bg-zinc-100 text-zinc-900 flex items-center justify-center border border-zinc-200">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-zinc-950">Student Portal</h3>
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                  Guided profile assessment, document vault, personalized matching schemes, and application tracking.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center text-xs font-medium text-zinc-900 hover:text-zinc-700 gap-1"
                >
                  <span>Student sign in</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Admin Console Card */}
            <div className="bg-white border border-zinc-200 rounded-lg p-6 space-y-4">
              <div className="w-8 h-8 rounded bg-zinc-100 text-zinc-900 flex items-center justify-center border border-zinc-200">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-zinc-950">Administrative Console</h3>
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                  Scheme criteria management, applicant status updates, demographic analytics, and model monitoring.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  to="/admin-login"
                  className="inline-flex items-center text-xs font-medium text-zinc-900 hover:text-zinc-700 gap-1"
                >
                  <span>Administrator sign in</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Clean Call to Action */}
      <section className="py-14 bg-zinc-900 text-white text-center">
        <div className="max-w-3xl mx-auto px-4 space-y-4">
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">
            Ready to assess your scholarship eligibility?
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto leading-relaxed">
            Complete the 5-step profile to evaluate your qualifications across national and foundation schemes.
          </p>
          <div className="pt-2">
            <Link
              to="/student/assessment"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-zinc-950 bg-white hover:bg-zinc-100 rounded-md transition-colors"
            >
              <span>Begin Assessment</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
