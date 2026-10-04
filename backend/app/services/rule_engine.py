"""
Rule-Based Expert System for Scholarship Eligibility
Evaluates crisp mandatory regulatory and institutional criteria.
"""

from typing import Dict, Any, List

class RuleBasedExpertSystem:
    @staticmethod
    def evaluate_general_baseline(student_dict: dict) -> Dict[str, Any]:
        """
        Evaluates general baseline rules required for standard public scholarships.
        """
        passed_rules = []
        failed_rules = []
        warning_rules = []

        cgpa = float(student_dict.get("cgpa", 0.0))
        income = float(student_dict.get("family_income", 1000000.0))
        backlogs = int(student_dict.get("backlogs", 0))
        attendance = float(student_dict.get("attendance", 0.0))

        # Rule 1: Minimum Academic Baseline
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

        # Rule 2: Socioeconomic Need Ceiling
        if income <= 800000.0:
            passed_rules.append({
                "rule": "Income Eligibility Limit",
                "condition": "Family Income <= ₹8,00,000",
                "actual": f"₹{income:,.0f}",
                "status": "PASS"
            })
        elif cgpa >= 8.5:
            # Merit exemption clause
            warning_rules.append({
                "rule": "Income Limit Exemption via Exceptional Merit",
                "condition": "Income > ₹8L allowed if CGPA >= 8.5",
                "actual": f"Income ₹{income:,.0f}, CGPA {cgpa:.2f}",
                "status": "EXEMPTION_APPLIED"
            })
        else:
            failed_rules.append({
                "rule": "Income Eligibility Limit",
                "condition": "Family Income <= ₹8,00,000",
                "actual": f"₹{income:,.0f}",
                "status": "FAIL",
                "message": "Family income exceeds the standard government subsidy ceiling of ₹8 Lakhs."
            })

        # Rule 3: Active Backlogs Constraint
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

        # Rule 4: Minimum Verified Attendance
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

        # Overall Rule Verdict
        if len(failed_rules) == 0 and len(warning_rules) == 0:
            rule_status = "ELIGIBLE"
        elif len(failed_rules) == 0 and len(warning_rules) > 0:
            rule_status = "CONDITIONALLY_ELIGIBLE"
        else:
            rule_status = "NOT_ELIGIBLE"

        return {
            "rule_status": rule_status,
            "passed_rules": passed_rules,
            "warning_rules": warning_rules,
            "failed_rules": failed_rules,
            "total_passed": len(passed_rules),
            "total_failed": len(failed_rules)
        }

    @staticmethod
    def evaluate_scholarship_specific(student_dict: dict, scholarship) -> Dict[str, Any]:
        """
        Evaluates a student against a specific scholarship's criteria.
        """
        cgpa = float(student_dict.get("cgpa", 0.0))
        income = float(student_dict.get("family_income", 1000000.0))
        backlogs = int(student_dict.get("backlogs", 0))
        category = str(student_dict.get("category", "General"))
        gender = str(student_dict.get("gender", "Male"))
        course = str(student_dict.get("course", ""))
        education_level = str(student_dict.get("education_level", ""))

        missing_requirements = []
        is_eligible = True
        is_conditional = False

        # 1. CGPA Criterion
        if cgpa < scholarship.min_cgpa:
            missing_requirements.append(f"Minimum CGPA required is {scholarship.min_cgpa:.1f} (You have {cgpa:.2f})")
            is_eligible = False

        # 2. Income Criterion
        if income > scholarship.max_income:
            missing_requirements.append(f"Family income must be ≤ ₹{scholarship.max_income:,.0f} (Your income is ₹{income:,.0f})")
            is_eligible = False

        # 3. Backlog Criterion
        if backlogs > scholarship.max_backlogs:
            missing_requirements.append(f"Maximum backlogs allowed is {scholarship.max_backlogs} (You have {backlogs})")
            is_eligible = False

        # 4. Category / Social Inclusivity Criterion
        req_cat = scholarship.required_category
        if req_cat != "All":
            if req_cat == "Female" and gender != "Female":
                missing_requirements.append("Exclusively reserved for female scholars.")
                is_eligible = False
            elif req_cat in ["SC", "ST", "OBC", "EWS"] and category != req_cat:
                missing_requirements.append(f"Reserved specifically for candidates belonging to {req_cat} category.")
                is_eligible = False

        # 5. Course & Education Level Criterion
        if scholarship.required_education_level != "All" and scholarship.required_education_level != education_level:
            missing_requirements.append(f"Only applicable for {scholarship.required_education_level} students.")
            is_eligible = False

        status = "Eligible"
        if not is_eligible:
            status = "Conditionally Eligible" if len(missing_requirements) == 1 and backlogs <= 1 else "Not Eligible"

        return {
            "status": status,
            "is_eligible": is_eligible,
            "missing_requirements": missing_requirements
        }
