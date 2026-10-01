import os
import json
import logging
from typing import Dict, List, Any, Optional
import httpx

logger = logging.getLogger("ai_service")

class AIService:
    @staticmethod
    def get_api_config():
        provider = os.getenv("LLM_PROVIDER", "gemini").lower()
        gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
        gemini_model = os.getenv("GEMINI_MODEL", "gemini-1.5-flash").strip()
        openai_key = os.getenv("OPENAI_API_KEY", "").strip()
        openai_model = os.getenv("OPENAI_MODEL", "gpt-4o-mini").strip()
        return {
            "provider": provider,
            "gemini_key": gemini_key,
            "gemini_model": gemini_model,
            "openai_key": openai_key,
            "openai_model": openai_model,
            "has_llm": bool(gemini_key or openai_key)
        }

    @classmethod
    async def call_gemini(cls, prompt: str, system_instruction: str = "", api_key: str = "", model: str = "gemini-1.5-flash") -> Optional[str]:
        if not api_key:
            return None
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        payload = {
            "contents": [
                {
                    "parts": [{"text": prompt}]
                }
            ],
            "generationConfig": {
                "temperature": 0.3,
                "maxOutputTokens": 2048
            }
        }
        if system_instruction:
            payload["systemInstruction"] = {
                "parts": [{"text": system_instruction}]
            }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(url, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts:
                            return parts[0].get("text", "")
                else:
                    logger.warning(f"Gemini API returned status {resp.status_code}: {resp.text}")
        except Exception as e:
            logger.error(f"Gemini API call failed: {e}")
        return None

    @classmethod
    async def transcribe_image(cls, image_bytes: bytes, mime_type: str = "image/png") -> Optional[str]:
        """Extracts complete text content from an image using Vision LLMs."""
        import base64
        b64_data = base64.b64encode(image_bytes).decode('utf-8')
        cfg = cls.get_api_config()
        
        # 1. Try Gemini Vision
        if cfg["gemini_key"]:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{cfg['gemini_model']}:generateContent?key={cfg['gemini_key']}"
                payload = {
                    "contents": [
                        {
                            "parts": [
                                {"text": "You are a high-precision OCR engine. Transcribe all text from this resume/document image exactly as written. Preserve all names, contacts, sections, dates, and bullet points. Output ONLY the raw extracted document text with clear line breaks."},
                                {
                                    "inlineData": {
                                        "mimeType": mime_type,
                                        "data": b64_data
                                    }
                                }
                            ]
                        }
                    ],
                    "generationConfig": {"temperature": 0.1, "maxOutputTokens": 4096}
                }
                async with httpx.AsyncClient(timeout=30.0) as client:
                    resp = await client.post(url, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            parts = candidates[0].get("content", {}).get("parts", [])
                            if parts:
                                return parts[0].get("text", "")
            except Exception as e:
                logger.warning(f"Gemini image transcription failed: {e}")

        # 2. Try OpenAI Vision
        if cfg["openai_key"]:
            try:
                url = "https://api.openai.com/v1/chat/completions"
                headers = {
                    "Authorization": f"Bearer {cfg['openai_key']}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "model": cfg["openai_model"],
                    "messages": [
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": "Extract and transcribe all text from this resume/document image. Preserve structure, headings, and bullet points verbatim."},
                                {"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{b64_data}"}}
                            ]
                        }
                    ],
                    "temperature": 0.1,
                    "max_tokens": 4096
                }
                async with httpx.AsyncClient(timeout=30.0) as client:
                    resp = await client.post(url, headers=headers, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        choices = data.get("choices", [])
                        if choices:
                            return choices[0].get("message", {}).get("content", "")
            except Exception as e:
                logger.warning(f"OpenAI vision transcription failed: {e}")

        return None

    @classmethod
    async def call_openai(cls, prompt: str, system_instruction: str = "", api_key: str = "", model: str = "gpt-4o-mini") -> Optional[str]:
        if not api_key:
            return None
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        messages = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": model,
            "messages": messages,
            "temperature": 0.3
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(url, headers=headers, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    choices = data.get("choices", [])
                    if choices:
                        return choices[0].get("message", {}).get("content", "")
                else:
                    logger.warning(f"OpenAI API returned status {resp.status_code}: {resp.text}")
        except Exception as e:
            logger.error(f"OpenAI API call failed: {e}")
        return None

    @classmethod
    async def generate_completion(cls, prompt: str, system_instruction: str = "") -> Optional[str]:
        cfg = cls.get_api_config()
        if cfg["provider"] == "gemini" and cfg["gemini_key"]:
            res = await cls.call_gemini(prompt, system_instruction, cfg["gemini_key"], cfg["gemini_model"])
            if res:
                return res
        if cfg["openai_key"]:
            res = await cls.call_openai(prompt, system_instruction, cfg["openai_key"], cfg["openai_model"])
            if res:
                return res
        if cfg["gemini_key"]:
            res = await cls.call_gemini(prompt, system_instruction, cfg["gemini_key"], cfg["gemini_model"])
            if res:
                return res
        return None

    @classmethod
    async def analyze_resume_critique(cls, candidate_name: str, target_role: str, full_text: str, detected_skills: List[str], ats_score: float) -> Dict[str, Any]:
        """Generates executive critique, strengths, weaknesses, and STAR bullet rewrites."""
        prompt = f"""
Candidate: {candidate_name}
Target Role: {target_role}
Current ATS Score: {ats_score}/100
Detected Skills: {', '.join(detected_skills[:20])}

Resume Text:
\"\"\"{full_text[:3500]}\"\"\"

Provide an in-depth executive analysis in valid JSON format only (no markdown quotes outside json):
{{
  "executive_summary": "2-3 sentences analyzing how well this candidate is positioned for the target role",
  "key_strengths": ["strength 1", "strength 2", "strength 3"],
  "critical_improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "bullet_rewrites": [
    {{
      "original": "original bullet point found in resume",
      "rewritten": "STAR format bullet starting with powerful action verb and quantified outcome",
      "rationale": "why this rewrite makes an impact"
    }}
  ],
  "interview_readiness": "High / Medium / Needs Work with 1 sentence rationale",
  "salary_insight": "Estimated market tier for this profile and target role"
}}
"""
        system = "You are a Principal Technical Recruiter and Career Strategist at a tier-1 tech company. Return valid JSON only."
        raw_response = await cls.generate_completion(prompt, system)

        if raw_response:
            try:
                # Strip markdown code fences if present
                clean_json = raw_response.strip()
                if clean_json.startswith("```json"):
                    clean_json = clean_json[7:]
                elif clean_json.startswith("```"):
                    clean_json = clean_json[3:]
                if clean_json.endswith("```"):
                    clean_json = clean_json[:-3]
                parsed = json.loads(clean_json.strip())
                return parsed
            except Exception as e:
                logger.warning(f"Failed to parse LLM JSON: {e}")

        # High-Fidelity Smart Fallback Engine
        return cls._smart_fallback_critique(candidate_name, target_role, detected_skills, ats_score)

    @staticmethod
    def _smart_fallback_critique(candidate_name: str, target_role: str, skills: List[str], ats_score: float) -> Dict[str, Any]:
        top_skills = skills[:5] if skills else ["Software Engineering", "Problem Solving"]
        skills_str = ", ".join(top_skills)

        return {
            "executive_summary": f"{candidate_name} exhibits a solid technical foundation in {skills_str}, positioning them well for modern {target_role} opportunities. By elevating the quantifiable metrics and framing achievements with the STAR methodology, this profile will stand out in competitive candidate pools.",
            "key_strengths": [
                f"Demonstrated command of core technologies including {skills_str}.",
                "Clear technical trajectory with well-defined project and professional competencies.",
                "High parsing compatibility with modern applicant tracking systems."
            ],
            "critical_improvements": [
                "Incorporate more quantifiable business outcomes (e.g. % performance increase, latency reductions, user scale).",
                "Replace passive duty descriptions with high-impact action verbs (e.g., 'Architected', 'Orchestrated', 'Optimized').",
                f"Highlight modern {target_role} production practices like CI/CD, automated testing, and cloud observability."
            ],
            "bullet_rewrites": [
                {
                    "original": "Responsible for developing backend APIs and fixing system bugs.",
                    "rewritten": "Architected 12+ RESTful microservices with automated unit testing, reducing API latency by 35% and elevating system uptime to 99.95%.",
                    "rationale": "Replaces passive duty phrasing with an authoritative action verb ('Architected') and concrete metrics (35% latency drop, 99.95% uptime)."
                },
                {
                    "original": "Worked with team to implement frontend features and UI components.",
                    "rewritten": "Engineered responsive, accessible component library adopted across 4 core product modules, accelerating sprint delivery velocity by 25%.",
                    "rationale": "Demonstrates cross-functional leverage and concrete speed improvements for the engineering organization."
                },
                {
                    "original": "Handled database queries and optimized performance.",
                    "rewritten": "Restructured indexed MySQL/PostgreSQL queries and implemented caching layers, slashing peak database query execution times by 48%.",
                    "rationale": "Specifies concrete tools and provides a compelling quantifiable benchmark."
                }
            ],
            "interview_readiness": "Medium-High: Candidate has the technical acumen; focusing on system design and business impact narratives will unlock top-tier offers.",
            "salary_insight": f"Targeting {target_role}: Estimated competitive range is $95,000 - $145,000+ depending on market tier and demonstrable system scale."
        }

    @classmethod
    async def generate_career_roadmap(cls, target_role: str, current_skills: List[str]) -> Dict[str, Any]:
        """Generates a structured career progression roadmap with milestones."""
        prompt = f"""
Target Role: {target_role}
Current Candidate Skills: {', '.join(current_skills)}

Create a detailed, actionable career acceleration roadmap formatted in valid JSON only:
{{
  "target_role": "{target_role}",
  "current_level_assessment": "Entry / Mid / Senior",
  "estimated_timeframe": "6 to 12 Months",
  "milestones": [
    {{
      "phase": "Phase 1: Deepening Core Architecture (Months 1-3)",
      "goal": "Master high-demand technical fundamentals and fill primary gaps",
      "key_skills_to_learn": ["Skill A", "Skill B", "Skill C"],
      "actionable_projects": ["Build high-scale system X", "Implement CI/CD pipeline for Y"],
      "recommended_certifications": ["Certification Name or Free Resource"]
    }},
    {{
      "phase": "Phase 2: Scalability & Production Readiness (Months 4-6)",
      "goal": "Build production-grade distributed systems and real-world architectures",
      "key_skills_to_learn": ["Skill D", "Skill E"],
      "actionable_projects": ["Microservice architecture with event streaming"],
      "recommended_certifications": ["Certification Name"]
    }},
    {{
      "phase": "Phase 3: Leadership, System Design & Interview Mastery (Months 7+)",
      "goal": "Prepare for technical leadership, high-level system design, and behavioral interviews",
      "key_skills_to_learn": ["System Design", "Engineering Mentorship"],
      "actionable_projects": ["End-to-end full-scale portfolio deployment with monitoring"],
      "recommended_certifications": ["Top Tier Certificate"]
    }}
  ],
  "top_certifications": [
    {{"name": "AWS Certified Solutions Architect", "issuer": "Amazon Web Services", "difficulty": "Intermediate"}},
    {{"name": "Certified Kubernetes Administrator (CKA)", "issuer": "CNCF", "difficulty": "Advanced"}}
  ],
  "recommended_reading": ["Designing Data-Intensive Applications", "Clean Architecture"]
}}
"""
        system = "You are a Chief Technology Officer and Engineering Mentor. Return valid JSON only."
        raw_response = await cls.generate_completion(prompt, system)

        if raw_response:
            try:
                clean_json = raw_response.strip()
                if clean_json.startswith("```json"):
                    clean_json = clean_json[7:]
                elif clean_json.startswith("```"):
                    clean_json = clean_json[3:]
                if clean_json.endswith("```"):
                    clean_json = clean_json[:-3]
                return json.loads(clean_json.strip())
            except Exception as e:
                logger.warning(f"Failed to parse Roadmap JSON: {e}")

        # Smart Fallback Roadmap
        return cls._smart_fallback_roadmap(target_role, current_skills)

    @staticmethod
    def _smart_fallback_roadmap(target_role: str, skills: List[str]) -> Dict[str, Any]:
        return {
            "target_role": target_role,
            "current_level_assessment": "Mid-Level Professional",
            "estimated_timeframe": "6 to 9 Months",
            "milestones": [
                {
                    "phase": "Phase 1: Modern Tech Stack Mastery (Months 1-3)",
                    "goal": f"Solidify core competencies and close gaps required for a Senior {target_role}.",
                    "key_skills_to_learn": ["Advanced Async Programming", "Cloud Infrastructure (Docker/K8s)", "System Performance Tuning"],
                    "actionable_projects": [
                        "Build an end-to-end event-driven service with Redis caching and rate-limiting",
                        "Implement automated CI/CD pipeline using GitHub Actions with >85% test coverage"
                    ],
                    "recommended_certifications": ["AWS Certified Cloud Practitioner or Solutions Architect - Associate"]
                },
                {
                    "phase": "Phase 2: Distributed Architecture & Scale (Months 4-6)",
                    "goal": "Tackle large-scale data flow, microservices design, and observability.",
                    "key_skills_to_learn": ["Distributed Systems Design", "Kafka / Message Queues", "Prometheus & Grafana Monitoring"],
                    "actionable_projects": [
                        "Architect a high-throughput transaction processing API supporting 5,000+ requests/second",
                        "Deploy containerized microservices to Kubernetes with automated health checks"
                    ],
                    "recommended_certifications": ["Docker Certified Associate (DCA) or Terraform Associate"]
                },
                {
                    "phase": "Phase 3: Strategic Impact & Interview Mastery (Months 7-9)",
                    "goal": "Position as a technical lead through architectural decisions and interview excellence.",
                    "key_skills_to_learn": ["System Design Architecture", "Engineering Mentorship", "Cross-functional Leadership"],
                    "actionable_projects": [
                        "Complete comprehensive System Design simulations (URL shortener, Collaborative Docs, E-commerce Checkout)",
                        "Publish an open-source tool or technical deep-dive article"
                    ],
                    "recommended_certifications": ["Certified Kubernetes Administrator (CKA)"]
                }
            ],
            "top_certifications": [
                {"name": "AWS Certified Solutions Architect - Associate", "issuer": "AWS", "difficulty": "Intermediate"},
                {"name": "Certified Kubernetes Application Developer (CKAD)", "issuer": "Linux Foundation", "difficulty": "Intermediate-Advanced"},
                {"name": "HashiCorp Certified: Terraform Associate", "issuer": "HashiCorp", "difficulty": "Intermediate"}
            ],
            "recommended_reading": [
                "Designing Data-Intensive Applications by Martin Kleppmann",
                "System Design Interview by Alex Xu",
                "Clean Architecture by Robert C. Martin"
            ]
        }

    @classmethod
    async def match_job_description(cls, resume_skills: List[str], resume_text: str, job_title: str, job_description: str) -> Dict[str, Any]:
        """Compares resume against target job description or pre-set roles."""
        prompt = f"""
Job Title: {job_title}
Job Description:
\"\"\"{job_description[:3000]}\"\"\"

Candidate Skills: {', '.join(resume_skills)}
Candidate Resume:
\"\"\"{resume_text[:3000]}\"\"\"

Analyze the candidate's fit for this specific job in valid JSON format:
{{
  "match_percentage": 78.5,
  "matched_skills": ["Skill A", "Skill B"],
  "missing_skills": ["Skill C", "Skill D"],
  "fit_verdict": "Strong Fit / Moderate Fit / Growth Fit",
  "tailored_advice": ["Actionable tip 1", "Actionable tip 2"],
  "custom_cover_letter_snippet": "A compelling 3-sentence opening hook tailored for this company and role",
  "mock_interview_questions": [
    {{
      "type": "Technical",
      "question": "Realistic technical interview question based on job requirements",
      "model_answer_tip": "Key points candidate should emphasize"
    }},
    {{
      "type": "Behavioral",
      "question": "Scenario-based question assessing collaboration or problem-solving",
      "model_answer_tip": "STAR framework guidance"
    }}
  ]
}}
"""
        system = "You are an automated ATS Job Matching Engine. Return valid JSON only."
        raw_response = await cls.generate_completion(prompt, system)

        if raw_response:
            try:
                clean_json = raw_response.strip()
                if clean_json.startswith("```json"):
                    clean_json = clean_json[7:]
                elif clean_json.startswith("```"):
                    clean_json = clean_json[3:]
                if clean_json.endswith("```"):
                    clean_json = clean_json[:-3]
                return json.loads(clean_json.strip())
            except Exception as e:
                logger.warning(f"Failed to parse Job Match JSON: {e}")

        # Smart Heuristic Job Matching
        return cls._smart_job_match(resume_skills, job_title, job_description)

    @staticmethod
    def _smart_job_match(resume_skills: List[str], job_title: str, job_desc: str) -> Dict[str, Any]:
        desc_lower = job_desc.lower()
        matched = []
        for s in resume_skills:
            if s.lower() in desc_lower:
                matched.append(s)

        # Common requirements for popular roles
        role_benchmarks = {
            "full stack": ["react", "node.js", "typescript", "sql", "docker", "rest api", "git", "aws"],
            "frontend": ["react", "javascript", "typescript", "html", "css", "redux", "jest", "tailwind"],
            "backend": ["python", "fastapi", "django", "sql", "postgresql", "docker", "redis", "microservices"],
            "ai/ml": ["python", "pytorch", "tensorflow", "scikit-learn", "pandas", "numpy", "nlp", "llm"],
            "devops": ["aws", "docker", "kubernetes", "ci/cd", "terraform", "linux", "jenkins", "git"],
            "data engineer": ["python", "sql", "spark", "kafka", "snowflake", "airflow", "aws", "etl"],
        }

        # Check matched benchmark
        benchmark_skills = ["git", "rest api", "sql", "docker", "problem solving", "ci/cd", "cloud"]
        for role_key, skills in role_benchmarks.items():
            if role_key in job_title.lower() or role_key in desc_lower:
                benchmark_skills = skills
                break

        missing = []
        resume_skills_lower = [s.lower() for s in resume_skills]
        for b in benchmark_skills:
            if b not in resume_skills_lower and (b in desc_lower or len(matched) < 4):
                missing.append(b.capitalize())

        total_eval = max(len(matched) + len(missing), 1)
        match_pct = round(min(96.0, max(42.0, (len(matched) / total_eval) * 100)), 1)

        verdict = "Strong Fit" if match_pct >= 75 else ("Moderate Fit" if match_pct >= 55 else "Growth Opportunity")

        return {
            "match_percentage": match_pct,
            "matched_skills": matched if matched else resume_skills[:6],
            "missing_skills": missing[:6],
            "fit_verdict": verdict,
            "tailored_advice": [
                f"Highlight production experience with {', '.join(missing[:3]) if missing else 'cloud deployment'} in your summary.",
                "Align your project bullet points with the exact terminology utilized in the job description.",
                "Emphasize metrics demonstrating system reliability and team collaboration."
            ],
            "custom_cover_letter_snippet": f"With proven experience across {', '.join(matched[:3]) if matched else 'modern software engineering'}, I am eager to bring my problem-solving acumen to the {job_title} role, driving high-impact technical initiatives and reliable system delivery.",
            "mock_interview_questions": [
                {
                    "type": "Technical Architecture",
                    "question": f"How would you design a scalable service for {job_title} ensuring high availability and fault tolerance?",
                    "model_answer_tip": "Discuss separation of concerns, horizontal scaling, database indexing/sharding, and distributed caching."
                },
                {
                    "type": "Behavioral Leadership",
                    "question": "Tell me about a time you resolved an unexpected production incident under tight deadline constraints.",
                    "model_answer_tip": "Use STAR: Detail the monitoring alert, root cause triage, mitigation steps, and retrospective improvements implemented."
                }
            ]
        }

    @classmethod
    async def chat_counselor(cls, user_message: str, candidate_context: Dict[str, Any], history: List[Dict[str, str]]) -> str:
        """Context-aware Career Counselor chatbot."""
        name = candidate_context.get("name", "Candidate")
        role = candidate_context.get("target_role", "Software Engineer")
        skills_list = candidate_context.get("skills", [])[:15]
        skills = ", ".join(skills_list)
        ats_score = candidate_context.get("ats_score", 75)

        system_instruction = f"""
You are "Aura", an elite AI Career Counselor and Executive Tech Coach.
Candidate Info:
- Name: {name}
- Target Role: {role}
- Current Skills: {skills}
- ATS Resume Score: {ats_score}/100

Personality:
- Highly encouraging, deeply knowledgeable, strategic, and practical.
- Provide concrete, actionable advice (bullet points, clear steps, salary negotiating scripts, or interview responses).
- Keep responses engaging, structured, and easy to read.
"""
        # Format history
        history_prompt = ""
        for h in history[-6:]:  # last 6 messages
            history_prompt += f"{h.get('sender', 'user').capitalize()}: {h.get('message', '')}\n"
        history_prompt += f"User: {user_message}\nAssistant:"

        raw_response = await cls.generate_completion(history_prompt, system_instruction)
        if raw_response:
            return raw_response.strip()

        # ── Smart fallback counselor (no LLM available) ────────────────────
        msg_lower = user_message.lower().strip()
        top_skills = ", ".join(skills_list[:5]) if skills_list else "your current skill set"

        # Resume improvement
        if any(kw in msg_lower for kw in ["improve resume", "resume better", "resume stand out", "improve my resume", "resume tips", "fix resume", "update resume", "enhance resume", "strengthen resume"]):
            score_advice = ""
            if ats_score < 60:
                score_advice = f"Your ATS score is {ats_score}/100 — there's significant room for improvement."
            elif ats_score < 80:
                score_advice = f"Your ATS score is {ats_score}/100 — solid, but we can push it higher."
            else:
                score_advice = f"Your ATS score is {ats_score}/100 — already strong! Let's fine-tune it."

            return f"""Great question, {name}! {score_advice} Here's a focused action plan to improve your resume for {role}:

**1. Quantify Every Bullet Point**
→ Replace vague statements like "Improved performance" with "Reduced API latency by 40% serving 2M+ daily requests"

**2. Mirror Job Description Keywords**
→ Align your skills section with {role} job postings. Prioritize: {top_skills}

**3. Use the STAR Format**
→ Structure bullets as: Situation → Task → Action → Result (with metrics)

**4. Optimize Your Summary**
→ Lead with a compelling 2-line professional summary that highlights years of experience + key impact areas

**5. Remove Outdated Content**
→ Drop skills/roles older than 10 years unless directly relevant to {role}

Would you like me to help rewrite specific bullet points, or focus on a particular section?"""

        # Skills / learning / what to learn
        if any(kw in msg_lower for kw in ["skill", "learn", "what should i study", "upskill", "gap", "missing skill", "technology", "tech stack", "what to learn"]):
            return f"""Here's a strategic skills roadmap for {name} targeting {role}:

**Your Current Strengths:** {top_skills}

**High-Priority Skills to Add:**
• Cloud & Infrastructure: AWS/GCP/Azure certifications, Terraform, Kubernetes
• System Design: Distributed systems, microservices patterns, event-driven architecture
• Data & AI: Data pipelines, ML model deployment, LLM integration
• Soft Skills: Technical leadership, stakeholder communication, mentoring

**Recommended Learning Path (Next 90 Days):**
1. **Weeks 1-4:** Pick one cloud platform, complete a certification path
2. **Weeks 5-8:** Build a production-grade project showcasing 2-3 new skills
3. **Weeks 9-12:** Contribute to open source + write 2 technical blog posts

**Free Resources:**
• Coursera, Udemy, freeCodeCamp for structured courses
• LeetCode + NeetCode for algorithm practice
• System Design Primer (GitHub) for architecture prep

Which specific skill area would you like to dive deeper into?"""

        # Interview prep
        if any(kw in msg_lower for kw in ["interview", "prepare", "mock", "behavioral", "technical question", "interview tips", "interview prep"]):
            return f"""Excellent, {name}! Here's a comprehensive interview prep strategy for {role}:

**Technical Interview Prep:**
• Practice 2-3 LeetCode medium problems daily (focus on arrays, trees, graphs, dynamic programming)
• Study system design: Load balancers, caching strategies, database sharding, message queues
• Review your own projects — be ready to explain architecture decisions and trade-offs

**Behavioral Interview (STAR Method):**
Prepare stories for these common themes:
1. "Tell me about a time you resolved a conflict in your team"
2. "Describe a project that failed and what you learned"
3. "How do you handle tight deadlines with competing priorities?"
4. "Give an example of when you mentored someone"

**Interview Day Tips:**
• Ask clarifying questions before jumping into solutions
• Think out loud — interviewers evaluate your process, not just the answer
• Prepare 3-5 thoughtful questions for the interviewer about team culture and growth

Would you like to do a quick mock interview question right now?"""

        # Salary negotiation
        if any(kw in msg_lower for kw in ["salary", "negotiat", "compensation", "pay", "offer", "raise", "how much"]):
            return f"""Smart move thinking about compensation, {name}! Here's a salary negotiation framework for {role}:

**Before Negotiating:**
• Research market rates on Levels.fyi, Glassdoor, and Blind
• Know your target range: base + bonus + equity + benefits
• Never share your current salary — focus on market value

**Negotiation Script:**
"Thank you for the offer! I'm very excited about this opportunity. Based on my experience with {top_skills} and current market benchmarks for {role} at this level, I was targeting a total compensation in the $X–$Y range. Is there flexibility to align closer to that?"

**Key Tactics:**
1. Always negotiate — 85% of employers expect it
2. Get the offer in writing before negotiating
3. Negotiate base salary first, then bonus, equity, and sign-on
4. Have a competing offer if possible (even verbal)
5. Be enthusiastic but firm — never ultimatum

**Counter-Offer Template:**
"I appreciate the offer of $X. Given my [specific achievement] and the value I'd bring to [specific team goal], would $Y be possible?"

Need help evaluating a specific offer or preparing a counter?"""

        # Projects / portfolio
        if any(kw in msg_lower for kw in ["project", "portfolio", "build", "side project", "github", "what to build", "showcase"]):
            return f"""Great thinking, {name}! Portfolio projects are the #1 way to stand out for {role}. Here are high-impact project ideas:

**Tier 1 — Resume-Worthy Projects:**
• **Real-Time Analytics Dashboard** — WebSocket + streaming data + charts
• **Microservices E-Commerce Platform** — Auth, payments, inventory, with Docker & CI/CD
• **AI-Powered Tool** — Build something using LLM APIs (chatbot, document analyzer, etc.)

**Tier 2 — Differentiators:**
• **Open Source Contribution** — Find active repos in your tech stack, fix issues, submit PRs
• **Technical Blog** — Write 3-5 deep-dive articles on {top_skills}
• **System Design Case Study** — Document how you'd architect a system at scale

**What Makes Projects Stand Out:**
✅ Live demo link (deploy on Vercel/Railway/AWS)
✅ Clean README with architecture diagram
✅ Automated tests (unit + integration)
✅ CI/CD pipeline
✅ Performance benchmarks

Which type of project interests you most?"""

        # Cover letter
        if any(kw in msg_lower for kw in ["cover letter", "application letter", "writing cover", "cover"]):
            return f"""Here's a winning cover letter framework for {name} applying to {role} positions:

**Structure (Keep it under 300 words):**

**Paragraph 1 — Hook:**
"As a [your title] with [X years] of experience in {top_skills}, I was excited to see your opening for {role} at [Company]."

**Paragraph 2 — Value Proposition:**
Highlight 2-3 specific achievements that match the job requirements. Use metrics!
"At [Previous Company], I [specific achievement with numbers], directly impacting [business outcome]."

**Paragraph 3 — Why This Company:**
Show you've researched them. Reference their product, mission, recent news, or tech stack.

**Paragraph 4 — Close:**
"I'd welcome the opportunity to discuss how my experience with {top_skills} can contribute to [specific team goal]. Thank you for your time."

**Pro Tips:**
• Customize EVERY cover letter — generic ones get rejected instantly
• Mirror keywords from the job description
• Keep the tone confident but not arrogant

Would you like me to help draft a cover letter for a specific position?"""

        # LinkedIn
        if any(kw in msg_lower for kw in ["linkedin", "profile", "networking", "network", "connect"]):
            return f"""Let's optimize your LinkedIn presence, {name}! Here's how to make recruiters come to YOU:

**Profile Optimization:**
• **Headline:** Don't just put your title. Use: "{role} | {top_skills} | Building [what you're passionate about]"
• **About Section:** Tell your career story in 3 paragraphs — past → present → future
• **Featured Section:** Pin your best projects, articles, or presentations
• **Skills:** List all relevant skills — aim for 30+ with endorsements

**Networking Strategy:**
1. Connect with 5-10 people at target companies weekly
2. Comment thoughtfully on 3 posts per day in your field
3. Post 1-2x per week: project updates, lessons learned, industry insights
4. Join relevant groups and participate in discussions

**Recruiter Magnet Settings:**
• Turn on "Open to Work" (visible to recruiters only)
• Set your job preferences accurately
• Use keywords from {role} job descriptions throughout your profile

Would you like help crafting your LinkedIn headline or summary?"""

        # Certifications
        if any(kw in msg_lower for kw in ["certif", "course", "training", "credential", "aws cert", "google cert"]):
            return f"""Here are the most impactful certifications for {name} targeting {role}:

**High-ROI Certifications:**
1. **AWS Solutions Architect Associate** — Industry gold standard (~$150, 1-2 months prep)
2. **Google Cloud Professional** — Growing demand, great for GCP shops
3. **Kubernetes (CKA/CKAD)** — Essential for modern infrastructure roles
4. **Terraform Associate** — Infrastructure as Code is a must-have
5. **Meta/Google Professional Certificates** — Good for career changers

**Tips for Certification Strategy:**
• Pick certs that align with target company tech stacks
• One quality cert > three random ones
• Always add them to LinkedIn immediately after passing
• Mention them in your resume summary

**Study Resources:**
• A Cloud Guru, Stephane Maarek (Udemy), Adrian Cantrill for cloud
• KodeKloud for Kubernetes
• Official docs + practice exams are essential

Which certification path interests you most?"""

        # ATS / applicant tracking
        if any(kw in msg_lower for kw in ["ats", "tracking", "keyword", "format", "parsed", "screening"]):
            return f"""Let's decode ATS optimization for you, {name}! Your current score is {ats_score}/100.

**How ATS Systems Work:**
• They scan for keyword matches between your resume and the job description
• They parse sections: Contact Info → Summary → Experience → Education → Skills
• Complex formatting (tables, columns, graphics) can break parsing

**ATS Optimization Checklist:**
✅ Use a clean, single-column format
✅ Standard section headings (Experience, Education, Skills — not creative alternatives)
✅ Include both spelled-out terms AND acronyms (e.g., "Machine Learning (ML)")
✅ Tailor keywords for EACH application
✅ Use .pdf or .docx format (avoid .png, .jpg)
✅ Include 15-25 relevant skills in your skills section

**Quick Wins to Boost Your Score:**
1. Add more quantifiable metrics to your bullet points
2. Include action verbs: "Architected," "Spearheaded," "Optimized," "Delivered"
3. Match your skills section to the job posting's requirements

Want me to analyze specific areas of your resume for ATS improvements?"""

        # Career change
        if any(kw in msg_lower for kw in ["career change", "switch career", "transition", "pivot", "change field", "different role"]):
            return f"""Career transitions are absolutely possible, {name}! Here's a strategic approach:

**Transition Framework:**
1. **Identify Transferable Skills:** Your experience with {top_skills} is valuable across many roles
2. **Bridge the Gap:** Take 1-2 targeted courses or build projects in the new field
3. **Rebrand Your Resume:** Reframe your experience using the new field's language
4. **Network Strategically:** Connect with people who've made similar transitions

**Your Advantages:**
• Technical problem-solving skills transfer everywhere
• Industry knowledge is often undervalued — it's a differentiator
• Your unique background gives you a fresh perspective

**Action Plan:**
• Week 1-2: Research target roles, identify skill gaps
• Week 3-6: Upskill through courses/projects
• Week 7-8: Update resume + LinkedIn for the new target
• Week 9+: Start applying + networking in the new space

Would you like to explore specific transition paths from your current experience?"""

        # Greeting or general
        if any(kw in msg_lower for kw in ["hello", "hi", "hey", "good morning", "good evening", "howdy", "what's up", "sup"]):
            return f"""Hello {name}! 👋 Great to connect with you!

I'm Aura, your AI Career Counselor. I've analyzed your resume for **{role}** and here's what I can help you with:

📝 **Resume Improvement** — Optimize your bullets, keywords, and formatting
🎯 **Interview Prep** — Mock interviews, behavioral questions, and technical prep
💰 **Salary Negotiation** — Scripts, market data strategies, and counter-offer tactics
🚀 **Career Roadmap** — Skills to learn, certifications to pursue, projects to build
🔗 **LinkedIn & Networking** — Profile optimization and networking strategy
📄 **Cover Letters** — Templates and customization tips

Your current ATS score is **{ats_score}/100**. What would you like to work on first?"""

        # Thank you
        if any(kw in msg_lower for kw in ["thank", "thanks", "appreciate", "helpful", "great advice"]):
            return f"""You're welcome, {name}! I'm glad I could help. 😊

Remember, career growth is a marathon, not a sprint. You're already on the right track by being proactive!

Here are some other things I can help you with:
• Deep-dive into any specific resume section
• Mock interview practice
• Job search strategy and application tips
• Evaluating job offers and negotiating

Feel free to ask anything else — I'm here to help you land that {role} position! 🚀"""

        # Catch-all with contextual response
        return f"""That's a great topic, {name}! Here's my perspective for someone targeting {role}:

Based on your profile (ATS Score: {ats_score}/100, Key Skills: {top_skills}), here are some strategic areas to focus on:

**Immediate Actions:**
1. Tailor your resume keywords to match {role} job descriptions
2. Quantify your achievements with metrics and impact numbers
3. Build or update your portfolio with relevant projects

**Medium-Term Goals:**
4. Earn a relevant certification (AWS, Google Cloud, or domain-specific)
5. Grow your professional network through LinkedIn and industry events
6. Practice system design and behavioral interview questions

**I can help you dive deeper into:**
• 📝 Resume optimization and bullet rewriting
• 🎯 Interview preparation (technical + behavioral)
• 💰 Salary negotiation strategies
• 🚀 Career roadmap and skill development
• 🔗 LinkedIn profile optimization

What specific area would you like to explore further?"""

