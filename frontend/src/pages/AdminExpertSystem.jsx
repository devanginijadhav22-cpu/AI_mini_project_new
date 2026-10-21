import React, { useState } from 'react';
import {
  Brain,
  Cpu,
  GitFork,
  ArrowRight,
  ArrowDown,
  Scale,
  Compass,
  BookOpen,
  Award,
  Database,
  HelpCircle,
  Zap,
  CheckCircle2
} from 'lucide-react';

const EDUCATIONAL_RULES = [
  {
    id: 'R1_ACAD_MERIT',
    title: 'Academic Merit Requirement',
    category: 'Academic Standards',
    meaning: 'The student must meet the institutional academic baseline to qualify for statutory scholarship benefits.',
    appliesWhen: 'The student earns a cumulative grade point average (CGPA) of 6.0 or higher out of 10.0.',
    whatHappensNext: 'The system marks the academic requirement as satisfied and records this conclusion into working memory.',
    technicalFact: 'academic_merit_passed',
    derivedConclusion: 'academic_criteria_satisfied',
    group: 'baseline'
  },
  {
    id: 'R2_FIN_NEED',
    title: 'Standard Financial Need Requirement',
    category: 'Socioeconomic Criteria',
    meaning: 'Verifies that the student belongs to a household eligible for government financial aid subsidies.',
    appliesWhen: 'The certified annual family income is Rs 8,00,000 or below.',
    whatHappensNext: 'The system records that family income meets the applicable limit, marking financial criteria as satisfied.',
    technicalFact: 'income_need_passed',
    derivedConclusion: 'financial_criteria_satisfied',
    group: 'baseline'
  },
  {
    id: 'R3_FIN_EXEMPT',
    title: 'Exceptional Academic Merit Exemption',
    category: 'Socioeconomic Criteria',
    meaning: 'Grants an income limit waiver for high-achieving scholars who exceed the family income cap but demonstrate outstanding academic excellence.',
    appliesWhen: 'Annual family income exceeds Rs 8,00,000, but the student achieves an exceptional CGPA of 8.5 or higher.',
    whatHappensNext: 'The income ceiling requirement is waived on merit grounds, and financial criteria are marked as satisfied.',
    technicalFact: 'income_exempt_applied',
    derivedConclusion: 'financial_criteria_satisfied',
    group: 'baseline'
  },
  {
    id: 'R4_BACKLOG_CLEAN',
    title: 'Clean Academic Record (Continuity)',
    category: 'Curricular Continuity',
    meaning: 'Ensures the student progresses normally through the syllabus without active course backlogs or repeated subjects.',
    appliesWhen: 'The student has 0 active backlogs across all enrolled semesters.',
    whatHappensNext: 'The system confirms that the academic continuity requirement is satisfied with full regular standing.',
    technicalFact: 'backlog_norm_passed',
    derivedConclusion: 'continuity_criteria_satisfied',
    group: 'baseline'
  },
  {
    id: 'R5_BACKLOG_COND',
    title: 'Marginal Backlog Tolerance (Probationary)',
    category: 'Curricular Continuity',
    meaning: 'Provides academic tolerance for students with a single pending subject, allowing conditional qualification under academic review.',
    appliesWhen: 'The student has exactly 1 active backlog.',
    whatHappensNext: 'Continuity is marked as conditionally satisfied under academic probation, which can support conditional eligibility.',
    technicalFact: 'backlog_marginal_passed',
    derivedConclusion: 'continuity_conditional_satisfied',
    group: 'baseline'
  },
  {
    id: 'R6_ATTENDANCE_FULL',
    title: 'Attendance Regularity Norm',
    category: 'Attendance Standards',
    meaning: 'Verifies regular classroom and laboratory attendance required by university continuous evaluation guidelines.',
    appliesWhen: 'The student maintains a verified attendance record of 75.0% or higher.',
    whatHappensNext: 'The system marks the attendance criteria as fully satisfied.',
    technicalFact: 'attendance_regularity_passed',
    derivedConclusion: 'attendance_criteria_satisfied',
    group: 'baseline'
  },
  {
    id: 'R7_ATTENDANCE_COND',
    title: 'Borderline Attendance Tolerance',
    category: 'Attendance Standards',
    meaning: 'Accommodates students whose attendance is slightly below the standard threshold due to documented medical or extenuating factors.',
    appliesWhen: 'The student maintains an attendance percentage between 65.0% and 74.9%.',
    whatHappensNext: 'The attendance requirement is marked as conditionally satisfied pending department attestation.',
    technicalFact: 'attendance_borderline_passed',
    derivedConclusion: 'attendance_conditional_satisfied',
    group: 'baseline'
  },
  {
    id: 'R8_FULL_ELIGIBILITY',
    title: 'Universal Full Eligibility Derivation',
    category: 'Overall Eligibility Synthesis',
    meaning: 'Combines all four core statutory dimensions into the highest-level universal eligibility determination.',
    appliesWhen: 'All four baseline criteria are satisfied: Academic (CGPA >= 6.0) AND Financial (Income <= Rs 8L or Merit Waiver) AND Clean Record (0 backlogs) AND Full Attendance (>= 75%).',
    whatHappensNext: 'The student is officially classified as meeting general eligibility rules (Full Award Standing).',
    technicalFact: 'Academic + Financial + Continuity + Attendance satisfied',
    derivedConclusion: 'generally_eligible',
    group: 'synthesis'
  },
  {
    id: 'R9_COND_ELIGIBILITY_BACKLOG',
    title: 'Conditional Eligibility (Probationary Backlog)',
    category: 'Overall Eligibility Synthesis',
    meaning: 'Permits conditional eligibility when academic, income, and attendance standards are met, but the student carries 1 tolerated backlog.',
    appliesWhen: 'Academic, financial, and attendance criteria are satisfied, but continuity is conditionally approved with 1 active backlog.',
    whatHappensNext: 'The student is classified as conditionally eligible under academic probation.',
    technicalFact: 'Academic + Financial + Attendance + 1 Backlog',
    derivedConclusion: 'conditionally_eligible',
    group: 'synthesis'
  },
  {
    id: 'R10_COND_ELIGIBILITY_ATTENDANCE',
    title: 'Conditional Eligibility (Attendance Attestation)',
    category: 'Overall Eligibility Synthesis',
    meaning: 'Permits conditional eligibility when academics, income, and clean backlog records are intact, but attendance falls in the borderline range.',
    appliesWhen: 'Academic, financial, and zero backlog requirements are satisfied, but attendance is in the borderline bracket (65.0% to 74.9%).',
    whatHappensNext: 'The student is classified as conditionally eligible pending attendance clearance attestation.',
    technicalFact: 'Academic + Financial + 0 Backlogs + Borderline Attendance',
    derivedConclusion: 'conditionally_eligible',
    group: 'synthesis'
  },
  {
    id: 'R11_COND_ELIGIBILITY_BOTH',
    title: 'Conditional Eligibility (Dual Borderline Review)',
    category: 'Overall Eligibility Synthesis',
    meaning: 'Considers students who carry both a single backlog and borderline attendance, allowing administrative committee review if academic merit and financial need are proven.',
    appliesWhen: 'Academic merit and financial need are satisfied, while both continuity (1 backlog) and attendance (65.0% to 74.9%) are conditional.',
    whatHappensNext: 'The student is classified as conditionally eligible for dual borderline administrative review.',
    technicalFact: 'Academic + Financial + 1 Backlog + Borderline Attendance',
    derivedConclusion: 'conditionally_eligible',
    group: 'synthesis'
  }
];

const AdminExpertSystem = () => {
  const [activeTab, setActiveTab] = useState('theory'); // 'theory', 'forward', 'backward', 'matching'

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <div className="border-b border-zinc-200 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-950 font-sans">
          Expert System & Symbolic Reasoning
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Deterministic Knowledge Base, Forward Chaining, and Backward Chaining engines evaluating statutory eligibility criteria alongside machine learning.
        </p>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="pt-3 pb-6 border-b border-zinc-200/80">
        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-3 sm:gap-x-4">
          <button
            onClick={() => setActiveTab('theory')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'theory'
                ? 'bg-zinc-900 text-white shadow-sm'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Theory & Knowledge Base
          </button>
          <button
            onClick={() => setActiveTab('forward')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'forward'
                ? 'bg-zinc-900 text-white shadow-sm'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Forward Chaining (R1 - R11)
          </button>
          <button
            onClick={() => setActiveTab('backward')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'backward'
                ? 'bg-zinc-900 text-white shadow-sm'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            Backward Chaining & Goal Proving
          </button>
          <button
            onClick={() => setActiveTab('matching')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'matching'
                ? 'bg-zinc-900 text-white shadow-sm'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            Scholarship Matching Pipeline
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* TAB CONTENT: THEORY & ARCHITECTURE                                    */}
      {/* ==================================================================== */}
      {activeTab === 'theory' && (
        <div className="space-y-8">
          {/* Conceptual Foundations Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-zinc-200/90 shadow-sm space-y-3">
              <div className="flex items-center gap-2.5 text-zinc-900">
                <Brain className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold">1. What is an Expert System?</h3>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed">
                An <strong>Expert System</strong> is a branch of Artificial Intelligence designed to emulate the decision-making ability of human subject-matter experts. Unlike statistical machine-learning models that learn opaque numerical mappings from sample data, an expert system applies formal symbolic logic, heuristic domain knowledge, and transparent inference chains.
              </p>
              <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80 text-xs text-zinc-700 space-y-1">
                <span className="font-semibold block text-zinc-900">Core ScholarAI Distinction:</span>
                ScholarAI uses symbolic expert reasoning for strict regulatory guidelines (income limits, academic continuity, statutory reservations) where 100% legal compliance and explainability are mandatory.
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-zinc-200/90 shadow-sm space-y-3">
              <div className="flex items-center gap-2.5 text-zinc-900">
                <Database className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold">2. Knowledge Base & IF-THEN Rules</h3>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed">
                The <strong>Knowledge Base (KB)</strong> represents the curated repository of domain expertise stored as a collection of declarative <em>production rules</em> (Horn clauses). Each rule takes the standard conditional form:
              </p>
              <div className="p-3 rounded-lg bg-zinc-900 text-white font-mono text-xs">
                IF (Antecedent_1 AND Antecedent_2 AND ...) THEN (Consequent)
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed">
                In this architecture, rules are strictly decoupled from the execution code, enabling domain administrators to update statutory cutoffs without retraining or modifying machine learning weights.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-zinc-200/90 shadow-sm space-y-3">
              <div className="flex items-center gap-2.5 text-zinc-900">
                <Cpu className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold">3. Facts & The Inference Engine</h3>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed">
                An expert system operates using two distinct components:
              </p>
              <ul className="text-xs text-zinc-600 space-y-2 list-disc list-inside">
                <li>
                  <strong>Working Memory (Facts):</strong> The current verified state of the world, comprising initial ground-truth facts extracted from the student's profile (e.g., <code className="font-mono text-zinc-800">CGPA &gt;= 6.0</code>) and intermediate derived conclusions.
                </li>
                <li>
                  <strong>Inference Engine:</strong> The reasoning brain that inspects the facts, matches them against rule antecedents, resolves conflicts, and fires rules to derive new facts or prove target goals.
                </li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-zinc-200/90 shadow-sm space-y-3">
              <div className="flex items-center gap-2.5 text-zinc-900">
                <Scale className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold">4. Deterministic Rules vs. ML Predictions</h3>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed">
                ScholarAI combines deterministic rule systems with machine learning rather than relying on either alone:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                  <span className="font-bold text-emerald-900 block mb-1">Deterministic Rules</span>
                  Enforce non-negotiable statutory cutoffs (zero backlogs, income ceilings). Zero tolerance for false positives on statutory constraints.
                </div>
                <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200">
                  <span className="font-bold text-blue-900 block mb-1">Machine Learning (GBM)</span>
                  Captures multidimensional non-linear patterns, holistic merit, and peer competitiveness across 24 demographic-free features.
                </div>
              </div>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="p-6 rounded-2xl bg-white border border-zinc-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <GitFork className="w-5 h-5 text-zinc-800" />
                <h3 className="text-base font-bold text-zinc-900">
                  Reasoning Strategy Comparison: Forward Chaining vs. Backward Chaining
                </h3>
              </div>
              <span className="text-xs text-zinc-500 font-medium">Comparative Analysis</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-zinc-200 rounded-xl overflow-hidden">
                <thead className="bg-zinc-100 text-zinc-700 uppercase font-bold text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4 border-r border-zinc-200">Aspect</th>
                    <th className="py-3 px-4 border-r border-zinc-200 bg-amber-50/60 text-amber-900">
                      Forward Chaining (Data-Driven)
                    </th>
                    <th className="py-3 px-4 bg-blue-50/60 text-blue-900">
                      Backward Chaining (Goal-Driven)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 text-zinc-600">
                  <tr>
                    <td className="py-3 px-4 font-semibold text-zinc-900 border-r border-zinc-200 bg-zinc-50/50">
                      Starting Point
                    </td>
                    <td className="py-3 px-4 border-r border-zinc-200">
                      Known student facts (CGPA, income, active backlogs, attendance regularity).
                    </td>
                    <td className="py-3 px-4">
                      A designated target hypothesis or goal (e.g. <code className="font-mono text-zinc-800">generally_eligible</code>).
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-zinc-900 border-r border-zinc-200 bg-zinc-50/50">
                      Reasoning Direction
                    </td>
                    <td className="py-3 px-4 border-r border-zinc-200">
                      <strong>Bottom-Up:</strong> From known facts to all logically derivable conclusions.
                    </td>
                    <td className="py-3 px-4">
                      <strong>Top-Down:</strong> From target goal backward to prerequisite antecedents.
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-zinc-900 border-r border-zinc-200 bg-zinc-50/50">
                      Primary Question
                    </td>
                    <td className="py-3 px-4 border-r border-zinc-200">
                      <em>"What conclusions and eligibility classifications follow from these facts?"</em>
                    </td>
                    <td className="py-3 px-4">
                      <em>"Can this specific eligibility goal be established, or what prerequisite fact is missing?"</em>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-zinc-900 border-r border-zinc-200 bg-zinc-50/50">
                      Search Strategy
                    </td>
                    <td className="py-3 px-4 border-r border-zinc-200">
                      Iterative rule scanning loops until a fixed point is reached (no further rules fire).
                    </td>
                    <td className="py-3 px-4">
                      Depth-first recursive verification of candidate rule antecedents (AND/OR tree) with cycle detection.
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-zinc-900 border-r border-zinc-200 bg-zinc-50/50">
                      Missing Data Handling
                    </td>
                    <td className="py-3 px-4 border-r border-zinc-200">
                      Ignores unasserted facts; rules whose prerequisites are missing simply do not fire.
                    </td>
                    <td className="py-3 px-4">
                      Explicitly flags missing antecedents with <strong>UNKNOWN</strong> status, pinpointing incomplete profiles.
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-zinc-900 border-r border-zinc-200 bg-zinc-50/50">
                      Project Implementation Use
                    </td>
                    <td className="py-3 px-4 border-r border-zinc-200">
                      Derives general statutory compliance classifications (<code className="font-mono text-zinc-800">ELIGIBLE</code>, <code className="font-mono text-zinc-800">CONDITIONALLY_ELIGIBLE</code>).
                    </td>
                    <td className="py-3 px-4">
                      Direct verification of whether a specific scheme target can be proven or what document is missing.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB CONTENT: FORWARD CHAINING EXPLANATION                            */}
      {/* ==================================================================== */}
      {activeTab === 'forward' && (
        <div className="space-y-8">
          {/* Overview & Educational Introduction */}
          <div className="p-6 md:p-8 rounded-2xl bg-white border border-zinc-200/90 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 text-zinc-900 border-b border-zinc-100 pb-3">
              <Zap className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg md:text-xl font-bold tracking-tight">
                Forward Chaining Implementation Details
              </h2>
            </div>
            
            <p className="text-sm md:text-base text-zinc-700 leading-relaxed font-normal">
              Forward chaining starts with the information available about a student. The expert system checks which rules match that information, derives new facts, and continues until it reaches a conclusion or no further rules apply.
            </p>

            <p className="text-xs md:text-sm text-zinc-500 leading-relaxed">
              In ScholarAI, this process runs automatically when an administrator reviews applicant criteria or when evaluating institutional aid baselines. Because rules are strictly decoupled from application code, each statutory threshold is transparent, auditable, and easily updated.
            </p>

            {/* Redesigned Flow Diagram */}
            <div className="mt-6 pt-4 border-t border-zinc-100 space-y-3">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                Forward Chaining Flow Diagram
              </span>
              
              <div className="flex flex-col md:flex-row items-center justify-between gap-2.5">
                <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 text-center w-full md:w-auto flex-1 shadow-sm">
                  <span className="text-xs font-bold text-zinc-900 block">Student Information</span>
                  <span className="text-[11px] text-zinc-500 block mt-0.5">CGPA, Income, Backlogs, Attendance</span>
                </div>
                
                <ArrowRight className="w-4 h-4 text-zinc-400 shrink-0 hidden md:block" />
                <ArrowDown className="w-4 h-4 text-zinc-400 shrink-0 md:hidden" />
                
                <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 text-center w-full md:w-auto flex-1 shadow-sm">
                  <span className="text-xs font-bold text-zinc-900 block">Initial Facts</span>
                  <span className="text-[11px] text-zinc-500 block mt-0.5">Verified input facts in memory</span>
                </div>
                
                <ArrowRight className="w-4 h-4 text-zinc-400 shrink-0 hidden md:block" />
                <ArrowDown className="w-4 h-4 text-zinc-400 shrink-0 md:hidden" />
                
                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-center w-full md:w-auto flex-1 shadow-sm">
                  <span className="text-xs font-bold text-amber-950 block">Applicable Rules</span>
                  <span className="text-[11px] text-amber-800 block mt-0.5">Matching condition antecedents</span>
                </div>
                
                <ArrowRight className="w-4 h-4 text-zinc-400 shrink-0 hidden md:block" />
                <ArrowDown className="w-4 h-4 text-zinc-400 shrink-0 md:hidden" />
                
                <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-center w-full md:w-auto flex-1 shadow-sm">
                  <span className="text-xs font-bold text-blue-950 block">New Conclusions</span>
                  <span className="text-[11px] text-blue-800 block mt-0.5">Derived criteria added to memory</span>
                </div>
                
                <ArrowRight className="w-4 h-4 text-zinc-400 shrink-0 hidden md:block" />
                <ArrowDown className="w-4 h-4 text-zinc-400 shrink-0 md:hidden" />
                
                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-center w-full md:w-auto flex-1 shadow-sm">
                  <span className="text-xs font-bold text-emerald-950 block">Overall Eligibility Result</span>
                  <span className="text-[11px] text-emerald-800 block mt-0.5">Final derived standing verdict</span>
                </div>
              </div>

              <p className="text-xs text-zinc-500 italic text-center pt-1">
                The system repeatedly applies relevant rules until no more conclusions can be derived.
              </p>
            </div>
          </div>

          {/* Illustrative Example Card */}
          <div className="p-6 md:p-8 rounded-2xl bg-zinc-50 border border-zinc-200/90 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-zinc-200/80 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <h3 className="text-base font-bold text-zinc-900">
                  Illustrative Example: Step-by-Step Rule Execution
                </h3>
              </div>
              <span className="text-xs text-zinc-500 font-medium">
                (Educational Walkthrough)
              </span>
            </div>

            <p className="text-xs md:text-sm text-zinc-600 leading-relaxed">
              Consider a student who submits the following profile data for institutional scholarship consideration:
            </p>

            {/* Example Profile Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white border border-zinc-200">
                <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Academic Standing</span>
                <span className="text-sm font-bold text-zinc-900">CGPA: 8.2 / 10</span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-zinc-200">
                <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Family Income</span>
                <span className="text-sm font-bold text-zinc-900">Rs 4,50,000 / yr</span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-zinc-200">
                <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Academic Continuity</span>
                <span className="text-sm font-bold text-zinc-900">0 Active Backlogs</span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-zinc-200">
                <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Class Participation</span>
                <span className="text-sm font-bold text-zinc-900">84.0% Attendance</span>
              </div>
            </div>

            {/* Example Step Trace */}
            <div className="space-y-2.5 pt-2">
              <div className="p-3.5 rounded-xl bg-white border border-zinc-200/90 text-xs md:text-sm space-y-1">
                <span className="font-bold text-zinc-900 block">Step 1: Initial Fact Extraction</span>
                <p className="text-zinc-600 leading-relaxed">
                  The system reads the submitted values and translates them into initial verified facts: CGPA 8.2 meets the minimum merit cutoff (&gt;= 6.0); Annual Income Rs 4,50,000 is under the Rs 8,00,000 ceiling; Backlogs count is 0; Attendance 84% meets the regularity norm (&gt;= 75%).
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-zinc-200/90 text-xs md:text-sm space-y-1">
                <span className="font-bold text-zinc-900 block">Step 2: First Inference Cycle (Applicable Rules Fire)</span>
                <p className="text-zinc-600 leading-relaxed">
                  The inference engine scans all rules in the Knowledge Base. Four baseline rules match the initial facts simultaneously and fire:
                </p>
                <ul className="list-disc list-inside text-zinc-600 space-y-0.5 text-xs pl-2 pt-1">
                  <li><strong>Academic Merit Requirement</strong> fires &rarr; Derives that academic criteria are satisfied.</li>
                  <li><strong>Standard Financial Need Requirement</strong> fires &rarr; Derives that family income meets the applicable limit.</li>
                  <li><strong>Clean Academic Record Requirement</strong> fires &rarr; Derives that academic continuity is satisfied.</li>
                  <li><strong>Attendance Regularity Norm</strong> fires &rarr; Derives that attendance criteria are satisfied.</li>
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-zinc-200/90 text-xs md:text-sm space-y-1">
                <span className="font-bold text-zinc-900 block">Step 3: Second Inference Cycle (Higher-Order Rule Fires)</span>
                <p className="text-zinc-600 leading-relaxed">
                  With the four new derived conclusions now stored in working memory, the system scans the rules once more. The <strong>Universal Full Eligibility Derivation</strong> rule finds all four of its prerequisites satisfied and fires, concluding that the student meets the general eligibility rules.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs md:text-sm space-y-1 text-emerald-950">
                <span className="font-bold block flex items-center gap-1.5 text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Conclusion Reached (Fixed Point)
                </span>
                <p className="text-emerald-800 leading-relaxed">
                  The student is declared <strong>Generally Eligible (Full Standing)</strong>. No further rules can fire, and the Forward Chaining cycle terminates successfully.
                </p>
              </div>
            </div>
          </div>

          {/* Educational Rules Catalog: Baseline Criteria */}
          <div className="space-y-4">
            <div className="border-b border-zinc-200 pb-2">
              <h3 className="text-base font-bold text-zinc-900">
                1. Baseline Eligibility Criteria (Rules R1 – R7)
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Evaluates fundamental academic, socioeconomic, continuity, and attendance standards against statutory thresholds.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {EDUCATIONAL_RULES.filter(r => r.group === 'baseline').map((rule) => (
                <div
                  key={rule.id}
                  className="p-5 md:p-6 rounded-2xl bg-white border border-zinc-200/90 shadow-sm flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 border-b border-zinc-100 pb-2">
                      <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wide">
                        {rule.category}
                      </span>
                      <span className="text-[11px] font-mono text-zinc-400">
                        Rule reference: {rule.id}
                      </span>
                    </div>

                    <h4 className="text-sm md:text-base font-bold text-zinc-900">
                      {rule.title}
                    </h4>

                    <div className="space-y-2 text-xs md:text-sm text-zinc-600 leading-relaxed">
                      <div>
                        <strong className="text-zinc-900 font-semibold block mb-0.5">What it means:</strong>
                        <span>{rule.meaning}</span>
                      </div>
                      <div>
                        <strong className="text-zinc-900 font-semibold block mb-0.5">When it applies:</strong>
                        <span>{rule.appliesWhen}</span>
                      </div>
                      <div>
                        <strong className="text-zinc-900 font-semibold block mb-0.5">What happens next:</strong>
                        <span>{rule.whatHappensNext}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-400 font-mono">
                    <span>Evaluates: <span className="text-zinc-600">{rule.technicalFact}</span></span>
                    <span>Conclusion: <span className="text-emerald-700 font-medium">{rule.derivedConclusion}</span></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Educational Rules Catalog: Higher-Order Synthesis */}
          <div className="space-y-4 pt-4">
            <div className="border-b border-zinc-200 pb-2">
              <h3 className="text-base font-bold text-zinc-900">
                2. Overall Eligibility Derivation Rules (Rules R8 – R11)
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Synthesizes verified baseline criteria to derive final universal or conditional eligibility classifications.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {EDUCATIONAL_RULES.filter(r => r.group === 'synthesis').map((rule) => (
                <div
                  key={rule.id}
                  className="p-5 md:p-6 rounded-2xl bg-white border border-zinc-200/90 shadow-sm flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 border-b border-zinc-100 pb-2">
                      <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wide">
                        {rule.category}
                      </span>
                      <span className="text-[11px] font-mono text-zinc-400">
                        Rule reference: {rule.id}
                      </span>
                    </div>

                    <h4 className="text-sm md:text-base font-bold text-zinc-900">
                      {rule.title}
                    </h4>

                    <div className="space-y-2 text-xs md:text-sm text-zinc-600 leading-relaxed">
                      <div>
                        <strong className="text-zinc-900 font-semibold block mb-0.5">What it means:</strong>
                        <span>{rule.meaning}</span>
                      </div>
                      <div>
                        <strong className="text-zinc-900 font-semibold block mb-0.5">When it applies:</strong>
                        <span>{rule.appliesWhen}</span>
                      </div>
                      <div>
                        <strong className="text-zinc-900 font-semibold block mb-0.5">What happens next:</strong>
                        <span>{rule.whatHappensNext}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-400 font-mono">
                    <span>Evaluates: <span className="text-zinc-600">{rule.technicalFact}</span></span>
                    <span>Conclusion: <span className="text-emerald-700 font-medium">{rule.derivedConclusion}</span></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB CONTENT: BACKWARD CHAINING EXPLANATION                           */}
      {/* ==================================================================== */}
      {activeTab === 'backward' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-zinc-200/90 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-zinc-900 border-b border-zinc-100 pb-3">
              <Compass className="w-5 h-5 text-blue-500" />
              <h2 className="text-base font-bold">Backward Chaining Implementation Details</h2>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed">
              The backward chaining engine in <code className="font-mono bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-800">backend/app/services/rule_engine.py</code> is implemented in <code className="font-mono text-zinc-800">BackwardChainingEngine.prove_goal()</code>. It executes a recursive goal-reduction search over the knowledge base.
            </p>

            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-bold text-zinc-900">Algorithm Execution Steps:</h3>
              <ol className="text-xs text-zinc-600 space-y-2 list-decimal list-inside leading-relaxed">
                <li>
                  <strong>Cycle Detection:</strong> The prover maintains a <code className="font-mono text-zinc-800">visited</code> set of goals along the active proof branch. If an ancestor goal appears again, it aborts recursion and returns <code className="font-mono text-amber-700">status="CYCLE_DETECTED"</code>.
                </li>
                <li>
                  <strong>Base Case Check:</strong> If the requested goal is already present in working memory as an extracted ground fact, its boolean value and certainty status (<code className="font-mono text-zinc-800">"TRUE"</code>, <code className="font-mono text-zinc-800">"FALSE"</code>, or <code className="font-mono text-zinc-800">"UNKNOWN"</code>) are returned immediately.
                </li>
                <li>
                  <strong>OR-Node Expansion:</strong> The engine locates all production rules in the Knowledge Base where <code className="font-mono text-zinc-800">rule.consequent == goal</code>. For instance, <code className="font-mono text-zinc-800">financial_criteria_satisfied</code> has two candidate rules: <strong>R2_FIN_NEED</strong> (standard ceiling) OR <strong>R3_FIN_EXEMPT</strong> (merit waiver).
                </li>
                <li>
                  <strong>AND-Node Verification:</strong> For each candidate rule, the engine recursively calls <code className="font-mono text-zinc-800">prove_goal()</code> on every prerequisite antecedent. If any antecedent fails or is unknown, that rule branch cannot establish the goal.
                </li>
                <li>
                  <strong>Status Resolution:</strong> If all antecedents of at least one candidate rule evaluate to true, the goal returns <code className="font-mono text-emerald-700">status="SATISFIED", satisfied=True</code>. If any prerequisite antecedent evaluated to <code className="font-mono text-purple-700">"UNKNOWN"</code> (due to missing data), the goal returns <code className="font-mono text-purple-700">status="UNKNOWN", satisfied=False</code>. Otherwise, it returns <code className="font-mono text-rose-700">status="UNSATISFIED", satisfied=False</code>.
                </li>
              </ol>
            </div>

            {/* UNKNOWN Handling Callout */}
            <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-900 space-y-1.5">
              <span className="font-bold flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-purple-600" />
                Handling Missing Information and the UNKNOWN State:
              </span>
              <p className="leading-relaxed">
                In many real-world administrative portals, students submit incomplete profiles (e.g. income documents pending or certificates unattached). ScholarAI explicitly distinguishes between a verified failure (<code className="font-mono font-semibold">FALSE</code>: student verified to exceed income limit) and an unresolved state (<code className="font-mono font-semibold">UNKNOWN</code>: student income has not been entered). This allows the administrator to request specific documents without rejecting the applicant outright.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB CONTENT: SCHOLARSHIP MATCHING PIPELINE                          */}
      {/* ==================================================================== */}
      {activeTab === 'matching' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-zinc-200/90 shadow-sm space-y-5">
            <div className="flex items-center gap-2 text-zinc-900 border-b border-zinc-100 pb-3">
              <Award className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-bold">Complete 8-Step Scholarship Assessment Pipeline</h2>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              ScholarAI evaluates students through an integrated multi-tier pipeline that guarantees statutory fairness, crisp rule compliance, and holistic demographic-independent machine learning rankings.
            </p>

            <div className="space-y-3">
              {[
                {
                  step: 1,
                  title: 'Student Profile Completion',
                  desc: 'The student completes their profile, providing academic performance (CGPA, attendance, backlogs) and socioeconomic financials (income, family size).'
                },
                {
                  step: 2,
                  title: 'Symbolic Rule Engine Baseline Verification',
                  desc: 'The rule engine extracts ground facts and executes Forward & Backward Chaining across canonical statutory criteria (R1–R11), determining baseline eligibility (ELIGIBLE, CONDITIONALLY_ELIGIBLE, or NOT_ELIGIBLE).'
                },
                {
                  step: 3,
                  title: 'Demographic-Independent Machine Learning Inference',
                  desc: 'The approved 24-feature pipeline processes academic and achievement features into the production Gradient Boosting model. Social category/caste is strictly excluded from all training and inference.'
                },
                {
                  step: 4,
                  title: 'Hybrid Eligibility Score Synthesis',
                  desc: 'The system computes the weighted Hybrid Score: 45% Statutory Rule Compliance + 55% ML Profile Probability. Note: This measures overall institutional suitability and is NOT the probability of winning a specific scholarship.'
                },
                {
                  step: 5,
                  title: 'Scheme-Specific Threshold Verification',
                  desc: 'Each published scholarship in the database is evaluated against its published cutoffs (min CGPA, max family income, max backlogs, and education level).'
                },
                {
                  step: 6,
                  title: 'Scholarship Recommendation Match Percentage',
                  desc: 'The recommendation engine calculates the transparent Match Percentage for each scheme: 35% ML Profile Strength + 35% Academic Headroom Fit + 20% Financial Need Alignment + 10% Statutory Affirmative Action Fit.'
                },
                {
                  step: 7,
                  title: 'Crisp Scheme Eligibility Status Determination',
                  desc: 'Missing requirements and statutory affirmative action restrictions determine the crisp gatekeeper status (Eligible, Conditionally Eligible, or Not Eligible). Unmet criteria apply structured penalties.'
                },
                {
                  step: 8,
                  title: 'Student Application & Committee Review',
                  desc: 'The student submits an application. Administrators inspect the application dossier, verified certificates, and rule justifications before finalizing an award decision.'
                }
              ].map((item) => (
                <div
                  key={item.step}
                  className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/80 flex items-center gap-3.5 sm:gap-4 transition-colors"
                >
                  <span className="shrink-0 w-7 h-7 rounded-full bg-zinc-900 text-white font-bold text-xs flex items-center justify-center select-none shadow-sm">
                    {item.step}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-zinc-900 leading-snug">
                      {item.title}
                    </h4>
                    <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Three-Tier Score & Status Architecture Card */}
          <div className="p-6 md:p-8 rounded-2xl bg-white border border-zinc-200/90 shadow-sm space-y-6">
            <div className="border-b border-zinc-100 pb-4 space-y-1">
              <div className="flex items-center gap-2 text-zinc-900">
                <Scale className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base md:text-lg font-bold">
                  Three-Tier Architecture: Clean Score & Status Separation
                </h3>
              </div>
              <p className="text-xs md:text-sm text-zinc-500 leading-relaxed">
                Clear distinctions between general institutional readiness, scheme-specific affinity, and mandatory statutory gatekeeper decisions.
              </p>
            </div>

            {/* Stage Progression Flow */}
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-2">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                Evaluation Progression
              </span>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs md:text-sm">
                <div className="p-3 rounded-lg bg-white border border-zinc-200 text-center w-full sm:w-auto flex-1 shadow-sm">
                  <span className="font-bold text-zinc-900 block">General Assessment</span>
                  <span className="text-[11px] text-zinc-500">Tier 1 • Institutional Standards</span>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-400 shrink-0 hidden sm:block" />
                <ArrowDown className="w-4 h-4 text-zinc-400 shrink-0 sm:hidden" />
                <div className="p-3 rounded-lg bg-white border border-zinc-200 text-center w-full sm:w-auto flex-1 shadow-sm">
                  <span className="font-bold text-zinc-900 block">Scholarship-Specific Match</span>
                  <span className="text-[11px] text-zinc-500">Tier 2 • Relative Scheme Fit</span>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-400 shrink-0 hidden sm:block" />
                <ArrowDown className="w-4 h-4 text-zinc-400 shrink-0 sm:hidden" />
                <div className="p-3 rounded-lg bg-white border border-zinc-200 text-center w-full sm:w-auto flex-1 shadow-sm">
                  <span className="font-bold text-zinc-900 block">Final Eligibility Decision</span>
                  <span className="text-[11px] text-zinc-500">Tier 3 • Mandatory Gatekeeper</span>
                </div>
              </div>
            </div>

            {/* Three Tiers Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-1">
              {/* Tier 1 Card */}
              <div className="p-5 sm:p-6 rounded-2xl bg-zinc-50/70 border border-zinc-200/90 flex flex-col justify-between space-y-5">
                <div className="space-y-3.5">
                  <div className="border-b border-zinc-200/70 pb-3">
                    <span className="text-xs font-semibold text-emerald-700 block">
                      Tier 1 — General Student Eligibility
                    </span>
                    <h4 className="text-base font-bold text-zinc-900 mt-1">
                      General AI / Hybrid Eligibility Score
                    </h4>
                    <p className="text-xs text-zinc-500 italic mt-1">
                      Key question: How well does the student meet general eligibility standards?
                    </p>
                  </div>

                  <p className="text-xs md:text-sm text-zinc-600 leading-relaxed">
                    This score gives an overall indication of how well a student meets the platform&apos;s general eligibility standards. It combines the rule-based assessment with the machine-learning model.
                  </p>

                  <div className="space-y-1.5 pt-1">
                    <span className="text-xs font-semibold text-zinc-800 block">
                      Calculation Formula:
                    </span>
                    <div className="p-3 rounded-xl bg-white border border-emerald-200/80 text-xs md:text-sm font-semibold text-zinc-900 shadow-sm text-center">
                      45% Rule-Based Assessment + 55% Machine Learning
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-200/70">
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    <strong>Note:</strong> This score is general-purpose and remains separate from the match score for any individual scholarship.
                  </p>
                </div>
              </div>

              {/* Tier 2 Card */}
              <div className="p-5 sm:p-6 rounded-2xl bg-zinc-50/70 border border-zinc-200/90 flex flex-col justify-between space-y-5">
                <div className="space-y-3.5">
                  <div className="border-b border-zinc-200/70 pb-3">
                    <span className="text-xs font-semibold text-blue-700 block">
                      Tier 2 — Scholarship Match
                    </span>
                    <h4 className="text-base font-bold text-zinc-900 mt-1">
                      Scholarship Match Percentage
                    </h4>
                    <p className="text-xs text-zinc-500 italic mt-1">
                      Key question: How closely does the student match this particular scholarship?
                    </p>
                  </div>

                  <p className="text-xs md:text-sm text-zinc-600 leading-relaxed">
                    This percentage shows how closely a student&apos;s profile matches the requirements and priorities of a particular scholarship. Different scholarships can produce different match percentages for the same student.
                  </p>

                  <div className="space-y-2 pt-1">
                    <span className="text-xs font-semibold text-zinc-800 block">
                      Component Weight Breakdown:
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-white border border-blue-200/80 shadow-sm">
                        <span className="text-blue-900 font-bold block text-sm">35%</span>
                        <span className="text-zinc-600 text-[11px] leading-tight block mt-0.5">ML Profile Strength</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white border border-blue-200/80 shadow-sm">
                        <span className="text-blue-900 font-bold text-sm block">35%</span>
                        <span className="text-zinc-600 text-[11px] leading-tight block mt-0.5">Academic Performance</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white border border-blue-200/80 shadow-sm">
                        <span className="text-blue-900 font-bold text-sm block">20%</span>
                        <span className="text-zinc-600 text-[11px] leading-tight block mt-0.5">Financial Need</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white border border-blue-200/80 shadow-sm">
                        <span className="text-blue-900 font-bold text-sm block">10%</span>
                        <span className="text-zinc-600 text-[11px] leading-tight block mt-0.5">Statutory Fit</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-200/70">
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    <strong>Note:</strong> A higher match percentage indicates stronger alignment with the scholarship, but it does not guarantee selection.
                  </p>
                </div>
              </div>

              {/* Tier 3 Card */}
              <div className="p-5 sm:p-6 rounded-2xl bg-zinc-50/70 border border-zinc-200/90 flex flex-col justify-between space-y-5">
                <div className="space-y-3.5">
                  <div className="border-b border-zinc-200/70 pb-3">
                    <span className="text-xs font-semibold text-amber-700 block">
                      Tier 3 — Final Scholarship Eligibility
                    </span>
                    <h4 className="text-base font-bold text-zinc-900 mt-1">
                      Final Scholarship Eligibility Status
                    </h4>
                    <p className="text-xs text-zinc-500 italic mt-1">
                      Key question: Does the student satisfy mandatory eligibility requirements?
                    </p>
                  </div>

                  <p className="text-xs md:text-sm text-zinc-600 leading-relaxed">
                    Before a student is considered eligible for a scholarship, the system checks its mandatory requirements and any applicable statutory restrictions.
                  </p>

                  <div className="space-y-2 pt-1">
                    <span className="text-xs font-semibold text-zinc-800 block">
                      Possible Decision Outcomes:
                    </span>
                    <div className="space-y-1.5">
                      <div className="p-2.5 rounded-xl bg-white border border-emerald-200 flex items-center justify-between text-xs shadow-sm">
                        <span className="font-bold text-emerald-800">Eligible</span>
                        <span className="text-[11px] text-zinc-500">All mandatory criteria satisfied</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white border border-amber-200 flex items-center justify-between text-xs shadow-sm">
                        <span className="font-bold text-amber-800">Conditionally Eligible</span>
                        <span className="text-[11px] text-zinc-500">Requires attestation or probation</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white border border-rose-200 flex items-center justify-between text-xs shadow-sm">
                        <span className="font-bold text-rose-800">Not Eligible</span>
                        <span className="text-[11px] text-zinc-500">Mandatory requirement not met</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-200/70">
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    <strong>Note:</strong> A high match percentage cannot override a mandatory requirement that the student does not meet.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminExpertSystem;
