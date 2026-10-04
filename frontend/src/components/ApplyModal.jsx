import React, { useState } from 'react';
import { X, Send, Award, AlertCircle, CheckCircle2 } from 'lucide-react';
import { applicationAPI } from '../services/api';

const ApplyModal = ({ isOpen, onClose, scholarship, onSuccess }) => {
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen || !scholarship) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await applicationAPI.submit({
        scholarship_id: scholarship.id,
        remarks: remarks.trim() || undefined
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setRemarks('');
        onSuccess && onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to submit application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {success ? (
          <div className="text-center py-8 space-y-3">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Application Submitted!</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Your application for <span className="font-semibold text-slate-700">{scholarship.title}</span> has been forwarded for administrative verification.
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center border border-brand-200">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-snug">{scholarship.title}</h3>
                <p className="text-xs text-slate-500">{scholarship.provider}</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 mb-4 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Grant Amount:</span>
                <span className="font-bold text-slate-900">₹{scholarship.amount?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Application Deadline:</span>
                <span className="font-medium text-slate-700">{scholarship.deadline}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Verification Type:</span>
                <span className="font-medium text-emerald-600">Automated AI + Authority Attestation</span>
              </div>
            </div>

            {error && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Applicant Remarks / Statement of Justification (Optional)
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Provide any additional academic accomplishments, hardship notes, or institutional details..."
                  rows="3"
                  className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition"
                ></textarea>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm shadow-brand-500/20 flex items-center gap-1.5 disabled:opacity-50 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submitting ? 'Submitting...' : 'Confirm & Apply'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplyModal;
