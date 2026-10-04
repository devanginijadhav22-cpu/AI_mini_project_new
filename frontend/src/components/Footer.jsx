import React from 'react';
import { GraduationCap, Shield, BookOpen, ExternalLink } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="text-base font-bold text-slate-900 tracking-tight">
                Scholarship Eligibility Expert System
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed max-w-md">
              A hybrid Artificial Intelligence platform combining symbolic rule-based inference with 
              Gradient Boosting machine learning and Explainable AI (XAI) to deliver fair, transparent 
              scholarship matching for students nationwide.
            </p>
            <div className="flex items-center gap-3 pt-2 text-[11px] text-slate-400 font-medium">
              <span>National Scheme Compatible</span>
              <span>•</span>
              <span>55,000+ Validated Dataset</span>
              <span>•</span>
              <span>Explainable AI Engine</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Portal Services</h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li><a href="/student/assessment" className="hover:text-brand-600 transition">5-Step Eligibility Check</a></li>
              <li><a href="/student/scholarships" className="hover:text-brand-600 transition">Explore Scholarships</a></li>
              <li><a href="/student/dashboard" className="hover:text-brand-600 transition">Student Dashboard</a></li>
              <li><a href="/admin-login" className="hover:text-brand-600 transition">Administrative Console</a></li>
            </ul>
          </div>

          {/* System Transparency */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">AI & Governance</h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-brand-600" /> Statutory Criteria Compliance</li>
              <li className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5 text-brand-600" /> Explainable Decision Factors</li>
              <li className="flex items-center gap-1.5"><ExternalLink className="w-3.5 h-3.5 text-brand-600" /> Merit-cum-Means Standards</li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400 gap-2">
          <p>© {new Date().getFullYear()} Scholarship Eligibility Expert System. AI Mini Project.</p>
          <p>Built with FastAPI, Scikit-learn, React & Tailwind CSS</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
