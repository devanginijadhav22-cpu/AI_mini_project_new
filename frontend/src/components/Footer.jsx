import React from 'react';
import { GraduationCap } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-zinc-200 mt-auto py-8 text-xs text-zinc-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded bg-zinc-900 flex items-center justify-center text-white">
              <GraduationCap className="w-3.5 h-3.5" />
            </div>
            <span className="font-medium text-zinc-900">ScholarAI Expert System</span>
            <span className="text-zinc-300">•</span>
            <span>Deterministic Rules & Gradient Boosting AI</span>
          </div>
          
          <div className="flex items-center space-x-6 text-zinc-500">
            <a href="/student/assessment" className="hover:text-zinc-900 transition-colors">Eligibility Check</a>
            <a href="/student/scholarships" className="hover:text-zinc-900 transition-colors">Schemes</a>
            <a href="/admin-login" className="hover:text-zinc-900 transition-colors">Admin Portal</a>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-zinc-100 flex flex-col sm:flex-row justify-between items-center text-[11px] text-zinc-400 gap-2">
          <p>© {new Date().getFullYear()} Scholarship Eligibility Expert System. Academic Research Platform.</p>
          <p>Trained on 55,000+ benchmarked student profiles</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
