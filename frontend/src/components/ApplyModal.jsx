import React, { useState } from 'react';
import { X, Award, AlertCircle, CheckCircle2 } from 'lucide-react';
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
      }, 1400);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to submit application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl max-w-md w-full p-6 border border-zinc-200 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-zinc-700 rounded-md hover:bg-zinc-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {success ? (
          <div className="text-center py-6 space-y-2.5">
            <div className="w-10 h-10 bg-zinc-100 text-zinc-900 rounded-full flex items-center justify-center mx-auto border border-zinc-200">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-900">Application Submitted</h3>
            <p className="text-xs text-zinc-500 max-w-xs mx-auto">
              Your application for <span className="font-medium text-zinc-800">{scholarship.title}</span> has been queued for verification.
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-start space-x-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-700 flex items-center justify-center shrink-0 mt-0.5">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 leading-snug">{scholarship.title}</h3>
                <p className="text-xs text-zinc-500 mt-0.5">{scholarship.provider}</p>
              </div>
            </div>

            <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200/80 mb-4 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-zinc-500">Grant Value:</span>
                <span className="font-semibold text-zinc-900">₹{scholarship.amount?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Deadline:</span>
                <span className="text-zinc-700">{scholarship.deadline}</span>
              </div>
            </div>

            {error && (
              <div className="p-3 mb-4 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Applicant Statement / Remarks (Optional)
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Optional details, academic notes, or reference details..."
                  rows="3"
                  className="w-full text-xs p-3 rounded-lg border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition-colors"
                ></textarea>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-md disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Submitting...' : 'Submit Application'}
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
