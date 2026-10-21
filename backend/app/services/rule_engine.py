"""
Rule-Based Expert System for Scholarship Eligibility
Implements Semester AI Experiment 9: Forward Chaining and Backward Chaining
Evaluates crisp mandatory regulatory and institutional criteria without caste/category bias.
"""

from typing import Dict, Any, List, Set, Optional
from dataclasses import dataclass, field


# -----------------------------------------------------------------------------
# Experiment 9 Symbolic Architecture: Knowledge Base & Rules
# -----------------------------------------------------------------------------

@dataclass
class Rule:
    """Represents a horn clause or production rule in the knowledge base."""
    id: str
    name: str
    antecedents: List[str]  # Required prerequisite facts (AND-conjunction)
    consequent: str         # Fact inferred when all antecedents hold
    description: str


@dataclass
class Fact:
    """Represents a verified ground-truth fact or an inferred conclusion."""
    name: str
    value: bool
    source: str = "INFERRED"  # "INPUT", "INFERRED", or "HYPOTHESIS"
    evidence: str = ""
    status: str = "TRUE"      # "TRUE", "FALSE", "UNKNOWN"


class ForwardChainingEngine:
    """
    Forward Chaining (Data-Driven Reasoning):
    Begins with verified student facts (CGPA, attendance, backlogs, family income),
    iteratively fires eligible rules whose prerequisites are fully satisfied,
    and derives higher-level conclusions until a fixed point is reached.
    """
    def __init__(self, rules: List[Rule]):
        self.rules = rules

    def infer(self, initial_facts: Dict[str, Fact], max_iterations: int = 50) -> Dict[str, Any]:
        facts = {k: v for k, v in initial_facts.items()}
        derivation_trace = []
        iteration = 0
        fired_rules: Set[str] = set()

        while iteration < max_iterations:
            iteration += 1
            new_fact_derived = False

            for rule in self.rules:
                if rule.id in fired_rules:
                    continue

                # Check if all antecedents are present and evaluate to TRUE
                all_satisfied = True
                missing_or_false = []
                for ant in rule.antecedents:
                    if ant not in facts or facts[ant].value is not True or facts[ant].status != "TRUE":
                        all_satisfied = False
                        missing_or_false.append(ant)

                if all_satisfied:
                    # Fire rule and derive consequent
                    if rule.consequent not in facts or facts[rule.consequent].value is not True:
                        facts[rule.consequent] = Fact(
                            name=rule.consequent,
                            value=True,
                            source="INFERRED",
                            evidence=f"Derived by rule '{rule.name}' ({rule.id}) from [{', '.join(rule.antecedents)}]",
                            status="TRUE"
                        )
                        fired_rules.add(rule.id)
                        derivation_trace.append({
                            "iteration": iteration,
                            "rule_id": rule.id,
                            "rule_name": rule.name,
                            "antecedents": rule.antecedents,
                            "consequent": rule.consequent,
                            "description": rule.description
                        })
                        new_fact_derived = True
                        break  # restart search after deriving new fact

            if not new_fact_derived:
                break

        return {
            "facts": facts,
            "fired_rules": list(fired_rules),
            "derivation_trace": derivation_trace,
            "total_iterations": iteration
        }


class BackwardChainingEngine:
    """
    Backward Chaining (Goal-Driven Reasoning):
    Given a goal such as 'generally_eligible', searches for rules concluding that goal,
    and recursively verifies whether their prerequisite antecedents are satisfied,
    unsatisfied, or unknown.
    """
    def __init__(self, rules: List[Rule]):
        self.rules = rules

    def prove_goal(
        self,
        goal: str,
        known_facts: Dict[str, Fact],
        visited: Optional[Set[str]] = None
    ) -> Dict[str, Any]:
        if visited is None:
            visited = set()

        # Cycle detection
        if goal in visited:
            return {
                "goal": goal,
                "status": "CYCLE_DETECTED",
                "satisfied": False,
                "subproofs": [],
                "message": f"Circular inference loop detected on goal '{goal}'"
            }

        visited.add(goal)

        # 1. Base case: Check if goal is already a verified ground fact
        if goal in known_facts:
            fact = known_facts[goal]
            return {
                "goal": goal,
                "status": fact.status,
                "satisfied": (fact.value is True and fact.status == "TRUE"),
                "is_ground_fact": True,
                "evidence": fact.evidence,
                "subproofs": []
            }

        # 2. Find candidate rules that conclude this goal (OR-node)
        candidate_rules = [r for r in self.rules if r.consequent == goal]
        if not candidate_rules:
            # Fact is not known and no rule can derive it
            return {
                "goal": goal,
                "status": "UNKNOWN",
                "satisfied": False,
                "is_ground_fact": False,
                "message": f"No knowledge base rule or ground fact can establish '{goal}'",
                "subproofs": []
            }

        rule_proofs = []
        overall_satisfied = False

        for rule in candidate_rules:
            rule_antecedents_satisfied = True
            rule_has_unknown = False
            antecedent_subproofs = []

            # Verify each antecedent (AND-node)
            for ant in rule.antecedents:
                subproof = self.prove_goal(ant, known_facts, visited.copy())
                antecedent_subproofs.append(subproof)
                if not subproof["satisfied"]:
                    rule_antecedents_satisfied = False
                if subproof["status"] == "UNKNOWN":
                    rule_has_unknown = True

            rule_status = "SATISFIED" if rule_antecedents_satisfied else ("UNKNOWN" if rule_has_unknown else "UNSATISFIED")
            rule_proofs.append({
                "rule_id": rule.id,
                "rule_name": rule.name,
                "rule_status": rule_status,
                "antecedent_proofs": antecedent_subproofs
            })

            if rule_antecedents_satisfied:
                overall_satisfied = True
                break  # Goal established via this rule

        return {
            "goal": goal,
            "status": "SATISFIED" if overall_satisfied else ("UNKNOWN" if any(rp["rule_status"] == "UNKNOWN" for rp in rule_proofs) else "UNSATISFIED"),
            "satisfied": overall_satisfied,
            "is_ground_fact": False,
            "candidate_rules_evaluated": rule_proofs
        }


# -----------------------------------------------------------------------------
# Transparent Knowledge Base Rules (Decoupled from Caste/Category)
# -----------------------------------------------------------------------------

def build_scholarship_knowledge_base() -> List[Rule]:
    """
    Constructs the canonical, transparent rule set for general scholarship eligibility.
    Relies strictly on academic merit, socioeconomic need, attendance, and backlogs.
    """
    return [
        Rule(
            id="R1_ACAD_MERIT",
            name="Academic Merit Standard",
            antecedents=["academic_merit_passed"],
            consequent="academic_criteria_satisfied",
            description="Student meets the minimum institutional baseline of CGPA >= 6.0"
        ),
        Rule(
            id="R2_FIN_NEED",
            name="Socioeconomic Income Ceiling",
            antecedents=["income_need_passed"],
            consequent="financial_criteria_satisfied",
            description="Annual family income is within standard government subsidy ceiling (<= Rs 8,00,000)"
        ),
        Rule(
            id="R3_FIN_EXEMPT",
            name="Exceptional Merit Income Exemption",
            antecedents=["income_exempt_applied"],
            consequent="financial_criteria_satisfied",
            description="Income ceiling waiver applied due to exceptional academic performance (CGPA >= 8.5)"
        ),
        Rule(
            id="R4_BACKLOG_CLEAN",
            name="Clean Academic Record",
            antecedents=["backlog_norm_passed"],
            consequent="continuity_criteria_satisfied",
            description="Zero active backlogs confirms exemplary academic continuity"
        ),
        Rule(
            id="R5_BACKLOG_COND",
            name="Marginal Backlog Tolerance",
            antecedents=["backlog_marginal_passed"],
            consequent="continuity_conditional_satisfied",
            description="Single active backlog permitted conditionally under academic probation"
        ),
        Rule(
            id="R6_ATTENDANCE_FULL",
            name="Attendance Regularity Norm",
            antecedents=["attendance_regularity_passed"],
            consequent="attendance_criteria_satisfied",
            description="Attendance >= 75% satisfies standard statutory continuous learning requirements"
        ),
        Rule(
            id="R7_ATTENDANCE_COND",
            name="Borderline Attendance Tolerance",
            antecedents=["attendance_borderline_passed"],
            consequent="attendance_conditional_satisfied",
            description="Attendance 65%-74.9% permitted conditionally pending administrative attestation"
        ),
        # Higher-Order Goal Rules
        Rule(
            id="R8_FULL_ELIGIBILITY",
            name="Universal Full Eligibility Derivation",
            antecedents=[
                "academic_criteria_satisfied",
                "financial_criteria_satisfied",
                "continuity_criteria_satisfied",
                "attendance_criteria_satisfied"
            ],
            consequent="generally_eligible",
            description="Student satisfies all statutory dimensions with full compliance"
        ),
        Rule(
            id="R9_COND_ELIGIBILITY_BACKLOG",
            name="Conditional Eligibility (Probationary Backlog)",
            antecedents=[
                "academic_criteria_satisfied",
                "financial_criteria_satisfied",
                "continuity_conditional_satisfied",
                "attendance_criteria_satisfied"
            ],
            consequent="conditionally_eligible",
            description="Satisfies academic, income, and attendance norms with 1 tolerated backlog"
        ),
        Rule(
            id="R10_COND_ELIGIBILITY_ATTENDANCE",
            name="Conditional Eligibility (Attestation Attendance)",
            antecedents=[
                "academic_criteria_satisfied",
                "financial_criteria_satisfied",
                "continuity_criteria_satisfied",
                "attendance_conditional_satisfied"
            ],
            consequent="conditionally_eligible",
            description="Satisfies academic, income, and backlog norms with borderline attendance"
        ),
        Rule(
            id="R11_COND_ELIGIBILITY_BOTH",
            name="Conditional Eligibility (Dual Borderline)",
            antecedents=[
                "academic_criteria_satisfied",
                "financial_criteria_satisfied",
                "continuity_conditional_satisfied",
                "attendance_conditional_satisfied"
            ],
            consequent="conditionally_eligible",
            description="Borderline academic continuity and attendance permitted under review"
        ),
    ]


# -----------------------------------------------------------------------------
# Integrated Rule-Based Expert System (Forward + Backward Chaining)
# -----------------------------------------------------------------------------

class RuleBasedExpertSystem:
    """
    Expert System orchestrating Forward and Backward Chaining algorithms
    alongside crisp scholarship-specific rule validation.
    """

    def __init__(self):
        self.rules = build_scholarship_knowledge_base()
        self.fc_engine = ForwardChainingEngine(self.rules)
        self.bc_engine = BackwardChainingEngine(self.rules)

    def extract_ground_facts(self, student_dict: dict) -> Dict[str, Fact]:
        """
        Translates raw student features into symbolic ground facts.
        Explicitly represents missing data as UNKNOWN rather than guessing.
        """
        facts: Dict[str, Fact] = {}

        # 1. Academic Performance
        raw_cgpa = student_dict.get("cgpa")
        if raw_cgpa is None:
            facts["academic_merit_passed"] = Fact("academic_merit_passed", False, "INPUT", "CGPA is missing", "UNKNOWN")
            facts["income_exempt_applied"] = Fact("income_exempt_applied", False, "INPUT", "CGPA is missing", "UNKNOWN")
        else:
            cgpa = float(raw_cgpa)
            if cgpa >= 6.0:
                facts["academic_merit_passed"] = Fact("academic_merit_passed", True, "INPUT", f"CGPA {cgpa:.2f} >= 6.0")
            else:
                facts["academic_merit_passed"] = Fact("academic_merit_passed", False, "INPUT", f"CGPA {cgpa:.2f} < 6.0", "FALSE")

        # 2. Socioeconomic Need & Income Exemption
        raw_income = student_dict.get("family_income")
        if raw_income is None:
            facts["income_need_passed"] = Fact("income_need_passed", False, "INPUT", "Family income is missing", "UNKNOWN")
        else:
            income = float(raw_income)
            cgpa_val = float(raw_cgpa) if raw_cgpa is not None else 0.0

            if income <= 800000.0:
                facts["income_need_passed"] = Fact("income_need_passed", True, "INPUT", f"Family income Rs {income:,.0f} <= Rs 8,00,000")
            else:
                facts["income_need_passed"] = Fact("income_need_passed", False, "INPUT", f"Family income Rs {income:,.0f} > Rs 8,00,000", "FALSE")

            if income > 800000.0 and cgpa_val >= 8.5:
                facts["income_exempt_applied"] = Fact("income_exempt_applied", True, "INPUT", f"Income waiver granted: CGPA {cgpa_val:.2f} >= 8.5")
            else:
                facts["income_exempt_applied"] = Fact("income_exempt_applied", False, "INPUT", "No income waiver applicable", "FALSE")

        # 3. Academic Continuity (Backlogs)
        raw_backlogs = student_dict.get("backlogs")
        if raw_backlogs is None:
            facts["backlog_norm_passed"] = Fact("backlog_norm_passed", False, "INPUT", "Backlog count missing", "UNKNOWN")
            facts["backlog_marginal_passed"] = Fact("backlog_marginal_passed", False, "INPUT", "Backlog count missing", "UNKNOWN")
        else:
            backlogs = int(raw_backlogs)
            if backlogs == 0:
                facts["backlog_norm_passed"] = Fact("backlog_norm_passed", True, "INPUT", "0 Active backlogs")
                facts["backlog_marginal_passed"] = Fact("backlog_marginal_passed", False, "INPUT", "0 Backlogs", "FALSE")
            elif backlogs == 1:
                facts["backlog_norm_passed"] = Fact("backlog_norm_passed", False, "INPUT", "1 Backlog exists", "FALSE")
                facts["backlog_marginal_passed"] = Fact("backlog_marginal_passed", True, "INPUT", "1 Backlog allowed conditionally")
            else:
                facts["backlog_norm_passed"] = Fact("backlog_norm_passed", False, "INPUT", f"{backlogs} Backlogs > 1", "FALSE")
                facts["backlog_marginal_passed"] = Fact("backlog_marginal_passed", False, "INPUT", f"{backlogs} Backlogs > 1", "FALSE")

        # 4. Attendance Regularity
        raw_attendance = student_dict.get("attendance")
        if raw_attendance is None:
            facts["attendance_regularity_passed"] = Fact("attendance_regularity_passed", False, "INPUT", "Attendance missing", "UNKNOWN")
            facts["attendance_borderline_passed"] = Fact("attendance_borderline_passed", False, "INPUT", "Attendance missing", "UNKNOWN")
        else:
            attendance = float(raw_attendance)
            if attendance >= 75.0:
                facts["attendance_regularity_passed"] = Fact("attendance_regularity_passed", True, "INPUT", f"Attendance {attendance:.1f}% >= 75%")
                facts["attendance_borderline_passed"] = Fact("attendance_borderline_passed", False, "INPUT", "Attendance >= 75%", "FALSE")
            elif attendance >= 65.0:
                facts["attendance_regularity_passed"] = Fact("attendance_regularity_passed", False, "INPUT", f"Attendance {attendance:.1f}% < 75%", "FALSE")
                facts["attendance_borderline_passed"] = Fact("attendance_borderline_passed", True, "INPUT", f"Attendance {attendance:.1f}% in [65%, 75%)")
            else:
                facts["attendance_regularity_passed"] = Fact("attendance_regularity_passed", False, "INPUT", f"Attendance {attendance:.1f}% < 65%", "FALSE")
                facts["attendance_borderline_passed"] = Fact("attendance_borderline_passed", False, "INPUT", f"Attendance {attendance:.1f}% < 65%", "FALSE")

        return facts

    def evaluate_general_baseline(self, student_dict: dict) -> Dict[str, Any]:
        """
        Executes Forward Chaining and Backward Chaining over documented statutory criteria.
        Returns standardized verdict, passed/failed rule lists, and symbolic reasoning traces.
        """
        # Step 1: Extract ground facts from verified inputs
        initial_facts = self.extract_ground_facts(student_dict)

        # Step 2: Execute Forward Chaining (Data-driven inference)
        fc_result = self.fc_engine.infer(initial_facts)
        derived_facts = fc_result["facts"]

        # Step 3: Execute Backward Chaining for Primary Goal 'generally_eligible'
        bc_full = self.bc_engine.prove_goal("generally_eligible", initial_facts)
        bc_cond = self.bc_engine.prove_goal("conditionally_eligible", initial_facts)

        # Step 4: Compile human-readable audit rules (maintaining API contract)
        raw_cgpa = student_dict.get("cgpa")
        cgpa = float(raw_cgpa) if raw_cgpa is not None else 0.0

        raw_income = student_dict.get("family_income")
        income = float(raw_income) if raw_income is not None else 1000000.0

        raw_backlogs = student_dict.get("backlogs")
        backlogs = int(raw_backlogs) if raw_backlogs is not None else 0

        raw_attendance = student_dict.get("attendance")
        attendance = float(raw_attendance) if raw_attendance is not None else 0.0

        passed_rules = []
        failed_rules = []
        warning_rules = []

        # Audit Rule 1: Academic Merit
        if cgpa >= 6.0:
            passed_rules.append({
                "rule": "Academic Merit Baseline",
                "condition": "CGPA >= 6.0",
                "actual": f"CGPA {cgpa:.2f}",
                "status": "PASS"
            })
        else:
            failed_rules.append({
                "rule": "Academic Merit Baseline",
                "condition": "CGPA >= 6.0",
                "actual": f"CGPA {cgpa:.2f}",
                "status": "FAIL",
                "message": "Minimum CGPA of 6.0 is required for public scholarship consideration."
            })

        # Audit Rule 2: Socioeconomic Need Ceiling
        if income <= 800000.0:
            passed_rules.append({
                "rule": "Income Eligibility Limit",
                "condition": "Family Income <= Rs 8,00,000",
                "actual": f"Rs {income:,.0f}",
                "status": "PASS"
            })
        elif cgpa >= 8.5:
            warning_rules.append({
                "rule": "Income Limit Exemption via Exceptional Merit",
                "condition": "Income > Rs 8L allowed if CGPA >= 8.5",
                "actual": f"Income Rs {income:,.0f}, CGPA {cgpa:.2f}",
                "status": "EXEMPTION_APPLIED"
            })
        else:
            failed_rules.append({
                "rule": "Income Eligibility Limit",
                "condition": "Family Income <= Rs 8,00,000",
                "actual": f"Rs {income:,.0f}",
                "status": "FAIL",
                "message": "Family income exceeds the standard government subsidy ceiling of Rs 8 Lakhs."
            })

        # Audit Rule 3: Backlog Continuity
        if backlogs == 0:
            passed_rules.append({
                "rule": "Clean Backlog Record",
                "condition": "Active Backlogs == 0",
                "actual": "0 Backlogs",
                "status": "PASS"
            })
        elif backlogs <= 1:
            warning_rules.append({
                "rule": "Marginal Backlog Tolerance",
                "condition": "Active Backlogs <= 1",
                "actual": f"{backlogs} Backlog",
                "status": "CONDITIONAL",
                "message": "Permitted under probation for select non-tier-1 scholarships."
            })
        else:
            failed_rules.append({
                "rule": "Excessive Backlogs",
                "condition": "Active Backlogs <= 1",
                "actual": f"{backlogs} Backlogs",
                "status": "FAIL",
                "message": "Students with more than 1 active backlog are ineligible under academic continuity norms."
            })

        # Audit Rule 4: Attendance Regularity
        if attendance >= 75.0:
            passed_rules.append({
                "rule": "Attendance Requirement",
                "condition": "Attendance >= 75%",
                "actual": f"{attendance:.1f}%",
                "status": "PASS"
            })
        elif attendance >= 65.0:
            warning_rules.append({
                "rule": "Borderline Attendance",
                "condition": "Attendance 65% - 74%",
                "actual": f"{attendance:.1f}%",
                "status": "CONDITIONAL",
                "message": "Requires special institutional attestation or medical condonation."
            })
        else:
            failed_rules.append({
                "rule": "Substandard Attendance",
                "condition": "Attendance >= 65%",
                "actual": f"{attendance:.1f}%",
                "status": "FAIL",
                "message": "Attendance below 65% violates continuous assessment guidelines."
            })

        # Step 5: Synthesize Symbolic Decision
        is_fully_eligible = (
            derived_facts.get("generally_eligible") is not None and
            derived_facts["generally_eligible"].value is True
        )
        is_conditionally_eligible = (
            derived_facts.get("conditionally_eligible") is not None and
            derived_facts["conditionally_eligible"].value is True
        )

        if is_fully_eligible or (len(failed_rules) == 0 and len(warning_rules) == 0):
            rule_status = "ELIGIBLE"
        elif is_conditionally_eligible or (len(failed_rules) == 0 and len(warning_rules) > 0):
            rule_status = "CONDITIONALLY_ELIGIBLE"
        else:
            rule_status = "NOT_ELIGIBLE"

        return {
            "rule_status": rule_status,
            "passed_rules": passed_rules,
            "warning_rules": warning_rules,
            "failed_rules": failed_rules,
            "total_passed": len(passed_rules),
            "total_failed": len(failed_rules),
            "symbolic_reasoning": {
                "algorithm": "Experiment 9: Forward & Backward Chaining",
                "forward_chaining": {
                    "derived_facts": [k for k, v in derived_facts.items() if v.value is True],
                    "derivation_steps": fc_result["derivation_trace"],
                    "fired_rules_count": len(fc_result["fired_rules"])
                },
                "backward_chaining": {
                    "goal": "generally_eligible",
                    "status": bc_full["status"],
                    "satisfied": bc_full["satisfied"],
                    "conditional_goal_satisfied": bc_cond["satisfied"]
                }
            }
        }

    def get_reasoning_diagnostic(self, student_dict: dict, target_goal: str = "generally_eligible") -> Dict[str, Any]:
        """
        Executes Forward and Backward Chaining and formats a comprehensive,
        transparent diagnostic breakdown for the Admin Expert System & Reasoning Explorer.
        """
        initial_facts = self.extract_ground_facts(student_dict)

        # 1. Forward Chaining
        fc_result = self.fc_engine.infer(initial_facts)
        derived_facts = fc_result["facts"]

        # 2. Backward Chaining for chosen target goal (and primary baseline goals)
        bc_proof = self.bc_engine.prove_goal(target_goal, initial_facts)
        bc_full = self.bc_engine.prove_goal("generally_eligible", initial_facts)
        bc_cond = self.bc_engine.prove_goal("conditionally_eligible", initial_facts)

        # Unresolved / Unknown facts from initial extraction
        unresolved_facts = [
            {
                "name": f.name,
                "value": f.value,
                "status": f.status,
                "evidence": f.evidence,
                "source": f.source
            }
            for f in initial_facts.values() if f.status == "UNKNOWN"
        ]

        # Serialized initial facts
        ground_facts_list = [
            {
                "name": f.name,
                "value": f.value,
                "status": f.status,
                "evidence": f.evidence,
                "source": f.source
            }
            for f in initial_facts.values()
        ]

        # Serialized knowledge base rules
        kb_rules = [
            {
                "id": r.id,
                "name": r.name,
                "antecedents": r.antecedents,
                "consequent": r.consequent,
                "description": r.description
            }
            for r in self.rules
        ]

        # Determine overall general verdict
        is_fully_eligible = (
            derived_facts.get("generally_eligible") is not None and
            derived_facts["generally_eligible"].value is True
        )
        is_conditionally_eligible = (
            derived_facts.get("conditionally_eligible") is not None and
            derived_facts["conditionally_eligible"].value is True
        )
        if is_fully_eligible:
            general_verdict = "ELIGIBLE"
        elif is_conditionally_eligible:
            general_verdict = "CONDITIONALLY_ELIGIBLE"
        else:
            general_verdict = "NOT_ELIGIBLE"

        return {
            "ground_facts": ground_facts_list,
            "knowledge_base": kb_rules,
            "unresolved_facts": unresolved_facts,
            "general_verdict": general_verdict,
            "forward_chaining": {
                "fired_rules": fc_result["fired_rules"],
                "derivation_trace": fc_result["derivation_trace"],
                "total_iterations": fc_result["total_iterations"],
                "derived_facts": [
                    {
                        "name": k,
                        "value": v.value,
                        "status": v.status,
                        "evidence": v.evidence,
                        "source": v.source
                    }
                    for k, v in derived_facts.items() if v.source == "INFERRED"
                ],
                "reached_generally_eligible": is_fully_eligible,
                "reached_conditionally_eligible": is_conditionally_eligible
            },
            "backward_chaining": {
                "target_goal": target_goal,
                "status": bc_proof.get("status", "UNKNOWN"),
                "satisfied": bc_proof.get("satisfied", False),
                "is_ground_fact": bc_proof.get("is_ground_fact", False),
                "proof_tree": bc_proof,
                "primary_goals": {
                    "generally_eligible": {
                        "status": bc_full.get("status"),
                        "satisfied": bc_full.get("satisfied")
                    },
                    "conditionally_eligible": {
                        "status": bc_cond.get("status"),
                        "satisfied": bc_cond.get("satisfied")
                    }
                }
            }
        }

    @staticmethod
    def evaluate_scholarship_specific(student_dict: dict, scholarship) -> Dict[str, Any]:
        """
        Evaluates a student against a specific published scholarship's criteria.
        """
        raw_cgpa = student_dict.get("cgpa")
        cgpa = float(raw_cgpa) if raw_cgpa is not None else 0.0

        raw_income = student_dict.get("family_income")
        income = float(raw_income) if raw_income is not None else 1000000.0

        raw_backlogs = student_dict.get("backlogs")
        backlogs = int(raw_backlogs) if raw_backlogs is not None else 0

        raw_cat = student_dict.get("category")
        category = str(raw_cat).strip() if raw_cat is not None and str(raw_cat).strip().lower() not in ["none", "null", ""] else None

        raw_gender = student_dict.get("gender")
        gender = str(raw_gender).strip() if raw_gender is not None else "Male"

        raw_course = student_dict.get("course")
        course = str(raw_course).strip() if raw_course is not None else ""

        raw_edu = student_dict.get("education_level")
        education_level = str(raw_edu).strip() if raw_edu is not None else ""

        missing_requirements = []
        is_eligible = True

        # 1. CGPA Criterion
        if cgpa < scholarship.min_cgpa:
            missing_requirements.append(f"Minimum CGPA required is {scholarship.min_cgpa:.1f} (You have {cgpa:.2f})")
            is_eligible = False

        # 2. Income Criterion
        if income > scholarship.max_income:
            missing_requirements.append(f"Family income must be <= Rs {scholarship.max_income:,.0f} (Your income is Rs {income:,.0f})")
            is_eligible = False

        # 3. Backlog Criterion
        if backlogs > scholarship.max_backlogs:
            missing_requirements.append(f"Maximum backlogs allowed is {scholarship.max_backlogs} (You have {backlogs})")
            is_eligible = False

        # 4. Statutory Category / Affirmative Action Requirement
        req_cat = getattr(scholarship, "required_category", "All")
        if req_cat and req_cat != "All":
            if req_cat == "Female" and gender != "Female":
                missing_requirements.append("Exclusively reserved for female scholars.")
                is_eligible = False
            elif req_cat in ["SC", "ST", "OBC", "EWS"] and category != req_cat:
                missing_requirements.append(f"Reserved specifically for candidates belonging to {req_cat} category.")
                is_eligible = False

        # 5. Course & Education Level Criterion
        req_edu = getattr(scholarship, "required_education_level", "All")
        if req_edu and req_edu != "All" and req_edu != education_level:
            missing_requirements.append(f"Only applicable for {req_edu} students.")
            is_eligible = False

        status = "Eligible"
        if not is_eligible:
            status = "Conditionally Eligible" if len(missing_requirements) == 1 and backlogs <= 1 else "Not Eligible"

        return {
            "status": status,
            "is_eligible": is_eligible,
            "missing_requirements": missing_requirements
        }
