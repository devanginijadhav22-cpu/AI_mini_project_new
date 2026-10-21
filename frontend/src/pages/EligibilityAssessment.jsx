import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { studentAPI, eligibilityAPI } from '../services/api';
import { 
  ArrowRight, ArrowLeft, Check, User, 
  GraduationCap, DollarSign, Award, CheckSquare, AlertCircle, 
  Sparkles, CheckCircle2 
} from 'lucide-react';

const EligibilityAssessment = ({ isOnboarding = false }) => {
  const navigate = useNavigate();
  const { updateProfileCompletion } = useAuth();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [profileStatus, setProfileStatus] = useState({
    completion: 0,
    isComplete: false,
    missingSections: [],
    missingFields: {}
  });
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Form State initialized with defaults
  const [formData, setFormData] = useState({
    // Step 1: Personal
    age: '',
    gender: 'Female',
    state: 'Maharashtra',
    city: '',
    disability: 0,
    rural_urban: 'Urban',
    first_generation: 0,
    institution_type: 'Government',
    hostel_day_scholar: 'Day Scholar',

    // Step 2: Academic
    education_level: 'Undergraduate',
    course: 'Computer Science & IT',
    year_of_study: 1,
    cgpa: '',
    percentage: '',
    backlogs: 0,
    attendance: '',
    previous_scholarship: 0,

    // Step 3: Financial
    family_income: '',
    family_size: 4,
    parent_occupation: 'Farmer / Agriculture',
    earning_members: 1,
    financial_dependency: 'Both Parents',

    // Step 4: Achievements
    sports_achievement: 'None',
    academic_achievement: 'None',
    extracurricular_score: 5,
    certifications_count: 0,
    leadership_experience: false,
  });

  // Pre-load student's authoritative saved profile from backend
  useEffect(() => {
    const fetchExisting = async () => {
      try {
        const res = await studentAPI.getProfile();
        const data = res.data;
        const { profile, academics, financials, achievements } = data;

        const mergeNonNull = (obj) => {
          if (!obj) return {};
          return Object.fromEntries(
            Object.entries(obj).filter(([, v]) => v !== null && v !== undefined && v !== '')
          );
        };

        setFormData(prev => ({
          ...prev,
          ...mergeNonNull(profile),
          ...mergeNonNull(academics),
          ...mergeNonNull(financials),
          ...mergeNonNull(achievements),
        }));

        const isComplete = data.profile_is_complete || data.profile_completion_percentage === 100;
        const missingSections = data.missing_sections || [];
        const missingFields = data.missing_fields || {};

        setProfileStatus({
          completion: data.profile_completion_percentage || 0,
          isComplete,
          missingSections,
          missingFields
        });

        // If in onboarding mode and profile is ALREADY 100% complete, redirect directly to dashboard
        if (isOnboarding && isComplete) {
          navigate('/student/dashboard', { replace: true });
          return;
        }

        // If incomplete, direct student directly to the first step with missing information
        if (!isComplete && missingSections.length > 0) {
          if (missingSections.includes('personal')) setStep(1);
          else if (missingSections.includes('academic')) setStep(2);
          else if (missingSections.includes('financial')) setStep(3);
          else if (missingSections.includes('achievements')) setStep(4);
        }
      } catch (err) {
        console.error("Error loading profile for assessment:", err);
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchExisting();
  }, [isOnboarding, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? (value === '' ? '' : parseFloat(value)) : value)
    }));
  };

  const validateStep = (currentStep) => {
    if (currentStep === 1) {
      if (!formData.age || formData.age <= 0) return 'Please specify a valid student age.';
      if (!formData.city || formData.city.trim() === '') return 'Please enter your city/district.';
      if (!formData.state || formData.state.trim() === '') return 'Please select your state.';
    }
    if (currentStep === 2) {
      if (!formData.course || formData.course.trim() === '') return 'Please enter your course/discipline.';
      if (formData.cgpa === '' || formData.cgpa === null || parseFloat(formData.cgpa) <= 0) return 'Please specify a valid CGPA (> 0).';
      if (formData.attendance === '' || formData.attendance === null || parseFloat(formData.attendance) <= 0) return 'Please specify attendance percentage (> 0).';
    }
    if (currentStep === 3) {
      if (formData.family_income === '' || formData.family_income === null || parseFloat(formData.family_income) <= 0) return 'Please specify annual family income (> 0).';
      if (!formData.family_size || parseInt(formData.family_size) <= 0) return 'Please specify total family members.';
      if (!formData.earning_members || parseInt(formData.earning_members) <= 0) return 'Please specify earning members.';
    }
    if (currentStep === 4) {
      if (!formData.sports_achievement) return 'Please select a sports achievement category.';
      if (!formData.academic_achievement) return 'Please select an academic honors category.';
    }
    return null;
  };

  const handleNext = () => {
    setError(null);
    const stepError = validateStep(step);
    if (stepError) {
      setError(stepError);
      return;
    }
    setStep(prev => Math.min(prev + 1, 5));
  };

  const handlePrev = () => {
    setError(null);
    setStep(prev => Math.max(prev - 1, 1));
  };

  // Fast-track evaluation using saved database records
  const handleFastEvaluation = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await eligibilityAPI.verify();
      navigate('/student/results', { state: { result: res.data } });
    } catch (err) {
      setError(err.response?.data?.detail?.message || err.response?.data?.detail || "Evaluation failed. Please review your profile fields.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        age: parseInt(formData.age) || 20,
        disability: parseInt(formData.disability) || 0,
        first_generation: parseInt(formData.first_generation) || 0,
        year_of_study: parseInt(formData.year_of_study) || 1,
        cgpa: parseFloat(formData.cgpa) || 0.0,
        percentage: parseFloat(formData.percentage) || 0.0,
        backlogs: parseInt(formData.backlogs) || 0,
        attendance: parseFloat(formData.attendance) || 0.0,
        previous_scholarship: parseInt(formData.previous_scholarship) || 0,
        family_income: parseFloat(formData.family_income) || 0.0,
        family_size: parseInt(formData.family_size) || 1,
        earning_members: parseInt(formData.earning_members) || 1,
        extracurricular_score: parseInt(formData.extracurricular_score) || 5,
        certifications_count: parseInt(formData.certifications_count) || 0,
        leadership_experience: Boolean(formData.leadership_experience),
      };

      const res = await eligibilityAPI.checkEligibility(payload);

      // Update auth context state with completed profile
      if (updateProfileCompletion) {
        updateProfileCompletion({
          profile_is_complete: true,
          profile_completion_percentage: 100
        });
      }

      if (isOnboarding) {
        // Requirement 1.6: Once onboarding is complete, take student to dashboard
        navigate('/student/dashboard', { 
          replace: true,
          state: { onboardingComplete: true }
        });
      } else {
        navigate('/student/results', { state: { result: res.data } });
      }
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'object' ? (detail.message || JSON.stringify(detail)) : (detail || "Assessment submission failed. Please verify all required fields."));
    } finally {
      setSubmitting(false);
    }
  };

  const stepTitles = [
    { num: 1, label: "Personal", icon: User },
    { num: 2, label: "Academic", icon: GraduationCap },
    { num: 3, label: "Financial", icon: DollarSign },
    { num: 4, label: "Achievements", icon: Award },
    { num: 5, label: "Review", icon: CheckSquare },
  ];

  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Title & Context Header */}
      <div className="text-left pb-2 border-b border-zinc-200">
        <h1 className="text-xl sm:text-2xl font-semibold text-zinc-950 tracking-tight">
          {isOnboarding ? "Student Onboarding & Profile Setup" : "Scholarship Eligibility Wizard"}
        </h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          {isOnboarding 
            ? "Unified student setup: your credentials will be authoritative for both your profile and automated AI assessment."
            : "Evaluated synchronously by deterministic statutory rules (45%) and Gradient Boosting AI (55%)."}
        </p>
      </div>

      {/* Returning Student Complete Profile Banner with Fast-Track Option */}
      {!isOnboarding && profileStatus.isComplete && (
        <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-emerald-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Profile 100% Complete & Verified:</strong> Authoritative database credentials loaded. You can review details below or re-evaluate instantly.
            </span>
          </div>
          <button
            type="button"
            onClick={handleFastEvaluation}
            disabled={submitting}
            className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md font-medium text-xs flex items-center gap-1.5 shrink-0 transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{submitting ? 'Evaluating...' : 'Fast Re-Evaluate'}</span>
          </button>
        </div>
      )}

      {/* Incomplete Profile Guidance Notice */}
      {!profileStatus.isComplete && profileStatus.completion > 0 && (
        <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-700 flex items-center justify-between gap-2">
          <span>
            Profile is {profileStatus.completion}% complete. Missing: {profileStatus.missingSections?.join(', ')}. Saved fields are pre-filled below.
          </span>
          <span className="font-mono text-zinc-500 font-medium">{profileStatus.completion}%</span>
        </div>
      )}

      {/* Step Progress Indicator */}
      <div className="bg-white border border-zinc-200 rounded-lg p-3.5 sm:p-4">
        <div className="grid grid-cols-5 gap-2">
          {stepTitles.map((s) => {
            const isCompleted = step > s.num;
            const isCurrent = step === s.num;
            return (
              <button
                type="button"
                key={s.num}
                onClick={() => {
                  setError(null);
                  setStep(s.num);
                }}
                className="flex flex-col items-center text-center focus:outline-none"
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                    isCurrent
                      ? 'bg-zinc-900 text-white ring-2 ring-zinc-900 ring-offset-1'
                      : isCompleted
                      ? 'bg-zinc-100 text-zinc-900 border border-zinc-300'
                      : 'bg-zinc-50 text-zinc-400 border border-zinc-200'
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : s.num}
                </div>
                <span className={`text-[11px] mt-1.5 hidden sm:block ${isCurrent ? 'font-medium text-zinc-950' : 'text-zinc-500'}`}>
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Wizard Form Card */}
      <div className="bg-white border border-zinc-200 rounded-lg p-6 sm:p-8 space-y-6">
        {error && (
          <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={step === 5 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
          {/* STEP 1: PERSONAL INFORMATION */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="pb-2 border-b border-zinc-100">
                <h2 className="text-sm font-semibold text-zinc-900">Step 1: Personal & Demographic Information</h2>
                <p className="text-xs text-zinc-500">Legal identity and domicile details used for quota and institutional checks.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Age <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="age"
                    min="15"
                    max="45"
                    value={formData.age}
                    onChange={handleChange}
                    className="w-full text-xs p-2 rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
                    placeholder="e.g. 20"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Gender <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full text-xs p-2 rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    State of Domicile <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full text-xs p-2 rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
                  >
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Uttar Pradesh">Uttar Pradesh</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Tamil Nadu">Tamil Nadu</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Gujarat">Gujarat</option>
                    <option value="Rajasthan">Rajasthan</option>
                    <option value="West Bengal">West Bengal</option>
                    <option value="Kerala">Kerala</option>
                    <option value="Madhya Pradesh">Madhya Pradesh</option>
                    <option value="Bihar">Bihar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    City / District <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full text-xs p-2 rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
                    placeholder="e.g. Pune"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Disability Status (PwD)</label>
                  <select
                    name="disability"
                    value={formData.disability}
                    onChange={handleChange}
                    className="w-full text-xs p-2 rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
                  >
                    <option value={0}>No Disability</option>
                    <option value={1}>Person with Disability (≥40%)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Regional Background</label>
                  <select
                    name="rural_urban"
                    value={formData.rural_urban}
                    onChange={handleChange}
                    className="w-full text-xs p-2 rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
                  >
                    <option value="Urban">Urban</option>
                    <option value="Semi-Urban">Semi-Urban</option>
                    <option value="Rural">Rural</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">First-Generation Learner</label>
                  <select
                    name="first_generation"
                    value={formData.first_generation}
                    onChange={handleChange}
                    className="w-full text-xs p-2 rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
                  >
                    <option value={0}>No (Parents attended higher education)</option>
                    <option value={1}>Yes (First in family to attend college)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Institution Type</label>
                  <select
                    name="institution_type"
                    value={formData.institution_type}
                    onChange={handleChange}
                    className="w-full text-xs p-2 rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
                  >
                    <option value="Government">Government University / College</option>
                    <option value="Govt-Aided">Government-Aided College</option>
                    <option value="Private">Private / Self-Financed Institute</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: ACADEMIC INFORMATION */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="pb-2 border-b border-zinc-100">
                <h2 className="text-sm font-semibold text-zinc-900">Step 2: Academic Record & Merit</h2>
                <p className="text-xs text-zinc-500">Academic criteria matched against institutional thresholds and merit quotas.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Current Education Level <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="education_level"
                    value={formData.education_level}
                    onChange={handleChange}
                    className="w-full text-xs p-2 rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
                  >
                    <option value="Undergraduate">Undergraduate (B.Tech / B.Sc / B.A)</option>
                    <option value="Postgraduate">Postgraduate (M.Tech / M.Sc / MBA)</option>
                    <option value="Diploma">Diploma / Polytechnic</option>
                    <option value="Doctorate">Doctorate / Ph.D</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Discipline / Course <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="course"
                    value={formData.course}
                    onChange={handleChange}
                    className="w-full text-xs p-2 rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
                  >
                    <option value="Computer Science & IT">Computer Science & IT</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Electrical Engineering">Electrical Engineering</option>
                    <option value="Civil Engineering">Civil Engineering</option>
                    <option value="Medicine / MBBS">Medicine / MBBS</option>
                    <option value="Pharmacy">Pharmacy</option>
                    <option value="B.Sc Science">B.Sc Science</option>
                    <option value="B.Com / Finance">B.Com / Finance</option>
                    <option value="B.A. Arts & Humanities">B.A. Arts & Humanities</option>
                    <option value="Law (LLB)">Law (LLB)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Year of Study <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="year_of_study"
                    value={formData.year_of_study}
                    onChange={handleChange}
                    className="w-full text-xs p-2 rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
                  >
                    <option value={1}>1st Year</option>
                    <option value={2}>2nd Year</option>
                    <option value={3}>3rd Year</option>
                    <option value={4}>4th Year</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Current CGPA (0.00 – 10.00) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    name="cgpa"
                    value={formData.cgpa}
                    onChange={handleChange}
                    className="w-full text-xs p-2 rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
                    placeholder="e.g. 8.65"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Overall Percentage (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    name="percentage"
                    value={formData.percentage}
                    onChange={handleChange}
                    className="w-full text-xs p-2 rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
                    placeholder="e.g. 82.4"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Active Backlogs</label>
                  <input
                    type="number"
                    min="0"
                    max="15"
                    name="backlogs"
                    value={formData.backlogs}
                    onChange={handleChange}
                    className="w-full text-xs p-2 rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
                    required
                  />
                  <p className="text-[10px] text-zinc-400 mt-1">More than 1 active backlog disqualifies from Tier-1 merit schemes.</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Attendance Percentage (%) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    name="attendance"
                    value={formData.attendance}
                    onChange={handleChange}
                    className="w-full text-xs p-2 rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
                    placeholder="e.g. 89.0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Previous Scholarship Recipient</label>
                  <select
                    name="previous_scholarship"
                    value={formData.previous_scholarship}
                    onChange={handleChange}
                    className="w-full text-xs p-2 rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
                  >
                    <option value={0}>No (Applying fresh)</option>
                    <option value={1}>Yes (Received scholarship previously)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: FINANCIAL INFORMATION */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="pb-2 border-b border-zinc-100">
                <h2 className="text-sm font-semibold text-zinc-900">Step 3: Household Financial Profile</h2>
                <p className="text-xs text-zinc-500">Evaluates need-based priority and statutory subsidy ceilings (≤ ₹8 Lakhs).</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Annual Family Income (₹ INR) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10000000"
                    name="family_income"
                    value={formData.family_income}
                    onChange={handleChange}
                    className="w-full text-xs p-2 rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
                    placeholder="e.g. 240000"
                    required
                  />
                  {formData.family_income && (
                    <p className="text-[11px] text-zinc-500 mt-1">₹{Number(formData.family_income).toLocaleString()} per annum</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Total Family Members <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    name="family_size"
                    value={formData.family_size}
                    onChange={handleChange}
                    className="w-full text-xs p-2 rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Parent's Primary Occupation <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="parent_occupation"
                    value={formData.parent_occupation}
                    onChange={handleChange}
                    className="w-full text-xs p-2 rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
                  >
                    <option value="Daily Wage Worker / Laborer">Daily Wage Worker / Laborer</option>
                    <option value="Farmer / Agriculture">Farmer / Agriculture</option>
                    <option value="Small Business / Retail">Small Business / Retail</option>
                    <option value="Private Sector Employee">Private Sector Employee</option>
                    <option value="Government Service">Government Service</option>
                    <option value="Artisan / Self-Employed">Artisan / Self-Employed</option>
                    <option value="Retired / Unemployed">Retired / Unemployed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Earning Members <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="earning_members"
                    value={formData.earning_members}
                    onChange={handleChange}
                    className="w-full text-xs p-2 rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
                  >
                    <option value={1}>1 Earning Member</option>
                    <option value={2}>2 Earning Members</option>
                    <option value={3}>3+ Earning Members</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Financial Dependency</label>
                  <select
                    name="financial_dependency"
                    value={formData.financial_dependency}
                    onChange={handleChange}
                    className="w-full text-xs p-2 rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
                  >
                    <option value="Both Parents">Both Parents</option>
                    <option value="Single Mother">Single Mother</option>
                    <option value="Single Father">Single Father</option>
                    <option value="Guardian">Guardian / Relative</option>
                    <option value="Self-Supported">Self-Supported</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Residence Status</label>
                  <select
                    name="hostel_day_scholar"
                    value={formData.hostel_day_scholar}
                    onChange={handleChange}
                    className="w-full text-xs p-2 rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
                  >
                    <option value="Hosteller">College Hosteller</option>
                    <option value="Day Scholar">Day Scholar / Commuter</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: ACHIEVEMENTS */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="pb-2 border-b border-zinc-100">
                <h2 className="text-sm font-semibold text-zinc-900">Step 4: Achievements & Extracurriculars</h2>
                <p className="text-xs text-zinc-500">Co-curricular credentials benchmark peer competitiveness in the ML model.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Sports Achievements <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="sports_achievement"
                    value={formData.sports_achievement}
                    onChange={handleChange}
                    className="w-full text-xs p-2 rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
                  >
                    <option value="None">None</option>
                    <option value="District">District Level Recognition</option>
                    <option value="State">State Championship</option>
                    <option value="National">National / Inter-University</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Academic Honors <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="academic_achievement"
                    value={formData.academic_achievement}
                    onChange={handleChange}
                    className="w-full text-xs p-2 rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
                  >
                    <option value="None">None</option>
                    <option value="School/College Topper">School / College Rank Holder</option>
                    <option value="Olympiad/Merit">Olympiad / National Talent Scholar</option>
                    <option value="Research/Published">Research Publication / Patent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Co-curricular Score: {formData.extracurricular_score} / 10
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    name="extracurricular_score"
                    value={formData.extracurricular_score}
                    onChange={handleChange}
                    className="w-full accent-zinc-900 mt-2"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
                    <span>1 (Minimal)</span>
                    <span>5 (Average)</span>
                    <span>10 (Exceptional)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Verified Technical Certifications</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    name="certifications_count"
                    value={formData.certifications_count}
                    onChange={handleChange}
                    className="w-full text-xs p-2 rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
                  />
                </div>

                <div className="sm:col-span-2 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-zinc-800">
                    <input
                      type="checkbox"
                      name="leadership_experience"
                      checked={formData.leadership_experience}
                      onChange={handleChange}
                      className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                    />
                    <span>Held institutional leadership role (Class Representative, Club Lead, Event Head)</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: REVIEW & SUMMARY */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="pb-2 border-b border-zinc-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-zinc-900">Step 5: Review & Confirmation</h2>
                  <p className="text-xs text-zinc-500">Confirm your details. They will be saved authoritatively to your permanent profile.</p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded bg-zinc-100 text-zinc-800 border border-zinc-200">
                  Ready for Evaluation
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50/50 space-y-1.5">
                  <span className="font-semibold text-zinc-900 block">Personal Profile</span>
                  <div className="flex justify-between text-zinc-600"><span>Gender / Age:</span> <span className="font-medium text-zinc-900">{formData.gender}, {formData.age} yrs</span></div>
                  <div className="flex justify-between text-zinc-600"><span>State:</span> <span className="font-medium text-zinc-900">{formData.state} ({formData.rural_urban})</span></div>
                  <div className="flex justify-between text-zinc-600"><span>PwD Status:</span> <span className="font-medium text-zinc-900">{formData.disability ? "Yes" : "No"}</span></div>
                  <div className="flex justify-between text-zinc-600"><span>First Generation:</span> <span className="font-medium text-zinc-900">{formData.first_generation ? "Yes" : "No"}</span></div>
                </div>

                <div className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50/50 space-y-1.5">
                  <span className="font-semibold text-zinc-900 block">Academic Record</span>
                  <div className="flex justify-between text-zinc-600"><span>Course / Year:</span> <span className="font-medium text-zinc-900">{formData.course} (Yr {formData.year_of_study})</span></div>
                  <div className="flex justify-between text-zinc-600"><span>CGPA / %:</span> <span className="font-medium text-zinc-900">{formData.cgpa} / {formData.percentage || '—'}%</span></div>
                  <div className="flex justify-between text-zinc-600"><span>Backlogs / Attendance:</span> <span className="font-medium text-zinc-900">{formData.backlogs} backlogs, {formData.attendance}%</span></div>
                  <div className="flex justify-between text-zinc-600"><span>Institution:</span> <span className="font-medium text-zinc-900">{formData.institution_type}</span></div>
                </div>

                <div className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50/50 space-y-1.5">
                  <span className="font-semibold text-zinc-900 block">Financial Status</span>
                  <div className="flex justify-between text-zinc-600"><span>Family Income:</span> <span className="font-medium text-zinc-900">₹{Number(formData.family_income).toLocaleString()}</span></div>
                  <div className="flex justify-between text-zinc-600"><span>Household Size:</span> <span className="font-medium text-zinc-900">{formData.family_size} members</span></div>
                  <div className="flex justify-between text-zinc-600"><span>Earning Members:</span> <span className="font-medium text-zinc-900">{formData.earning_members} earner(s)</span></div>
                  <div className="flex justify-between text-zinc-600"><span>Occupation:</span> <span className="font-medium text-zinc-900">{formData.parent_occupation}</span></div>
                </div>

                <div className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50/50 space-y-1.5">
                  <span className="font-semibold text-zinc-900 block">Achievements & Skills</span>
                  <div className="flex justify-between text-zinc-600"><span>Sports:</span> <span className="font-medium text-zinc-900">{formData.sports_achievement}</span></div>
                  <div className="flex justify-between text-zinc-600"><span>Academics:</span> <span className="font-medium text-zinc-900">{formData.academic_achievement}</span></div>
                  <div className="flex justify-between text-zinc-600"><span>Certifications:</span> <span className="font-medium text-zinc-900">{formData.certifications_count}</span></div>
                  <div className="flex justify-between text-zinc-600"><span>Leadership:</span> <span className="font-medium text-zinc-900">{formData.leadership_experience ? "Yes" : "No"}</span></div>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-zinc-200 bg-zinc-50 text-xs text-zinc-600">
                Evaluation will synchronously assess compliance against statutory scholarship criteria (45%) and calculate Gradient Boosting multidimensional probability (55%).
              </div>
            </div>
          )}

          {/* Form Navigation Controls */}
          <div className="flex items-center justify-between pt-5 border-t border-zinc-100">
            {step > 1 ? (
              <button
                type="button"
                onClick={handlePrev}
                className="px-3.5 py-2 text-xs font-medium text-zinc-700 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-md flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>
            ) : <div />}

            {step < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-2 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-md flex items-center gap-1.5 transition-colors ml-auto"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-md flex items-center gap-1.5 disabled:opacity-50 transition-colors ml-auto"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{submitting ? 'Saving & Evaluating...' : (isOnboarding ? 'Finish Onboarding & Activate Dashboard' : 'Run Dual-Engine Evaluation')}</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default EligibilityAssessment;
