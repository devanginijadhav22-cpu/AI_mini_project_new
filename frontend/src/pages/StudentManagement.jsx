import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { Users, Search, Filter, CheckCircle2, User, ChevronRight, X } from 'lucide-react';

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeStudent, setActiveStudent] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await adminAPI.getStudents();
      setStudents(res.data);
    } catch (err) {
      console.error("Error loading students", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = students.filter(s => {
    const matchesSearch = s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.course.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'All' || s.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="pb-4 border-b border-zinc-200">
        <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">Registered Student Directory</h1>
        <p className="text-xs text-zinc-500 mt-0.5">Centralized roster of students, academic records, and profile completion</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-3 rounded-xl border border-zinc-200/80 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search student name, email, or course..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-zinc-200 focus:outline-none focus:border-zinc-400 bg-zinc-50/30"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-xs text-zinc-500">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-800 focus:outline-none focus:border-zinc-400"
          >
            <option value="All">All Categories</option>
            <option value="General">General</option>
            <option value="OBC">OBC</option>
            <option value="SC">SC</option>
            <option value="ST">ST</option>
            <option value="EWS">EWS</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl border border-zinc-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/70 border-b border-zinc-200 text-zinc-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-4 font-medium">Student Name</th>
                <th className="py-2.5 px-4 font-medium">Email</th>
                <th className="py-2.5 px-4 font-medium">Course / Level</th>
                <th className="py-2.5 px-4 font-medium">Category</th>
                <th className="py-2.5 px-4 font-medium">CGPA</th>
                <th className="py-2.5 px-4 font-medium">Family Income</th>
                <th className="py-2.5 px-4 font-medium">Profile %</th>
                <th className="py-2.5 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-zinc-400">Loading student directory...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-zinc-400">No students found matching query.</td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-zinc-50/50 transition">
                    <td className="py-3 px-4 font-medium text-zinc-900 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-zinc-100 text-zinc-700 flex items-center justify-center font-medium text-[11px] border border-zinc-200">
                        {s.full_name?.charAt(0) || 'S'}
                      </div>
                      <span>{s.full_name}</span>
                    </td>
                    <td className="py-3 px-4 text-zinc-500 font-mono text-[11px]">{s.email}</td>
                    <td className="py-3 px-4">{s.course} ({s.education_level})</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
                        {s.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-zinc-900">{s.cgpa}</td>
                    <td className="py-3 px-4 text-zinc-700">₹{s.family_income?.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-16 bg-zinc-100 rounded-full h-1.5">
                          <div className="bg-zinc-900 h-1.5 rounded-full" style={{ width: `${s.profile_completion}%` }}></div>
                        </div>
                        <span className="text-[10px] text-zinc-500 font-mono">{s.profile_completion}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setActiveStudent(s)}
                        className="px-2.5 py-1 text-xs font-medium text-zinc-700 hover:text-zinc-950 bg-zinc-100 hover:bg-zinc-200 rounded-md transition border border-zinc-200"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Student Modal */}
      {activeStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-zinc-200 relative">
            <button
              onClick={() => setActiveStudent(null)}
              className="absolute top-4 right-4 p-1 text-zinc-400 hover:text-zinc-600 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-4">
              <div className="flex items-center space-x-3 pb-3 border-b border-zinc-100">
                <div className="w-10 h-10 rounded-lg bg-zinc-100 text-zinc-800 flex items-center justify-center font-medium text-base border border-zinc-200">
                  {activeStudent.full_name?.charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900">{activeStudent.full_name}</h3>
                  <p className="text-xs text-zinc-500 font-mono">{activeStudent.email}</p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-zinc-100">
                  <span className="text-zinc-500">Course / Branch:</span>
                  <span className="font-medium text-zinc-800">{activeStudent.course}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-100">
                  <span className="text-zinc-500">Education Level:</span>
                  <span className="text-zinc-800">{activeStudent.education_level}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-100">
                  <span className="text-zinc-500">Academic CGPA:</span>
                  <span className="font-semibold text-zinc-900">{activeStudent.cgpa} / 10.0</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-100">
                  <span className="text-zinc-500">Social Category:</span>
                  <span className="font-medium text-zinc-800">{activeStudent.category}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-100">
                  <span className="text-zinc-500">Annual Family Income:</span>
                  <span className="font-medium text-zinc-900">₹{activeStudent.family_income?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-100">
                  <span className="text-zinc-500">Registered On:</span>
                  <span className="text-zinc-600">{new Date(activeStudent.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="pt-2 text-right">
                <button
                  onClick={() => setActiveStudent(null)}
                  className="px-4 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-medium text-xs rounded-lg transition border border-zinc-200"
                >
                  Close Inspection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;
