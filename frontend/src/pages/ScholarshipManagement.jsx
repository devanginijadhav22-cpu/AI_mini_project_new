import React, { useState, useEffect } from 'react';
import { scholarshipAPI, adminAPI } from '../services/api';
import { 
  Award, Plus, Edit2, Trash2, X, Check, AlertCircle, 
  ShieldCheck, Calendar, DollarSign 
} from 'lucide-react';

const ScholarshipManagement = () => {
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingScholarship, setEditingScholarship] = useState(null);
  const [error, setError] = useState(null);

  // Form State
  const initialForm = {
    title: '',
    provider: '',
    description: '',
    amount: 25000,
    deadline: '31 December 2026',
    category: 'Merit-cum-Means',
    min_cgpa: 7.0,
    max_income: 600000,
    max_backlogs: 0,
    min_attendance: 75.0,
    required_category: 'All',
    required_education_level: 'Undergraduate',
    required_courses: 'All',
    required_documents: 'Income Certificate, Marksheet, Identity Proof',
    is_active: true
  };
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    fetchScholarships();
  }, []);

  const fetchScholarships = async () => {
    try {
      const res = await scholarshipAPI.getAll();
      setScholarships(res.data);
    } catch (err) {
      console.error("Error loading scholarships", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingScholarship(null);
    setFormData(initialForm);
    setIsModalOpen(true);
    setError(null);
  };

  const handleOpenEdit = (sch) => {
    setEditingScholarship(sch);
    setFormData({ ...sch });
    setIsModalOpen(true);
    setError(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to deactivate and remove this scholarship?")) return;
    try {
      await adminAPI.deleteScholarship(id);
      setScholarships(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      alert("Failed to delete scholarship");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const payload = {
      ...formData,
      amount: parseFloat(formData.amount),
      min_cgpa: parseFloat(formData.min_cgpa),
      max_income: parseFloat(formData.max_income),
      max_backlogs: parseInt(formData.max_backlogs),
      min_attendance: parseFloat(formData.min_attendance),
    };

    try {
      if (editingScholarship) {
        const res = await adminAPI.updateScholarship(editingScholarship.id, payload);
        setScholarships(prev => prev.map(s => s.id === editingScholarship.id ? res.data : s));
      } else {
        const res = await adminAPI.createScholarship(payload);
        setScholarships(prev => [res.data, ...prev]);
      }
      setIsModalOpen(false);
    } catch (err) {
      setError(err.response?.data?.detail || "Operation failed.");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Scholarship Schemes Management</h1>
          <p className="text-xs text-slate-500">Configure statutory criteria, allocation budgets, and application deadlines</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="self-start sm:self-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Scheme</span>
        </button>
      </div>

      {/* Scholarships Table */}
      <div className="card-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4 font-bold">Scheme Title & Provider</th>
                <th className="py-3 px-4 font-bold">Category</th>
                <th className="py-3 px-4 font-bold">Grant Amount</th>
                <th className="py-3 px-4 font-bold">Min CGPA</th>
                <th className="py-3 px-4 font-bold">Max Income</th>
                <th className="py-3 px-4 font-bold">Deadline</th>
                <th className="py-3 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">Loading scholarships...</td>
                </tr>
              ) : (
                scholarships.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900 leading-snug">{s.title}</p>
                      <p className="text-[11px] text-slate-500">{s.provider}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {s.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-extrabold text-slate-900">₹{s.amount?.toLocaleString()}</td>
                    <td className="py-3 px-4 font-bold text-indigo-600">≥ {s.min_cgpa}</td>
                    <td className="py-3 px-4">≤ ₹{s.max_income?.toLocaleString()}</td>
                    <td className="py-3 px-4 font-medium text-slate-600">{s.deadline}</td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => handleOpenEdit(s)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        title="Edit scheme"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete scheme"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Scholarship Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative my-8">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 mb-4">
              {editingScholarship ? "Edit Scholarship Scheme" : "Create New Scholarship Scheme"}
            </h3>

            {error && (
              <div className="p-3 mb-4 bg-rose-50 border border-rose-200 text-xs text-rose-700 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">Scholarship Title</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Provider Organization / Ministry</label>
                  <input
                    type="text"
                    required
                    value={formData.provider}
                    onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Scholarship Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Merit-cum-Means">Merit-cum-Means</option>
                    <option value="Girl Child & STEM">Girl Child & STEM</option>
                    <option value="Category Specific">Category Specific</option>
                    <option value="Merit">Merit</option>
                    <option value="Need-Based">Need-Based</option>
                    <option value="Disability / PwD">Disability / PwD</option>
                    <option value="Rural Upliftment">Rural Upliftment</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">Description</label>
                  <textarea
                    rows="2"
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Grant Amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-lg font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Application Deadline</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 15 December 2026"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Minimum CGPA</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.min_cgpa}
                    onChange={(e) => setFormData({ ...formData, min_cgpa: parseFloat(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Maximum Income Ceiling (₹)</label>
                  <input
                    type="number"
                    value={formData.max_income}
                    onChange={(e) => setFormData({ ...formData, max_income: parseFloat(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Target Category Restriction</label>
                  <select
                    value={formData.required_category}
                    onChange={(e) => setFormData({ ...formData, required_category: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="All">All Categories (Open)</option>
                    <option value="Female">Female Scholars Only</option>
                    <option value="OBC">OBC Candidates Only</option>
                    <option value="SC">SC Candidates Only</option>
                    <option value="ST">ST Candidates Only</option>
                    <option value="EWS">EWS Candidates Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Education Level</label>
                  <select
                    value={formData.required_education_level}
                    onChange={(e) => setFormData({ ...formData, required_education_level: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="All">All Levels</option>
                    <option value="Undergraduate">Undergraduate</option>
                    <option value="Postgraduate">Postgraduate</option>
                    <option value="Diploma">Diploma</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">Required Documents (Comma separated)</label>
                  <input
                    type="text"
                    value={formData.required_documents}
                    onChange={(e) => setFormData({ ...formData, required_documents: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm"
                >
                  {editingScholarship ? "Update Scheme" : "Create Scheme"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScholarshipManagement;
