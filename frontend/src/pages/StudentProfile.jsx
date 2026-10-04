import React, { useState, useEffect } from 'react';
import { studentAPI, documentAPI } from '../services/api';
import { 
  User, GraduationCap, DollarSign, Award, Upload, 
  FileText, CheckCircle2, AlertCircle, Save, ShieldCheck 
} from 'lucide-react';

const StudentProfile = () => {
  const [profileData, setProfileData] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploadType, setUploadType] = useState('Income Certificate');
  const [fileToUpload, setFileToUpload] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    fetchProfileAndDocs();
  }, []);

  const fetchProfileAndDocs = async () => {
    try {
      const [pRes, dRes] = await Promise.all([
        studentAPI.getProfile(),
        documentAPI.getAll()
      ]);
      setProfileData(pRes.data);
      setDocuments(dRes.data);
    } catch (err) {
      console.error("Error loading profile or docs", err);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (section, field, value) => {
    setProfileData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    try {
      await studentAPI.updateProfile(profileData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Error updating profile", err);
    } finally {
      setSaving(false);
    }
  };

  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (!fileToUpload) return;
    setUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    const formData = new FormData();
    formData.append('document_type', uploadType);
    formData.append('file', fileToUpload);

    try {
      const res = await documentAPI.upload(formData);
      setDocuments(prev => [res.data, ...prev]);
      setFileToUpload(null);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (err) {
      setUploadError(err.response?.data?.detail || "Upload failed. Please ensure file is PDF/JPG/PNG under 5MB.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const { profile, academics, financials, achievements } = profileData;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student Profile & Document Vault</h1>
          <p className="text-xs text-slate-500">Maintain verified records for automated scholarship qualification checks</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600">Profile Completion:</span>
          <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            {profileData.profile_completion_percentage}%
          </span>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>Profile changes saved successfully! Future assessments will automatically utilize this updated information.</span>
        </div>
      )}

      {/* Main Profile Edit Form */}
      <form onSubmit={handleSaveProfile} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="card-soft p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
              <User className="w-4 h-4 text-brand-600" />
              Personal & Demographics
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-medium">Age</label>
                <input
                  type="number"
                  value={profile.age}
                  onChange={(e) => handleProfileChange('profile', 'age', parseInt(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Gender</label>
                <select
                  value={profile.gender}
                  onChange={(e) => handleProfileChange('profile', 'gender', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">State</label>
                <input
                  type="text"
                  value={profile.state}
                  onChange={(e) => handleProfileChange('profile', 'state', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">City</label>
                <input
                  type="text"
                  value={profile.city}
                  onChange={(e) => handleProfileChange('profile', 'city', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Category</label>
                <select
                  value={profile.category}
                  onChange={(e) => handleProfileChange('profile', 'category', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs font-bold text-brand-700"
                >
                  <option value="General">General</option>
                  <option value="OBC">OBC</option>
                  <option value="SC">SC</option>
                  <option value="ST">ST</option>
                  <option value="EWS">EWS</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Regional Background</label>
                <select
                  value={profile.rural_urban}
                  onChange={(e) => handleProfileChange('profile', 'rural_urban', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="Urban">Urban</option>
                  <option value="Semi-Urban">Semi-Urban</option>
                  <option value="Rural">Rural</option>
                </select>
              </div>
            </div>
          </div>

          {/* Academic Records */}
          <div className="card-soft p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
              <GraduationCap className="w-4 h-4 text-brand-600" />
              Academic Credentials
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2">
                <label className="block text-slate-600 mb-1 font-medium">Course</label>
                <input
                  type="text"
                  value={academics.course}
                  onChange={(e) => handleProfileChange('academics', 'course', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">CGPA (0 - 10)</label>
                <input
                  type="number"
                  step="0.01"
                  value={academics.cgpa}
                  onChange={(e) => handleProfileChange('academics', 'cgpa', parseFloat(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs font-bold text-emerald-700"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Percentage (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={academics.percentage}
                  onChange={(e) => handleProfileChange('academics', 'percentage', parseFloat(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Active Backlogs</label>
                <input
                  type="number"
                  value={academics.backlogs}
                  onChange={(e) => handleProfileChange('academics', 'backlogs', parseInt(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Attendance (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={academics.attendance}
                  onChange={(e) => handleProfileChange('academics', 'attendance', parseFloat(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          {/* Financial Profile */}
          <div className="card-soft p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
              <DollarSign className="w-4 h-4 text-brand-600" />
              Financial & Socioeconomic
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2">
                <label className="block text-slate-600 mb-1 font-medium">Annual Family Income (₹)</label>
                <input
                  type="number"
                  value={financials.family_income}
                  onChange={(e) => handleProfileChange('financials', 'family_income', parseFloat(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Family Size</label>
                <input
                  type="number"
                  value={financials.family_size}
                  onChange={(e) => handleProfileChange('financials', 'family_size', parseInt(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Earning Members</label>
                <input
                  type="number"
                  value={financials.earning_members}
                  onChange={(e) => handleProfileChange('financials', 'earning_members', parseInt(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-slate-600 mb-1 font-medium">Parent's Occupation</label>
                <input
                  type="text"
                  value={financials.parent_occupation}
                  onChange={(e) => handleProfileChange('financials', 'parent_occupation', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          {/* Achievements */}
          <div className="card-soft p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
              <Award className="w-4 h-4 text-brand-600" />
              Achievements & Distinction
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-medium">Sports Achievement</label>
                <select
                  value={achievements.sports_achievement}
                  onChange={(e) => handleProfileChange('achievements', 'sports_achievement', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="None">None</option>
                  <option value="District">District</option>
                  <option value="State">State</option>
                  <option value="National">National</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Academic Distinction</label>
                <select
                  value={achievements.academic_achievement}
                  onChange={(e) => handleProfileChange('achievements', 'academic_achievement', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="None">None</option>
                  <option value="School/College Topper">Rank Holder</option>
                  <option value="Olympiad/Merit">Olympiad / Merit</option>
                  <option value="Research/Published">Research / Patent</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Certifications Count</label>
                <input
                  type="number"
                  value={achievements.certifications_count}
                  onChange={(e) => handleProfileChange('achievements', 'certifications_count', parseInt(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Extracurricular Score</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={achievements.extracurricular_score}
                  onChange={(e) => handleProfileChange('achievements', 'extracurricular_score', parseInt(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
          </button>
        </div>
      </form>

      {/* DOCUMENT VAULT & UPLOAD MANAGER */}
      <div className="card-soft p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              Verified Document Vault
            </h3>
            <p className="text-xs text-slate-500">Secure repository for statutory certificates and marksheet proofs</p>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {documents.length} Document(s) Uploaded
          </span>
        </div>

        {/* Upload Form */}
        <form onSubmit={handleUploadDocument} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <h4 className="text-xs font-bold text-slate-800">Upload New Official Document</h4>

          {uploadError && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-xs text-rose-700 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {uploadSuccess && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>Document uploaded and verified in vault!</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Document Type</label>
              <select
                value={uploadType}
                onChange={(e) => setUploadType(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
              >
                <option value="Income Certificate">Income Certificate (Tehsildar / ITR)</option>
                <option value="Marksheet / Transcripts">Marksheet / Transcripts</option>
                <option value="Caste / Category Certificate">Caste / Category Certificate</option>
                <option value="Disability Certificate (UDID)">Disability Certificate (UDID)</option>
                <option value="Identity Proof (Aadhaar / Passport)">Identity Proof (Aadhaar / Passport)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Select File (PDF, JPG, PNG)</label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setFileToUpload(e.target.files[0])}
                className="w-full text-xs p-1.5 rounded-lg border border-slate-300 bg-white file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[11px] file:bg-slate-100"
                required
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={uploading || !fileToUpload}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{uploading ? 'Encrypting & Uploading...' : 'Upload & Stamp'}</span>
              </button>
            </div>
          </div>
        </form>

        {/* Uploaded Documents Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-2.5 font-bold">Document Type</th>
                <th className="py-2.5 font-bold">File Name</th>
                <th className="py-2.5 font-bold">Upload Date</th>
                <th className="py-2.5 font-bold">Verification Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {documents.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-6 text-center text-slate-400">
                    No documents uploaded yet. Upload your income and academic proofs above.
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 font-semibold text-slate-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-brand-600" />
                      <span>{doc.document_type}</span>
                    </td>
                    <td className="py-3 text-slate-500 font-mono text-[11px]">{doc.filename}</td>
                    <td className="py-3 text-slate-500">{new Date(doc.uploaded_at).toLocaleDateString()}</td>
                    <td className="py-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{doc.verification_status}</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
