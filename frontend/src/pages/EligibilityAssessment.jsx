import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentAPI, eligibilityAPI } from '../services/api';
import { 
  Sparkles, ArrowRight, ArrowLeft, CheckCircle2, User, 
  GraduationCap, DollarSign, Award, CheckSquare, AlertCircle 
} from 'lucide-react';

const EligibilityAssessment = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Form State - blank by default so new users start with an empty form
  const [formData, setFormData] = useState({
    // Step 1: Personal
    age: '',
    gender: '',
    state: '',
    city: '',
    category: '',
    disability: 0,
    rural_urban: '',
    first_generation: 0,
    institution_type: '',
    hostel_day_scholar: '',

    // Step 2: Academic
    education_level: '',
    course: '',
    year_of_study: '',
    cgpa: '',
    percentage: '',
    backlogs: 0,
    attendance: '',
    previous_scholarship: 0,

    // Step 3: Financial
    family_income: '',
    family_size: '',
    parent_occupation: '',
    earning_members: '',
    financial_dependency: '',

    // Step 4: Achievements
    sports_achievement: '',
    academic_achievement: '',
    extracurricular_score: 5,
    certifications_count: 0,
    leadership_experience: false,
  });

  // Pre-load student's existing profile if available
  useEffect(() => {
    const fetchExisting = async () => {
      try {
        const res = await studentAPI.getProfile();
        const { profile, academics, financials, achievements } = res.data;
        const mergeNonNull = (obj) => {
          if (!obj) return {};
          return Object.fromEntries(
            Object.entries(obj).filter(([, v]) => v !== null && v !== undefined)
          );
        };
        setFormData(prev => ({
          ...prev,
          ...mergeNonNull(profile),
          ...mergeNonNull(academics),
          ...mergeNonNull(financials),
          ...mergeNonNull(achievements),
        }));
      } catch (err) {
        console.log("Could not load existing profile, starting fresh.");
      }
    };
    fetchExisting();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) || 0 : value)
    }));
  };

  const handleNext = () => {
    setError(null);
    setStep(prev => Math.min(prev + 1, 5));
  };

  const handlePrev = () => {
    setError(null);
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        age: parseInt(formData.age),
        disability: parseInt(formData.disability),
        first_generation: parseInt(formData.first_generation),
        year_of_study: parseInt(formData.year_of_study),
        cgpa: parseFloat(formData.cgpa),
        percentage: parseFloat(formData.percentage),
        backlogs: parseInt(formData.backlogs),
        attendance: parseFloat(formData.attendance),
        previous_scholarship: parseInt(formData.previous_scholarship),
        family_income: parseFloat(formData.family_income),
        family_size: parseInt(formData.family_size),
        earning_members: parseInt(formData.earning_members),
        extracurricular_score: parseInt(formData.extracurricular_score),
        certifications_count: parseInt(formData.certifications_count),
        leadership_experience: Boolean(formData.leadership_experience),
      };

      const res = await eligibilityAPI.checkEligibility(payload);
      // Navigate to results page with result state
      navigate('/student/results', { state: { result: res.data } });
    } catch (err) {
      setError(err.response?.data?.detail || "Assessment submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const stepTitles = [
    { num: 1, label: "Personal Info", icon: User },
    { num: 2, label: "Academic Info", icon: GraduationCap },
    { num: 3, label: "Financial Background", icon: DollarSign },
    { num: 4, label: "Achievements & Co-curricular", icon: Award },
    { num: 5, label: "Review & Submit", icon: CheckSquare },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title Card */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold border border-brand-200">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Interactive Expert Assessment Wizard</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Scholarship Eligibility Assessment
        </h1>
        <p className="text-xs text-slate-500 max-w-lg mx-auto">
          Please provide accurate details across the 5 categories. The AI engine will cross-reference your answers with official quota rules.
        </p>
      </div>

      {/* Step Progress Bar */}
      <div className="card-soft p-4 sm:p-5">
        <div className="grid grid-cols-5 gap-2">
          {stepTitles.map((s) => {
            const Icon = s.icon;
            const isCompleted = step > s.num;
            const isCurrent = step === s.num;
            return (
              <div key={s.num} className="flex flex-col items-center text-center">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs transition ${
                    isCurrent
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-500/30'
                      : isCompleted
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                </div>
                <span className={`text-[11px] font-semibold mt-1.5 hidden sm:block ${isCurrent ? 'text-brand-700' : 'text-slate-500'}`}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Form Body */}
      <div className="card-soft p-6 sm:p-8 space-y-6">
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={step === 5 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
          {/* STEP 1: PERSONAL INFORMATION */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <User className="w-4 h-4 text-brand-600" />
                Step 1: Personal & Demographic Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Age</label>
                  <input
                    type="number"
                    name="age"
                    min="15"
                    max="45"
                    value={formData.age}
                    onChange={handleChange}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">State of Domicile</label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500"
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City / District</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Social / Reservation Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="General">General / Unreserved</option>
                    <option value="OBC">Other Backward Classes (OBC)</option>
                    <option value="SC">Scheduled Castes (SC)</option>
                    <option value="ST">Scheduled Tribes (ST)</option>
                    <option value="EWS">Economically Weaker Section (EWS)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Disability Status (PwD)</label>
                  <select
                    name="disability"
                    value={formData.disability}
                    onChange={handleChange}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500"
                  >
                    <option value={0}>No Disability</option>
                    <option value={1}>Person with Disability (PwD ≥40%)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Regional Background</label>
                  <select
                    name="rural_urban"
                    value={formData.rural_urban}
                    onChange={handleChange}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="Urban">Urban</option>
                    <option value="Semi-Urban">Semi-Urban</option>
                    <option value="Rural">Rural</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">First-Generation Learner</label>
                  <select
                    name="first_generation"
                    value={formData.first_generation}
                    onChange={handleChange}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500"
                  >
                    <option value={0}>No (Parents attended college)</option>
                    <option value={1}>Yes (First in family to attend college)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: ACADEMIC INFORMATION */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-brand-600" />
                Step 2: Academic Record & Merit
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Current Education Level</label>
                  <select
                    name="education_level"
                    value={formData.education_level}
                    onChange={handleChange}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="Undergraduate">Undergraduate (B.Tech / B.Sc / B.A)</option>
                    <option value="Postgraduate">Postgraduate (M.Tech / M.Sc / MBA)</option>
                    <option value="Diploma">Diploma / Polytechnic</option>
                    <option value="Doctorate">Doctorate / Ph.D</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Course / Discipline</label>
                  <select
                    name="course"
                    value={formData.course}
                    onChange={handleChange}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500"
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Year of Study</label>
                  <select
                    name="year_of_study"
                    value={formData.year_of_study}
                    onChange={handleChange}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500"
                  >
                    <option value={1}>1st Year</option>
                    <option value={2}>2nd Year</option>
                    <option value={3}>3rd Year</option>
                    <option value={4}>4th Year</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Current CGPA (0.0 to 10.0)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    name="cgpa"
                    value={formData.cgpa}
                    onChange={handleChange}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Overall Percentage Equivalent (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="35"
                    max="100"
                    name="percentage"
                    value={formData.percentage}
                    onChange={handleChange}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Active Backlogs</label>
                  <input
                    type="number"
                    min="0"
                    max="15"
                    name="backlogs"
                    value={formData.backlogs}
                    onChange={handleChange}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500"
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Rule constraint: &gt;1 backlog restricts merit programs.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Attendance Percentage (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="40"
                    max="100"
                    name="attendance"
                    value={formData.attendance}
                    onChange={handleChange}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Institution Type</label>
                  <select
                    name="institution_type"
                    value={formData.institution_type}
                    onChange={handleChange}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="Government">Government University / College</option>
                    <option value="Govt-Aided">Government-Aided College</option>
                    <option value="Private">Private / Self-Financed Institute</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: FINANCIAL INFORMATION */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-brand-600" />
                Step 3: Household Financial Profile
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Annual Family Income (₹ INR)</label>
                  <input
                    type="number"
                    min="10000"
                    max="5000000"
                    name="family_income"
                    value={formData.family_income}
                    onChange={handleChange}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500"
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Current value: ₹{Number(formData.family_income).toLocaleString()} per annum.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Total Family Size</label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    name="family_size"
                    value={formData.family_size}
                    onChange={handleChange}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Parent's Primary Occupation</label>
                  <select
                    name="parent_occupation"
                    value={formData.parent_occupation}
                    onChange={handleChange}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500"
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Earning Members in Household</label>
                  <select
                    name="earning_members"
                    value={formData.earning_members}
                    onChange={handleChange}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500"
                  >
                    <option value={1}>1 Earning Member</option>
                    <option value={2}>2 Earning Members</option>
                    <option value={3}>3+ Earning Members</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Financial Dependency Structure</label>
                  <select
                    name="financial_dependency"
                    value={formData.financial_dependency}
                    onChange={handleChange}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="Both Parents">Supported by Both Parents</option>
                    <option value="Single Mother">Single Mother Household</option>
                    <option value="Single Father">Single Father Household</option>
                    <option value="Guardian">Supported by Guardian / Relative</option>
                    <option value="Self-Supported">Self-Supported / Working Student</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Residence Status</label>
                  <select
                    name="hostel_day_scholar"
                    value={formData.hostel_day_scholar}
                    onChange={handleChange}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="Hosteller">College Hosteller</option>
                    <option value="Day Scholar">Day Scholar / Commuter</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: ACHIEVEMENTS & EXTRACURRICULAR */}
          {step === 4 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Award className="w-4 h-4 text-brand-600" />
                Step 4: Achievements & Extracurriculars
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sports Achievements</label>
                  <select
                    name="sports_achievement"
                    value={formData.sports_achievement}
                    onChange={handleChange}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="None">None</option>
                    <option value="District">District Level Recognition</option>
                    <option value="State">State Championship</option>
                    <option value="National">National / Inter-University</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Honors / Distinctions</label>
                  <select
                    name="academic_achievement"
                    value={formData.academic_achievement}
                    onChange={handleChange}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="None">None</option>
                    <option value="School/College Topper">School / College Rank Holder</option>
                    <option value="Olympiad/Merit">Olympiad / National Talent Scholar</option>
                    <option value="Research/Published">Research Publication / Patent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Co-curricular Score: {formData.extracurricular_score} / 10
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    name="extracurricular_score"
                    value={formData.extracurricular_score}
                    onChange={handleChange}
                    className="w-full accent-brand-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>1 (Minimal)</span>
                    <span>5 (Active)</span>
                    <span>10 (Outstanding)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Verified Technical Certifications</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    name="certifications_count"
                    value={formData.certifications_count}
                    onChange={handleChange}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div className="sm:col-span-2 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      name="leadership_experience"
                      checked={formData.leadership_experience}
                      onChange={handleChange}
                      className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                    />
                    <span>Held institutional leadership role (Class Representative, Club President, Event Organizer)</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: REVIEW & SUMMARY */}
          {step === 5 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-600" />
                Step 5: Review Assessment Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Personal & Social</h4>
                  <div className="flex justify-between"><span className="text-slate-500">Gender / Age:</span> <span className="font-medium">{formData.gender}, {formData.age} yrs</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Category:</span> <span className="font-bold text-brand-700">{formData.category}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">State / Region:</span> <span className="font-medium">{formData.state} ({formData.rural_urban})</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">PwD Status:</span> <span className="font-medium">{formData.disability ? "Yes" : "No"}</span></div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Academic Records</h4>
                  <div className="flex justify-between"><span className="text-slate-500">Course / Year:</span> <span className="font-medium">{formData.course} (Yr {formData.year_of_study})</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">CGPA / Percentage:</span> <span className="font-bold text-emerald-600">{formData.cgpa} / {formData.percentage}%</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Backlogs / Attendance:</span> <span className="font-medium">{formData.backlogs} backlogs, {formData.attendance}%</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Institution:</span> <span className="font-medium">{formData.institution_type}</span></div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Financial Background</h4>
                  <div className="flex justify-between"><span className="text-slate-500">Annual Income:</span> <span className="font-bold text-slate-900">₹{Number(formData.family_income).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Family Members:</span> <span className="font-medium">{formData.family_size} members</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Earning Members:</span> <span className="font-medium">{formData.earning_members} earner(s)</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Parent Occupation:</span> <span className="font-medium">{formData.parent_occupation}</span></div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Achievements</h4>
                  <div className="flex justify-between"><span className="text-slate-500">Sports:</span> <span className="font-medium">{formData.sports_achievement}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Academic Distinction:</span> <span className="font-medium">{formData.academic_achievement}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Leadership Role:</span> <span className="font-medium">{formData.leadership_experience ? "Yes" : "No"}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Certifications:</span> <span className="font-medium">{formData.certifications_count}</span></div>
                </div>
              </div>

              <div className="p-3.5 bg-brand-50 rounded-xl border border-brand-200 text-xs text-brand-800 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" />
                <span>
                  Clicking "Run AI Assessment" executes the Rule-Based Validation Engine and the Gradient Boosting ML model simultaneously to generate explainable match factors.
                </span>
              </div>
            </div>
          )}

          {/* Form Actions Footer */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-100">
            {step > 1 ? (
              <button
                type="button"
                onClick={handlePrev}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-1.5 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous Step</span>
              </button>
            ) : <div></div>}

            {step < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm shadow-brand-500/20 flex items-center gap-1.5 transition"
              >
                <span>Continue to Step {step + 1}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-md shadow-emerald-600/25 flex items-center gap-2 disabled:opacity-50 transition"
              >
                <Sparkles className="w-4 h-4" />
                <span>{submitting ? 'Running Dual-Engine AI Assessment...' : 'Run AI Assessment'}</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default EligibilityAssessment;
