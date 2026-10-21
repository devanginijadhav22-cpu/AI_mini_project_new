import React, { useState, useEffect } from 'react';
import { scholarshipAPI, adminAPI } from '../services/api';
import { 
  Award, Plus, Edit2, Trash2, X, Check, AlertCircle, 
  ShieldCheck, Calendar, DollarSign, UserCheck, CheckCircle2 
} from 'lucide-react';

const ScholarshipManagement = () => {
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingScholarship, setEditingScholarship] = useState(null);
  const [error, setError] = useState(null);

  // Awardees Modal State
  const [awardeesModalSch, setAwardeesModalSch] = useState(null);
  const [awardees, setAwardees] = useState([]);
  const [loadingAwardees, setLoadingAwardees] = useState(false);

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

  const handleOpenAwardees = async (sch) => {
    setAwardeesModalSch(sch);
    setLoadingAwardees(true);
    try {
      const res = await adminAPI.getScholarshipAwards(sch.id);
      setAwardees(res.data);
    } catch (err) {
      console.error("Failed to load scholarship awards:", err);
    } finally {
      setLoadingAwardees(false);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">Scholarship Schemes Management</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Configure statutory criteria, allocation budgets, and application deadlines</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="self-start sm:self-auto px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium rounded-lg transition flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add New Scheme</span>
        </button>
      </div>

      {/* Scholarships Table */}
      <div className="bg-white rounded-xl border border-zinc-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/70 border-b border-zinc-200 text-zinc-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-4 font-medium">Scheme Title & Provider</th>
                <th className="py-2.5 px-4 font-medium">Category</th>
                <th className="py-2.5 px-4 font-medium">Grant Amount</th>
                <th className="py-2.5 px-4 font-medium">Min CGPA</th>
                <th className="py-2.5 px-4 font-medium">Max Income</th>
                <th className="py-2.5 px-4 font-medium">Deadline</th>
                <th className="py-2.5 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-zinc-400">Loading scholarships...</td>
                </tr>
              ) : (
                scholarships.map((s) => (
                  <tr key={s.id} className="hover:bg-zinc-50/50 transition">
                    <td className="py-3 px-4">
                      <p className="font-medium text-zinc-900 leading-snug">{s.title}</p>
                      <p className="text-[11px] text-zinc-500">{s.provider}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
                        {s.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-zinc-900">₹{s.amount?.toLocaleString()}</td>
                    <td className="py-3 px-4 font-medium text-zinc-800">≥ {s.min_cgpa}</td>
                    <td className="py-3 px-4 text-zinc-600">≤ ₹{s.max_income?.toLocaleString()}</td>
                    <td className="py-3 px-4 text-zinc-600">{s.deadline}</td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => handleOpenAwardees(s)}
                        className="p-1.5 text-zinc-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition"
                        title="View approved scholars & awards"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(s)}
                        className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition"
                        title="Edit scheme"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 sm:p-7 shadow-xl border border-zinc-200 relative my-8">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1 text-zinc-400 hover:text-zinc-600 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-sm font-semibold text-zinc-900 pb-3 border-b border-zinc-100 mb-4">
              {editingScholarship ? "Edit Scholarship Scheme" : "Create New Scholarship Scheme"}
            </h3>

            {error && (
              <div className="p-2.5 mb-4 bg-rose-50 border border-rose-200 text-xs text-rose-700 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-zinc-700 font-medium mb-1">Scholarship Title</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-lg bg-zinc-50/30 focus:outline-none focus:border-zinc-400"
                  />
                </div>

                <div>
                  <label className="block text-zinc-700 font-medium mb-1">Provider Organization / Ministry</label>
                  <input
                    type="text"
                    required
                    value={formData.provider}
                    onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-lg bg-zinc-50/30 focus:outline-none focus:border-zinc-400"
                  />
                </div>

                <div>
                  <label className="block text-zinc-700 font-medium mb-1">Scholarship Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-lg bg-white focus:outline-none focus:border-zinc-400"
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
                  <label className="block text-zinc-700 font-medium mb-1">Description</label>
                  <textarea
                    rows="2"
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-lg bg-zinc-50/30 focus:outline-none focus:border-zinc-400"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-zinc-700 font-medium mb-1">Grant Amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                    className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-lg font-medium text-zinc-900 bg-zinc-50/30 focus:outline-none focus:border-zinc-400"
                  />
                </div>

                <div>
                  <label className="block text-zinc-700 font-medium mb-1">Application Deadline</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 15 December 2026"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-lg bg-zinc-50/30 focus:outline-none focus:border-zinc-400"
                  />
                </div>

                <div>
                  <label className="block text-zinc-700 font-medium mb-1">Minimum CGPA</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.min_cgpa}
                    onChange={(e) => setFormData({ ...formData, min_cgpa: parseFloat(e.target.value) })}
                    className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-lg bg-zinc-50/30 focus:outline-none focus:border-zinc-400"
                  />
                </div>

                <div>
                  <label className="block text-zinc-700 font-medium mb-1">Maximum Income Ceiling (₹)</label>
                  <input
                    type="number"
                    value={formData.max_income}
                    onChange={(e) => setFormData({ ...formData, max_income: parseFloat(e.target.value) })}
                    className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-lg bg-zinc-50/30 focus:outline-none focus:border-zinc-400"
                  />
                </div>

                <div>
                  <label className="block text-zinc-700 font-medium mb-1">Target Category Restriction</label>
                  <select
                    value={formData.required_category}
                    onChange={(e) => setFormData({ ...formData, required_category: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-lg bg-white focus:outline-none focus:border-zinc-400"
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
                  <label className="block text-zinc-700 font-medium mb-1">Education Level</label>
                  <select
                    value={formData.required_education_level}
                    onChange={(e) => setFormData({ ...formData, required_education_level: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-lg bg-white focus:outline-none focus:border-zinc-400"
                  >
                    <option value="All">All Levels</option>
                    <option value="Undergraduate">Undergraduate</option>
                    <option value="Postgraduate">Postgraduate</option>
                    <option value="Diploma">Diploma</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-zinc-700 font-medium mb-1">Required Documents (Comma separated)</label>
                  <input
                    type="text"
                    value={formData.required_documents}
                    onChange={(e) => setFormData({ ...formData, required_documents: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-lg bg-zinc-50/30 focus:outline-none focus:border-zinc-400"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg transition border border-zinc-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white font-medium rounded-lg transition"
                >
                  {editingScholarship ? "Update Scheme" : "Create Scheme"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Approved Scholars & Awardees Modal */}
      {awardeesModalSch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-xl max-w-3xl w-full p-6 shadow-xl border border-zinc-200 relative my-8 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                  Awarded Scholars Registry
                </span>
                <h3 className="text-base font-semibold text-zinc-900">
                  {awardeesModalSch.title}
                </h3>
                <p className="text-xs text-zinc-500">
                  Provider: {awardeesModalSch.provider} • Grant: ₹{awardeesModalSch.amount?.toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setAwardeesModalSch(null)}
                className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {loadingAwardees ? (
              <div className="py-12 flex justify-center">
                <div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin"></div>
              </div>
            ) : awardees.length === 0 ? (
              <div className="py-10 text-center text-xs text-zinc-500 space-y-1">
                <Award className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                <p className="font-medium text-zinc-800">No approved applications yet for this scheme.</p>
                <p>When administrators approve student applications, they will be listed here with decision timestamps.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-zinc-200 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 text-zinc-500 font-semibold border-b border-zinc-200">
                    <tr>
                      <th className="py-2.5 px-3">Applicant</th>
                      <th className="py-2.5 px-3">Approval Date</th>
                      <th className="py-2.5 px-3">Award Status</th>
                      <th className="py-2.5 px-3">Decision Remarks</th>
                      <th className="py-2.5 px-3">Disbursement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-zinc-700">
                    {awardees.map((aw) => (
                      <tr key={aw.application_id} className="hover:bg-zinc-50/50">
                        <td className="py-2.5 px-3">
                          <p className="font-semibold text-zinc-900">{aw.student_name}</p>
                          <p className="text-[10px] text-zinc-400">{aw.student_email}</p>
                        </td>
                        <td className="py-2.5 px-3 text-zinc-600 whitespace-nowrap">
                          {aw.decision_date ? new Date(aw.decision_date).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            aw.award_status === 'DISBURSED'
                              ? 'bg-purple-50 text-purple-800 border-purple-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}>
                            {aw.award_status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 max-w-xs truncate text-zinc-600" title={aw.decision_remarks}>
                          {aw.decision_remarks || 'Official sanction.'}
                        </td>
                        <td className="py-2.5 px-3 text-[11px] whitespace-nowrap">
                          {aw.disbursed_at ? (
                            <span className="text-purple-700 font-mono">
                              Ref: {aw.disbursement_reference}
                            </span>
                          ) : (
                            <span className="text-zinc-400 italic">Pending Disbursement</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-zinc-100">
              <button
                onClick={() => setAwardeesModalSch(null)}
                className="px-4 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-medium rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScholarshipManagement;

