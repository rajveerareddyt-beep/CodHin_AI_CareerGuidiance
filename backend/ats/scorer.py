import re
from typing import Dict, List, Any, Optional

# High-impact strong action verbs recognized by enterprise ATS systems
STRONG_ACTION_VERBS = {
    "spearheaded", "engineered", "architected", "developed", "designed", "optimized",
    "streamlined", "orchestrated", "implemented", "automated", "accelerated", "deployed",
    "delivered", "pioneered", "refactored", "formulated", "executed", "collaborated",
    "mentored", "championed", "scaled", "decreased", "increased", "maximized",
    "reduced", "transformed", "generated", "centralized", "revamped", "modernized"
}

# Weak, passive or overused resume verbs
WEAK_VERBS = {
    "responsible for", "helped", "assisted", "worked on", "handled", "participated in",
    "tried", "attempted", "did", "tasked with", "involved in", "supported"
}

# Quantifiable metric patterns
METRIC_PATTERNS = [
    r'\b\d+%\b',                           # e.g. 40%, 15%
    r'\$\s*\d+(?:,\d+)*(?:\.\d+)?\s*[kKmMbB]?', # e.g. $50k, $1.2M, $500,000
    r'\b\d+(?:,\d+)*\+?\s*(?:users|clients|customers|requests|transactions|queries|rps|tps|downloads|stars)\b', # e.g. 10,000+ users
    r'\b\d+x\b',                           # e.g. 3x faster, 10x
    r'\breduced\s+by\s+\d+',               # e.g. reduced by 30
    r'\bincreased\s+by\s+\d+',              # e.g. increased by 50
    r'\bsaved\s+\d+',                      # e.g. saved 20 hours
    r'\b\d+\s*(?:ms|seconds|minutes|hours|days|weeks|months)\b' # e.g. 120ms, 4 weeks
]

ROLE_SKILL_BENCHMARKS = {
    # Full Stack & Web
    "mern": ["react", "node.js", "express", "mongodb", "javascript", "typescript", "rest api", "html", "css", "redux"],
    "mean": ["angular", "node.js", "express", "mongodb", "javascript", "typescript", "rest api", "html", "css"],
    "full-stack": ["react", "node.js", "typescript", "python", "mysql", "postgresql", "docker", "aws", "redis", "microservices", "ci/cd", "system design", "git", "rest api"],
    "full stack": ["react", "node.js", "typescript", "python", "mysql", "postgresql", "docker", "aws", "redis", "microservices", "ci/cd", "system design", "git", "rest api"],

    # Frontend
    "frontend": ["react", "javascript", "typescript", "html", "css", "tailwind css", "next.js", "vue", "angular", "redux", "jest", "responsive design", "vite", "webpack"],
    "react": ["react", "javascript", "typescript", "next.js", "redux", "html", "css", "tailwind css", "jest", "rest api"],
    "vue": ["vue", "javascript", "typescript", "vuex", "nuxt", "html", "css", "tailwind css", "vite"],
    "angular": ["angular", "typescript", "javascript", "rxjs", "html", "css", "bootstrap"],

    # Backend
    "backend": ["python", "java", "node.js", "fastapi", "django", "spring boot", "go", "postgresql", "mysql", "redis", "microservices", "docker", "rest api", "sql", "git"],
    "python": ["python", "fastapi", "django", "flask", "postgresql", "mysql", "redis", "docker", "rest api", "sql", "git"],
    "java": ["java", "spring boot", "microservices", "hibernate", "mysql", "postgresql", "docker", "kafka", "rest api", "unit testing"],
    "node": ["node.js", "express", "typescript", "javascript", "mongodb", "postgresql", "redis", "rest api", "docker"],
    "golang": ["go", "microservices", "docker", "kubernetes", "grpc", "postgresql", "redis", "concurrency", "git"],
    "go ": ["go", "microservices", "docker", "kubernetes", "grpc", "postgresql", "redis", "concurrency", "git"],
    "c#": ["c#", ".net", "asp.net", "sql server", "azure", "microservices", "rest api", "entity framework"],
    ".net": ["c#", ".net", "asp.net", "sql server", "azure", "microservices", "rest api", "entity framework"],
    "c++": ["c++", "data structures", "algorithms", "multithreading", "linux", "system design", "oop", "git"],
    "rust": ["rust", "concurrency", "memory management", "systems programming", "linux", "git", "docker"],

    # AI & Data Science
    "machine learning": ["python", "pytorch", "tensorflow", "scikit-learn", "deep learning", "nlp", "computer vision", "pandas", "numpy", "mlops", "machine learning", "docker"],
    "ai ": ["python", "pytorch", "tensorflow", "deep learning", "nlp", "llm", "langchain", "generative ai", "pandas", "numpy", "scikit-learn"],
    "data science": ["python", "r", "machine learning", "statistics", "pandas", "numpy", "scikit-learn", "sql", "data visualization", "tableau", "deep learning"],
    "data scientist": ["python", "r", "machine learning", "statistics", "pandas", "numpy", "scikit-learn", "sql", "data visualization", "tableau", "deep learning"],
    "data engineer": ["python", "sql", "spark", "kafka", "snowflake", "databricks", "etl", "airflow", "aws", "postgresql", "big data", "data modeling"],
    "analytics": ["sql", "python", "tableau", "power bi", "excel", "data analysis", "statistics", "data modeling"],
    "prompt": ["llm", "generative ai", "prompt engineering", "langchain", "python", "nlp", "api"],

    # Cloud & DevOps & SRE
    "devops": ["aws", "docker", "kubernetes", "terraform", "ci/cd", "linux", "jenkins", "ansible", "prometheus", "grafana", "git", "cloud"],
    "cloud": ["aws", "azure", "gcp", "cloud architecture", "docker", "kubernetes", "terraform", "security", "linux", "networking"],
    "sre": ["linux", "kubernetes", "docker", "monitoring", "prometheus", "grafana", "python", "go", "ci/cd", "system reliability", "incident management"],
    "platform": ["kubernetes", "docker", "terraform", "aws", "ci/cd", "go", "python", "linux", "infrastructure as code"],

    # Cybersecurity
    "security": ["network security", "siem", "soc", "penetration testing", "vulnerability assessment", "cryptography", "appsec", "owasp", "firewalls", "security", "linux"],
    "cyber": ["network security", "siem", "soc", "penetration testing", "vulnerability assessment", "cryptography", "appsec", "owasp", "firewalls", "security", "linux"],

    # Mobile
    "ios": ["swift", "swiftui", "objective-c", "xcode", "ios", "cocoapods", "rest api", "git", "mobile app"],
    "android": ["kotlin", "java", "android studio", "jetpack", "android", "rest api", "git", "mobile app"],
    "mobile": ["react native", "flutter", "swift", "kotlin", "ios", "android", "mobile app", "rest api", "git"],
    "react native": ["react native", "react", "javascript", "typescript", "redux", "ios", "android", "mobile app"],
    "flutter": ["flutter", "dart", "mobile app", "ios", "android", "state management", "rest api"],

    # Product & Management
    "product manager": ["product management", "product strategy", "agile", "scrum", "jira", "user stories", "roadmap", "market research", "a/b testing", "cross-functional leadership", "communication"],
    "product": ["product management", "agile", "scrum", "jira", "user stories", "roadmap", "market research", "analytics", "cross-functional leadership"],
    "engineering manager": ["leadership", "engineering management", "mentorship", "agile", "system design", "architecture", "hiring", "cross-functional", "communication"],
    "scrum": ["scrum", "agile", "jira", "sprint planning", "retrospectives", "kanban", "facilitation", "coaching"],

    # QA & Test
    "qa": ["selenium", "cypress", "playwright", "jest", "pytest", "unit testing", "test automation", "postman", "api testing", "ci/cd", "jira"],
    "sdet": ["selenium", "cypress", "playwright", "python", "java", "javascript", "test automation", "api testing", "ci/cd", "pytest", "jest"],
    "test": ["selenium", "cypress", "playwright", "unit testing", "test automation", "qa", "jira", "manual testing"],

    # UI/UX & Design
    "ui/ux": ["figma", "wireframing", "prototyping", "user research", "design systems", "ui/ux", "usability testing", "adobe xd", "interaction design"],
    "ux": ["figma", "user research", "wireframing", "prototyping", "usability testing", "information architecture", "persona creation"],
    "designer": ["figma", "ui design", "visual design", "design systems", "adobe creative suite", "prototyping", "branding"]
}

class ATSScorer:
    @staticmethod
    def evaluate_role_relevancy(parsed_data: Dict[str, Any], target_role: str) -> Dict[str, Any]:
        """Calculates specific ATS alignment against the targeted job role."""
        text_lower = parsed_data["full_text"].lower()
        detected_skills = [s.lower() for s in parsed_data["skills"]["all_skills"]]
        role_lower = target_role.lower()

        # Find best matching benchmark skills for target role
        benchmark_skills = []
        for role_key, skills in ROLE_SKILL_BENCHMARKS.items():
            if role_key in role_lower:
                benchmark_skills = skills
                break

        if not benchmark_skills:
            # Fallback: extract words from target_role and use them as benchmark requirements
            words = [w for w in re.findall(r'[a-zA-Z]{3,}', role_lower) if w not in ["senior", "lead", "staff", "principal", "junior", "engineer", "developer", "specialist"]]
            benchmark_skills = words if words else ["software", "programming", "system design", "git", "rest api"]

        # Check matched vs missing skills
        matched = []
        missing = []
        for req in benchmark_skills:
            if any(req in s or s in req for s in detected_skills) or re.search(r'\b' + re.escape(req) + r'\b', text_lower):
                matched.append(req.title())
            else:
                missing.append(req.title())

        req_count = max(len(benchmark_skills), 1)
        matched_count = len(matched)
        ratio = min(1.0, matched_count / max(req_count * 0.7, 1))

        score = round(ratio * 25.0, 1)

        checks = []
        if ratio >= 0.75:
            checks.append({
                "name": "Target Role Keyword Alignment",
                "status": "pass",
                "msg": f"High ATS keyword match for '{target_role}' ({matched_count}/{req_count} benchmark skills matched: {', '.join(matched[:5])})."
            })
        elif ratio >= 0.45:
            checks.append({
                "name": "Target Role Keyword Alignment",
                "status": "warning",
                "msg": f"Moderate match for '{target_role}'. Consider adding core keywords: {', '.join(missing[:4])}."
            })
        else:
            checks.append({
                "name": "Target Role Keyword Alignment",
                "status": "critical",
                "msg": f"Low keyword relevancy for '{target_role}'. Missing critical requirements: {', '.join(missing[:5])}."
            })

        return {
            "score": min(25.0, score),
            "max": 25,
            "target_role": target_role,
            "matched_skills": matched,
            "missing_skills": missing,
            "match_percentage": round(ratio * 100, 1),
            "checks": checks
        }

    @staticmethod
    def evaluate_contacts(contacts: Dict[str, Any]) -> Dict[str, Any]:
        score = 0
        checks = []

        if contacts.get("name") and contacts["name"] != "Candidate":
            score += 2
            checks.append({"name": "Full Name", "status": "pass", "msg": f"Candidate name detected: {contacts['name']}"})
        else:
            checks.append({"name": "Full Name", "status": "warning", "msg": "Could not clearly detect candidate name on top."})

        if contacts.get("email"):
            score += 4
            checks.append({"name": "Email Address", "status": "pass", "msg": f"Valid email detected: {contacts['email']}"})
        else:
            checks.append({"name": "Email Address", "status": "critical", "msg": "Missing or unparseable email address."})

        if contacts.get("phone"):
            score += 2
            checks.append({"name": "Phone Number", "status": "pass", "msg": f"Valid phone number found: {contacts['phone']}"})
        else:
            checks.append({"name": "Phone Number", "status": "warning", "msg": "No direct phone number detected."})

        has_link = bool(contacts.get("linkedin") or contacts.get("github") or contacts.get("portfolio"))
        if has_link:
            score += 2
            links = [k for k in ["linkedin", "github", "portfolio"] if contacts.get(k)]
            checks.append({"name": "Online Profile / Portfolio", "status": "pass", "msg": f"Found professional links: {', '.join(links)}"})
        else:
            checks.append({"name": "Online Profile / Portfolio", "status": "warning", "msg": "No LinkedIn, GitHub, or portfolio URL found."})

        return {"score": min(10, score), "max": 10, "checks": checks}

    @staticmethod
    def evaluate_sections(sections: Dict[str, str]) -> Dict[str, Any]:
        score = 0
        checks = []

        # Experience
        exp_len = len(sections.get("experience", "").strip())
        if exp_len > 150:
            score += 3
            checks.append({"name": "Work Experience Section", "status": "pass", "msg": "Well-structured work history section detected."})
        elif exp_len > 0:
            score += 2
            checks.append({"name": "Work Experience Section", "status": "warning", "msg": "Work experience section is sparse or very brief."})
        else:
            checks.append({"name": "Work Experience Section", "status": "critical", "msg": "Missing standard Work Experience section."})

        # Education
        edu_len = len(sections.get("education", "").strip())
        if edu_len > 30:
            score += 2
            checks.append({"name": "Education Section", "status": "pass", "msg": "Academic background clearly identified."})
        else:
            checks.append({"name": "Education Section", "status": "warning", "msg": "Missing clear Education / Degrees heading."})

        # Skills
        skills_len = len(sections.get("skills", "").strip())
        if skills_len > 30:
            score += 2
            checks.append({"name": "Skills Section", "status": "pass", "msg": "Dedicated Skills section found."})
        else:
            checks.append({"name": "Skills Section", "status": "warning", "msg": "Recommend a dedicated 'Skills' or 'Technologies' section."})

        # Summary
        summary_len = len(sections.get("summary", "").strip())
        if summary_len > 40:
            score += 2
            checks.append({"name": "Summary / Objective", "status": "pass", "msg": "Professional summary or objective statement present."})
        else:
            checks.append({"name": "Summary / Objective", "status": "warning", "msg": "Adding a 2-3 line professional summary improves recruiter engagement."})

        # Projects or Certifications
        proj_len = len(sections.get("projects", "").strip())
        cert_len = len(sections.get("certifications", "").strip())
        if proj_len > 50 or cert_len > 30:
            score += 1
            checks.append({"name": "Projects & Certifications", "status": "pass", "msg": "Projects or Certifications section provided."})
        else:
            checks.append({"name": "Projects & Certifications", "status": "warning", "msg": "Include key technical projects or verified certifications."})

        return {"score": min(10, score), "max": 10, "checks": checks}

    @staticmethod
    def evaluate_verbs_and_impact(text: str) -> Dict[str, Any]:
        text_lower = text.lower()
        score = 0
        checks = []

        found_strong = set()
        for verb in STRONG_ACTION_VERBS:
            if re.search(r'\b' + re.escape(verb) + r'\b', text_lower):
                found_strong.add(verb)

        found_weak = set()
        for weak in WEAK_VERBS:
            if re.search(r'\b' + re.escape(weak) + r'\b', text_lower):
                found_weak.add(weak)

        count_strong = len(found_strong)
        if count_strong >= 8:
            score = 20
            checks.append({"name": "Power Action Verbs", "status": "pass", "msg": f"Excellent use of high-impact action verbs ({count_strong} distinct verbs found)."})
        elif count_strong >= 4:
            score = 14
            checks.append({"name": "Power Action Verbs", "status": "pass", "msg": f"Good action verb variety ({count_strong} found: {', '.join(list(found_strong)[:5])})."})
        elif count_strong >= 1:
            score = 8
            checks.append({"name": "Power Action Verbs", "status": "warning", "msg": f"Only {count_strong} strong action verbs found. Replace duties with active verbs (e.g., 'Engineered', 'Optimized')."})
        else:
            score = 4
            checks.append({"name": "Power Action Verbs", "status": "critical", "msg": "Resume lacks strong action verbs. Bullet points read like job duties rather than achievements."})

        if found_weak:
            score = max(0, score - 2)
            checks.append({"name": "Passive Language", "status": "warning", "msg": f"Passive phrasing detected: {', '.join(found_weak)}. Replace with active results."})
        else:
            checks.append({"name": "Passive Language", "status": "pass", "msg": "Zero passive phrasing detected."})

        return {
            "score": min(20, score),
            "max": 20,
            "strong_verbs_count": count_strong,
            "strong_verbs": list(found_strong),
            "weak_verbs": list(found_weak),
            "checks": checks
        }

    @staticmethod
    def evaluate_metrics(text: str) -> Dict[str, Any]:
        score = 0
        checks = []
        found_metrics = []

        for pat in METRIC_PATTERNS:
            matches = re.findall(pat, text, re.IGNORECASE)
            for m in matches:
                if isinstance(m, str) and m not in found_metrics:
                    found_metrics.append(m.strip())

        count = len(found_metrics)
        if count >= 6:
            score = 20
            checks.append({"name": "Quantifiable Achievements", "status": "pass", "msg": f"Outstanding business impact metrics! Found {count} quantifiable measurements."})
        elif count >= 3:
            score = 14
            checks.append({"name": "Quantifiable Achievements", "status": "pass", "msg": f"Good quantification ({count} metrics found: {', '.join(found_metrics[:4])})."})
        elif count >= 1:
            score = 8
            checks.append({"name": "Quantifiable Achievements", "status": "warning", "msg": f"Only {count} metric found. Add specific figures: % improvements, $ saved, latency reduced, user scale."})
        else:
            score = 2
            checks.append({"name": "Quantifiable Achievements", "status": "critical", "msg": "No quantifiable results found. ATS algorithms and recruiters heavily favor measurable metrics."})

        return {
            "score": min(20, score),
            "max": 20,
            "metrics_count": count,
            "sample_metrics": found_metrics[:8],
            "checks": checks
        }

    @staticmethod
    def evaluate_skills_and_density(skills_data: Dict[str, Any], metadata: Dict[str, Any]) -> Dict[str, Any]:
        score = 0
        checks = []

        total_skills = skills_data.get("total_count", 0)
        categories = skills_data.get("categorized", {})
        num_categories = len(categories)

        if total_skills >= 10 and num_categories >= 3:
            score += 9
            checks.append({"name": "Technical Keyword Breadth", "status": "pass", "msg": f"Broad tech stack detected ({total_skills} skills across {num_categories} categories)."})
        elif total_skills >= 5:
            score += 6
            checks.append({"name": "Technical Keyword Breadth", "status": "warning", "msg": f"{total_skills} skills found. Add more specific frameworks, libraries, and tools."})
        else:
            score += 3
            checks.append({"name": "Technical Keyword Breadth", "status": "critical", "msg": "Very few technical keywords detected. ATS searches may overlook this resume."})

        # Check soft skills
        if "Soft Skills" in categories and len(categories["Soft Skills"]) >= 2:
            score += 3
            checks.append({"name": "Soft Skills Balance", "status": "pass", "msg": "Healthy balance of technical proficiencies and leadership/soft skills."})
        else:
            score += 1
            checks.append({"name": "Soft Skills Balance", "status": "warning", "msg": "Incorporate key collaboration keywords (e.g. Cross-functional, Mentorship, Communication)."})

        # Word count & density
        word_count = metadata.get("word_count", 0)
        page_count = metadata.get("page_count", 1)

        if 350 <= word_count <= 1200:
            score += 3
            checks.append({"name": "Resume Length & Density", "status": "pass", "msg": f"Ideal word count ({word_count} words on {page_count} page(s))."})
        else:
            score += 1
            checks.append({"name": "Resume Length & Density", "status": "warning", "msg": f"Resume density ({word_count} words). Aim for concise, impactful content."})

        return {"score": min(15, score), "max": 15, "checks": checks}

    @classmethod
    def score_resume(cls, parsed_data: Dict[str, Any], target_role: str = "Software Engineer") -> Dict[str, Any]:
        text = parsed_data["full_text"]
        contacts = parsed_data["contact_info"]
        sections = parsed_data["sections"]
        skills = parsed_data["skills"]
        metadata = parsed_data["metadata"]

        role_eval = cls.evaluate_role_relevancy(parsed_data, target_role)
        contact_eval = cls.evaluate_contacts(contacts)
        section_eval = cls.evaluate_sections(sections)
        verbs_eval = cls.evaluate_verbs_and_impact(text)
        metrics_eval = cls.evaluate_metrics(text)
        skills_eval = cls.evaluate_skills_and_density(skills, metadata)

        # Formatting compliance combines contacts & sections (max 20 pts)
        formatting_score = min(20, contact_eval["score"] + section_eval["score"])

        total_score = round(
            role_eval["score"] +          # max 25
            skills_eval["score"] +        # max 15
            verbs_eval["score"] +         # max 20
            metrics_eval["score"] +       # max 20
            formatting_score,             # max 20
            1
        )

        # Rating tier
        if total_score >= 85:
            tier = "Outstanding (Interview Ready)"
            color = "#10b981"  # Emerald
        elif total_score >= 70:
            tier = "Good (Competitive)"
            color = "#6366f1"  # Indigo
        elif total_score >= 50:
            tier = "Average (Needs Polish)"
            color = "#f59e0b"  # Amber
        else:
            tier = "Needs Significant Work"
            color = "#ef4444"  # Red

        # Aggregate checklist
        all_checks = (
            role_eval["checks"] +
            contact_eval["checks"] +
            section_eval["checks"] +
            verbs_eval["checks"] +
            metrics_eval["checks"] +
            skills_eval["checks"]
        )

        passed = [c for c in all_checks if c["status"] == "pass"]
        warnings = [c for c in all_checks if c["status"] == "warning"]
        critical = [c for c in all_checks if c["status"] == "critical"]

        # Extract sample bullet points for review
        bullet_reviews = cls.analyze_bullet_points(text)

        return {
            "overall_score": round(total_score),
            "max_score": 100,
            "tier": tier,
            "color": color,
            "target_role": target_role,
            "breakdown": {
                "role_alignment": {
                    "score": round(role_eval["score"]),
                    "max": 25,
                    "target_role": target_role,
                    "matched": role_eval["matched_skills"],
                    "missing": role_eval["missing_skills"]
                },
                "skills_and_density": {
                    "score": skills_eval["score"],
                    "max": 15
                },
                "action_verbs": {
                    "score": verbs_eval["score"],
                    "max": 20,
                    "strong_verbs_count": verbs_eval["strong_verbs_count"]
                },
                "metrics": {
                    "score": metrics_eval["score"],
                    "max": 20,
                    "metrics_count": metrics_eval["metrics_count"]
                },
                "formatting_compliance": {
                    "score": formatting_score,
                    "max": 20
                },
                # Retain legacy keys for backward-compatibility
                "contact_info": contact_eval,
                "sections": section_eval
            },
            "checklist": {
                "passed": passed,
                "warnings": warnings,
                "critical": critical,
                "total_passed": len(passed),
                "total_warnings": len(warnings),
                "total_critical": len(critical)
            },
            "bullet_reviews": bullet_reviews
        }

    @staticmethod
    def analyze_bullet_points(text: str) -> List[Dict[str, Any]]:
        """Extracts bullet points from text and provides STAR-framework assessments."""
        lines = text.splitlines()
        bullets = []

        for line in lines:
            line_str = line.strip()
            # Match standard bullet characters or lines starting with a verb-like structure
            if re.match(r'^[•\-\*■–]\s*', line_str) or (len(line_str) > 40 and line_str[0].isupper() and line_str.endswith('.')):
                clean_bullet = re.sub(r'^[•\-\*■–]\s*', '', line_str).strip()
                if len(clean_bullet) < 25:
                    continue

                words = clean_bullet.split()
                first_word = words[0].lower().rstrip(',')
                has_action_verb = first_word in STRONG_ACTION_VERBS
                has_metric = any(re.search(pat, clean_bullet, re.IGNORECASE) for pat in METRIC_PATTERNS)
                has_passive = any(w in clean_bullet.lower() for w in WEAK_VERBS)

                if has_action_verb and has_metric and not has_passive:
                    rating = "Strong"
                    feedback = "Great impact with active verb and quantified metric."
                elif has_action_verb and not has_metric:
                    rating = "Fair"
                    feedback = "Strong verb used, but missing a quantitative metric (%, $, numbers)."
                elif has_passive:
                    rating = "Needs Rewrite"
                    feedback = "Passive phrasing detected. Rewrite using STAR method starting with a power verb."
                else:
                    rating = "Needs Rewrite"
                    feedback = "Begin with a power action verb and state the business outcome."

                bullets.append({
                    "original": clean_bullet,
                    "first_word": first_word.capitalize(),
                    "has_verb": has_action_verb,
                    "has_metric": has_metric,
                    "rating": rating,
                    "feedback": feedback
                })

                if len(bullets) >= 6:  # Top 6 representative bullets
                    break

        return bullets

