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
        <div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  const { profile, academics, financials, achievements } = profileData;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">Student Profile & Document Vault</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Verified credentials used for automated scholarship eligibility evaluations</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">Profile Completion:</span>
          <span className="text-xs font-semibold text-zinc-900 bg-zinc-100 px-2.5 py-1 rounded-md border border-zinc-200">
            {profileData.profile_completion_percentage}%
          </span>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-zinc-50 border border-zinc-200 text-xs text-zinc-800 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>Profile changes saved successfully. All future assessments will use these updated credentials.</span>
        </div>
      )}

      {/* Main Profile Edit Form */}
      <form onSubmit={handleSaveProfile} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Personal Information */}
          <div className="bg-white p-5 rounded-xl border border-zinc-200/80 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-700 flex items-center gap-2 pb-2 border-b border-zinc-100">
              <User className="w-4 h-4 text-zinc-500" />
              Personal & Demographics
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-zinc-600 mb-1 font-medium">Age</label>
                <input
                  type="number"
                  value={profile.age}
                  onChange={(e) => handleProfileChange('profile', 'age', parseInt(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-zinc-400 bg-zinc-50/30"
                />
              </div>

              <div>
                <label className="block text-zinc-600 mb-1 font-medium">Gender</label>
                <select
                  value={profile.gender}
                  onChange={(e) => handleProfileChange('profile', 'gender', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-zinc-400 bg-white"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-600 mb-1 font-medium">State</label>
                <input
                  type="text"
                  value={profile.state}
                  onChange={(e) => handleProfileChange('profile', 'state', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-zinc-400 bg-zinc-50/30"
                />
              </div>

              <div>
                <label className="block text-zinc-600 mb-1 font-medium">City</label>
                <input
                  type="text"
                  value={profile.city}
                  onChange={(e) => handleProfileChange('profile', 'city', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-zinc-400 bg-zinc-50/30"
                />
              </div>

              <div>
                <label className="block text-zinc-600 mb-1 font-medium">Regional Background</label>
                <select
                  value={profile.rural_urban}
                  onChange={(e) => handleProfileChange('profile', 'rural_urban', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-zinc-400 bg-white"
                >
                  <option value="Urban">Urban</option>
                  <option value="Semi-Urban">Semi-Urban</option>
                  <option value="Rural">Rural</option>
                </select>
              </div>
            </div>
          </div>

          {/* Academic Records */}
          <div className="bg-white p-5 rounded-xl border border-zinc-200/80 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-700 flex items-center gap-2 pb-2 border-b border-zinc-100">
              <GraduationCap className="w-4 h-4 text-zinc-500" />
              Academic Credentials
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2">
                <label className="block text-zinc-600 mb-1 font-medium">Course of Study</label>
                <input
                  type="text"
                  value={academics.course}
                  onChange={(e) => handleProfileChange('academics', 'course', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-lg text-xs font-medium text-zinc-900 focus:outline-none focus:border-zinc-400 bg-zinc-50/30"
                />
              </div>

              <div>
                <label className="block text-zinc-600 mb-1 font-medium">CGPA (0 - 10)</label>
                <input
                  type="number"
                  step="0.01"
                  value={academics.cgpa}
                  onChange={(e) => handleProfileChange('academics', 'cgpa', parseFloat(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-lg text-xs font-medium text-zinc-900 focus:outline-none focus:border-zinc-400 bg-zinc-50/30"
                />
              </div>

              <div>
                <label className="block text-zinc-600 mb-1 font-medium">Percentage (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={academics.percentage}
                  onChange={(e) => handleProfileChange('academics', 'percentage', parseFloat(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-zinc-400 bg-zinc-50/30"
                />
              </div>

              <div>
                <label className="block text-zinc-600 mb-1 font-medium">Active Backlogs</label>
                <input
                  type="number"
                  value={academics.backlogs}
                  onChange={(e) => handleProfileChange('academics', 'backlogs', parseInt(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-zinc-400 bg-zinc-50/30"
                />
              </div>

              <div>
                <label className="block text-zinc-600 mb-1 font-medium">Attendance (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={academics.attendance}
                  onChange={(e) => handleProfileChange('academics', 'attendance', parseFloat(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-zinc-400 bg-zinc-50/30"
                />
              </div>
            </div>
          </div>

          {/* Financial Profile */}
          <div className="bg-white p-5 rounded-xl border border-zinc-200/80 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-700 flex items-center gap-2 pb-2 border-b border-zinc-100">
              <DollarSign className="w-4 h-4 text-zinc-500" />
              Financial & Socioeconomic
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2">
                <label className="block text-zinc-600 mb-1 font-medium">Annual Family Income (₹)</label>
                <input
                  type="number"
                  value={financials.family_income}
                  onChange={(e) => handleProfileChange('financials', 'family_income', parseFloat(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-lg text-xs font-medium text-zinc-900 focus:outline-none focus:border-zinc-400 bg-zinc-50/30"
                />
              </div>

              <div>
                <label className="block text-zinc-600 mb-1 font-medium">Family Size</label>
                <input
                  type="number"
                  value={financials.family_size}
                  onChange={(e) => handleProfileChange('financials', 'family_size', parseInt(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-zinc-400 bg-zinc-50/30"
                />
              </div>

              <div>
                <label className="block text-zinc-600 mb-1 font-medium">Earning Members</label>
                <input
                  type="number"
                  value={financials.earning_members}
                  onChange={(e) => handleProfileChange('financials', 'earning_members', parseInt(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-zinc-400 bg-zinc-50/30"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-zinc-600 mb-1 font-medium">Parent's Occupation</label>
                <input
                  type="text"
                  value={financials.parent_occupation}
                  onChange={(e) => handleProfileChange('financials', 'parent_occupation', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-zinc-400 bg-zinc-50/30"
                />
              </div>
            </div>
          </div>

          {/* Achievements */}
          <div className="bg-white p-5 rounded-xl border border-zinc-200/80 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-700 flex items-center gap-2 pb-2 border-b border-zinc-100">
              <Award className="w-4 h-4 text-zinc-500" />
              Achievements & Distinction
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-zinc-600 mb-1 font-medium">Sports Achievement</label>
                <select
                  value={achievements.sports_achievement}
                  onChange={(e) => handleProfileChange('achievements', 'sports_achievement', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-zinc-400 bg-white"
                >
                  <option value="None">None</option>
                  <option value="District">District</option>
                  <option value="State">State</option>
                  <option value="National">National</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-600 mb-1 font-medium">Academic Distinction</label>
                <select
                  value={achievements.academic_achievement}
                  onChange={(e) => handleProfileChange('achievements', 'academic_achievement', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-zinc-400 bg-white"
                >
                  <option value="None">None</option>
                  <option value="School/College Topper">Rank Holder</option>
                  <option value="Olympiad/Merit">Olympiad / Merit</option>
                  <option value="Research/Published">Research / Patent</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-600 mb-1 font-medium">Certifications Count</label>
                <input
                  type="number"
                  value={achievements.certifications_count}
                  onChange={(e) => handleProfileChange('achievements', 'certifications_count', parseInt(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-zinc-400 bg-zinc-50/30"
                />
              </div>

              <div>
                <label className="block text-zinc-600 mb-1 font-medium">Extracurricular Score (1-10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={achievements.extracurricular_score}
                  onChange={(e) => handleProfileChange('achievements', 'extracurricular_score', parseInt(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-zinc-400 bg-zinc-50/30"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs rounded-lg transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
          </button>
        </div>
      </form>

      {/* DOCUMENT VAULT & UPLOAD MANAGER */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-zinc-200/80 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-100">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-zinc-700" />
              Verified Document Vault
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">Statutory certificates and marksheets verified for scholarship applications</p>
          </div>
          <span className="text-xs text-zinc-500 font-mono">
            {documents.length} document{documents.length === 1 ? '' : 's'} stored
          </span>
        </div>

        {/* Upload Form */}
        <form onSubmit={handleUploadDocument} className="p-4 bg-zinc-50/60 rounded-lg border border-zinc-200/80 space-y-3">
          <h4 className="text-xs font-semibold text-zinc-800">Upload Official Document</h4>

          {uploadError && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-xs text-rose-700 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {uploadSuccess && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>Document uploaded and verified in vault.</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-zinc-600 mb-1">Document Type</label>
              <select
                value={uploadType}
                onChange={(e) => setUploadType(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-zinc-200 bg-white focus:outline-none focus:border-zinc-400"
              >
                <option value="Income Certificate">Income Certificate</option>
                <option value="Marksheet / Transcripts">Marksheet / Transcripts</option>
                <option value="Caste / Category Certificate">Caste / Category Certificate</option>
                <option value="Disability Certificate (UDID)">Disability Certificate (UDID)</option>
                <option value="Identity Proof (Aadhaar / Passport)">Identity Proof (Aadhaar / Passport)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-600 mb-1">File (PDF, JPG, PNG)</label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setFileToUpload(e.target.files[0])}
                className="w-full text-xs px-2 py-1 rounded-lg border border-zinc-200 bg-white file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[11px] file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200"
                required
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={uploading || !fileToUpload}
                className="w-full py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs rounded-lg transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{uploading ? 'Uploading...' : 'Upload Document'}</span>
              </button>
            </div>
          </div>
        </form>

        {/* Uploaded Documents Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-200 text-zinc-400 uppercase tracking-wider text-[10px]">
                <th className="py-2.5 font-medium">Document Type</th>
                <th className="py-2.5 font-medium">File Name</th>
                <th className="py-2.5 font-medium">Uploaded</th>
                <th className="py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              {documents.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-6 text-center text-zinc-400">
                    No documents uploaded yet.
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-zinc-50/50 transition">
                    <td className="py-3 font-medium text-zinc-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-zinc-500" />
                      <span>{doc.document_type}</span>
                    </td>
                    <td className="py-3 text-zinc-500 font-mono text-[11px]">{doc.filename}</td>
                    <td className="py-3 text-zinc-500">{new Date(doc.uploaded_at).toLocaleDateString()}</td>
                    <td className="py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
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

