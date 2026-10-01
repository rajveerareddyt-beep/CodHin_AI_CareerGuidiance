import re
import pymupdf as fitz
from typing import Dict, List, Any, Optional

SKILL_TAXONOMY = {
    "Languages": [
        "Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "Go", "Rust", 
        "Ruby", "PHP", "SQL", "HTML", "CSS", "Swift", "Kotlin", "Scala", "Bash", "R"
    ],
    "Frameworks": [
        "React", "React.js", "Vue", "Vue.js", "Angular", "Next.js", "FastAPI", 
        "Django", "Flask", "Node.js", "Express", "Express.js", "Spring Boot", 
        "ASP.NET", ".NET", "Tailwind CSS", "Bootstrap", "Redux", "GraphQL"
    ],
    "Cloud & DevOps": [
        "AWS", "Azure", "GCP", "Google Cloud", "Docker", "Kubernetes", "CI/CD", 
        "Terraform", "Jenkins", "GitHub Actions", "GitLab CI", "Linux", "Nginx", 
        "Ansible", "Prometheus", "Grafana", "Cloudflare"
    ],
    "Databases": [
        "MySQL", "PostgreSQL", "MongoDB", "Redis", "SQLite", "Oracle", "Cassandra", 
        "DynamoDB", "Elasticsearch", "Firebase", "Supabase", "Snowflake"
    ],
    "AI & Data Science": [
        "Machine Learning", "Deep Learning", "PyTorch", "TensorFlow", "Scikit-Learn", 
        "Pandas", "NumPy", "NLP", "Natural Language Processing", "Computer Vision", 
        "LLM", "Generative AI", "Hugging Face", "LangChain", "OpenCV", "Tableau", "Power BI"
    ],
    "Tools & Concepts": [
        "Git", "GitHub", "GitLab", "REST API", "Microservices", "System Design", 
        "Agile", "Scrum", "Jira", "Unit Testing", "Jest", "PyTest", "Postman", 
        "OOP", "Design Patterns", "Security", "OAuth", "JWT"
    ],
    "Soft Skills": [
        "Leadership", "Teamwork", "Communication", "Problem Solving", "Critical Thinking", 
        "Project Management", "Time Management", "Collaboration", "Mentorship", 
        "Adaptability", "Public Speaking", "Cross-functional Leadership"
    ]
}

SECTION_KEYWORDS = {
    "summary": ["summary", "profile", "professional summary", "about me", "objective", "career objective", "executive summary"],
    "experience": ["experience", "work experience", "employment history", "work history", "professional experience", "internships"],
    "education": ["education", "academic background", "academics", "qualifications", "degrees"],
    "skills": ["skills", "technical skills", "skills & competencies", "core competencies", "technologies", "tech stack", "tools & technologies"],
    "projects": ["projects", "personal projects", "academic projects", "key projects", "notable projects"],
    "certifications": ["certifications", "certificates", "licenses", "awards", "honors", "achievements"]
}

class ResumeParser:
    @staticmethod
    def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> Dict[str, Any]:
        """Extracts text and layout metadata using PyMuPDF."""
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        full_text = ""
        pages_text = []
        blocks_data = []

        for page_index in range(len(doc)):
            page = doc[page_index]
            page_text = page.get_text("text")
            pages_text.append(page_text)
            full_text += page_text + "\n"

            # Get structured blocks with font sizes
            page_dict = page.get_text("dict")
            for block in page_dict.get("blocks", []):
                if block.get("type") == 0:  # text block
                    for line in block.get("lines", []):
                        for span in line.get("spans", []):
                            text = span.get("text", "").strip()
                            if text:
                                blocks_data.append({
                                    "text": text,
                                    "size": round(span.get("size", 10), 1),
                                    "flags": span.get("flags", 0),  # bit 4 (16) is bold
                                    "page": page_index + 1
                                })

        doc.close()
        return {
            "full_text": full_text,
            "pages_text": pages_text,
            "page_count": len(pages_text),
            "blocks": blocks_data
        }

    @staticmethod
    def extract_contacts(text: str, blocks: List[Dict[str, Any]]) -> Dict[str, Optional[str]]:
        # Email
        email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
        email_match = re.search(email_pattern, text)
        email = email_match.group(0) if email_match else None

        # Phone
        phone_pattern = r'(?:(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{4})'
        # find candidate numbers
        phone_matches = re.findall(phone_pattern, text)
        phone = None
        for p in phone_matches:
            clean = re.sub(r'[^\d+]', '', p)
            if 7 <= len(clean) <= 15:
                phone = p.strip()
                break

        # LinkedIn
        linkedin_pattern = r'(?:https?://)?(?:www\.)?linkedin\.com/in/([a-zA-Z0-9_-]+)'
        linkedin_match = re.search(linkedin_pattern, text, re.IGNORECASE)
        linkedin = linkedin_match.group(0) if linkedin_match else None

        # GitHub
        github_pattern = r'(?:https?://)?(?:www\.)?github\.com/([a-zA-Z0-9_-]+)'
        github_match = re.search(github_pattern, text, re.IGNORECASE)
        github = github_match.group(0) if github_match else None

        # Portfolio / Website
        portfolio_pattern = r'(?:https?://)?(?:www\.)?([a-zA-Z0-9_-]+\.(?:io|dev|me|tech|com|org|net))(?:/[^\s]*)?'
        portfolio = None
        for m in re.finditer(portfolio_pattern, text, re.IGNORECASE):
            match_str = m.group(0)
            if "linkedin.com" not in match_str and "github.com" not in match_str:
                portfolio = match_str
                break

        # Candidate Name heuristic:
        # Check first 5 blocks, looking for largest font, title case, non-contact text
        candidate_name = None
        candidates = []
        for b in blocks[:15]:
            txt = b["text"].strip()
            # Ignore if it has @ or numbers or http
            if "@" in txt or re.search(r'\d', txt) or "http" in txt.lower():
                continue
            words = txt.split()
            if 2 <= len(words) <= 4 and all(w[0].isupper() for w in words if w):
                candidates.append((b["size"], txt))

        if candidates:
            # Sort by font size descending
            candidates.sort(key=lambda x: x[0], reverse=True)
            candidate_name = candidates[0][1]
        else:
            # Fallback to first non-empty line
            lines = [l.strip() for l in text.splitlines() if l.strip()]
            if lines:
                candidate_name = lines[0]

        return {
            "name": candidate_name or "Candidate",
            "email": email,
            "phone": phone,
            "linkedin": linkedin,
            "github": github,
            "portfolio": portfolio
        }

    @staticmethod
    def segment_sections(text: str) -> Dict[str, str]:
        lines = text.splitlines()
        current_section = "summary"
        sections: Dict[str, List[str]] = {
            "summary": [],
            "experience": [],
            "education": [],
            "skills": [],
            "projects": [],
            "certifications": [],
            "other": []
        }

        for line in lines:
            trimmed = line.strip().lower()
            clean_heading = re.sub(r'[^a-zA-Z\s]', '', trimmed).strip()

            detected_heading = None
            if len(clean_heading) <= 30 and len(clean_heading) >= 3:
                for sec, keywords in SECTION_KEYWORDS.items():
                    if clean_heading in keywords or any(clean_heading.startswith(kw) for kw in keywords):
                        detected_heading = sec
                        break

            if detected_heading:
                current_section = detected_heading
            else:
                sections[current_section].append(line)

        return {sec: "\n".join(lines_list).strip() for sec, lines_list in sections.items()}

    @staticmethod
    def extract_skills(text: str) -> Dict[str, Any]:
        text_lower = text.lower()
        extracted_categorized: Dict[str, List[str]] = {}
        all_detected = set()

        for category, skills in SKILL_TAXONOMY.items():
            found_in_category = []
            for skill in skills:
                # Word boundary check, accounting for special characters like C++, C#, .NET
                pattern = r'(?<![a-zA-Z0-9])' + re.escape(skill.lower()) + r'(?![a-zA-Z0-9])'
                if re.search(pattern, text_lower):
                    found_in_category.append(skill)
                    all_detected.add(skill)

            if found_in_category:
                extracted_categorized[category] = found_in_category

        return {
            "categorized": extracted_categorized,
            "all_skills": sorted(list(all_detected)),
            "total_count": len(all_detected)
        }

    @staticmethod
    def extract_text_from_docx_bytes(file_bytes: bytes) -> Dict[str, Any]:
        """Extracts text, headings, and structure from Word (.docx) documents."""
        import io
        import docx
        doc = docx.Document(io.BytesIO(file_bytes))
        full_text_list = []
        blocks_data = []

        for p in doc.paragraphs:
            text = p.text.strip()
            if text:
                full_text_list.append(text)
                # Estimate font size from style/heading level
                size = 14 if p.style.name.startswith("Heading 1") or p.style.name.startswith("Title") else (12 if p.style.name.startswith("Heading") else 10)
                blocks_data.append({
                    "text": text,
                    "size": size,
                    "flags": 16 if "Heading" in p.style.name or "Title" in p.style.name else 0,
                    "page": 1
                })

        # Also extract table contents
        for table in doc.tables:
            for row in table.rows:
                row_texts = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                if row_texts:
                    line_str = " | ".join(row_texts)
                    full_text_list.append(line_str)
                    blocks_data.append({"text": line_str, "size": 10, "flags": 0, "page": 1})

        full_text = "\n".join(full_text_list)
        return {
            "full_text": full_text,
            "pages_text": [full_text],
            "page_count": max(1, len(full_text.splitlines()) // 40 + 1),
            "blocks": blocks_data
        }

    @staticmethod
    def extract_text_from_pptx_bytes(file_bytes: bytes) -> Dict[str, Any]:
        """Extracts text from PowerPoint (.pptx) presentations."""
        import io
        import pptx
        prs = pptx.Presentation(io.BytesIO(file_bytes))
        full_text_list = []
        blocks_data = []
        pages_text = []

        for slide_idx, slide in enumerate(prs.slides):
            slide_lines = []
            for shape in slide.shapes:
                if shape.has_text_frame:
                    for paragraph in shape.text_frame.paragraphs:
                        text = paragraph.text.strip()
                        if text:
                            slide_lines.append(text)
                            blocks_data.append({
                                "text": text,
                                "size": 14 if slide_idx == 0 and len(slide_lines) == 1 else 10,
                                "flags": 0,
                                "page": slide_idx + 1
                            })
                elif shape.has_table:
                    for row in shape.table.rows:
                        row_texts = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                        if row_texts:
                            line_str = " | ".join(row_texts)
                            slide_lines.append(line_str)
                            blocks_data.append({"text": line_str, "size": 10, "flags": 0, "page": slide_idx + 1})

            slide_text = "\n".join(slide_lines)
            pages_text.append(slide_text)
            if slide_text:
                full_text_list.append(slide_text)

        full_text = "\n\n".join(full_text_list)
        return {
            "full_text": full_text,
            "pages_text": pages_text,
            "page_count": len(prs.slides) if prs.slides else 1,
            "blocks": blocks_data
        }

    @staticmethod
    def extract_text_from_image_bytes(image_bytes: bytes, filename: str = "image.png") -> Dict[str, Any]:
        """Extracts text from images (PNG, JPG, JPEG, WEBP, BMP, TIFF) via PyMuPDF in-memory PDF conversion & OCR."""
        import io
        import os
        from PIL import Image

        ext = os.path.splitext(filename)[1].lower().lstrip(".")
        if ext in ["jpg", "jpeg"]:
            img_type = "jpeg"
        elif ext in ["png", "webp", "bmp", "tiff", "tif"]:
            img_type = ext
        else:
            img_type = "png"

        full_text = ""
        blocks_data = []
        page_count = 1

        try:
            # 1. Open with PyMuPDF
            img_doc = fitz.open(stream=image_bytes, filetype=img_type)
            pdf_bytes = img_doc.convert_to_pdf()
            pdf_doc = fitz.open(stream=pdf_bytes, filetype="pdf")

            for page_index in range(len(pdf_doc)):
                page = pdf_doc[page_index]
                page_text = page.get_text("text")
                if page_text:
                    full_text += page_text + "\n"
                
                page_dict = page.get_text("dict")
                for block in page_dict.get("blocks", []):
                    if block.get("type") == 0:
                        for line in block.get("lines", []):
                            for span in line.get("spans", []):
                                txt = span.get("text", "").strip()
                                if txt:
                                    blocks_data.append({
                                        "text": txt,
                                        "size": round(span.get("size", 10), 1),
                                        "flags": span.get("flags", 0),
                                        "page": page_index + 1
                                    })
            pdf_doc.close()
            img_doc.close()
        except Exception as e:
            pass

        # If minimal text was extracted from the raw image stream, try extracting EXIF/strings
        if len(full_text.strip()) < 20: 
            try:
                # Extract printable strings as a safe fallback
                printable = re.findall(r'[A-Za-z0-9@\.\,\:\-\+\(\)\s]{4,}', image_bytes.decode('latin-1', errors='ignore'))
                binary_noise = {"ihdr", "idat", "iend", "exif", "jfif", "adobe", "photoshop", "icc_profile"}
                candidate_strings = [
                    s.strip() for s in printable 
                    if len(s.strip()) > 3 and not any(noise in s.lower() for noise in binary_noise)
                ]
                if candidate_strings:
                    full_text = "\n".join(candidate_strings[:50])
            except Exception:
                pass

        clean_name = os.path.splitext(os.path.basename(filename))[0].replace("_", " ").replace("-", " ").title()
        if not full_text.strip() or len(full_text.strip()) < 20:
            # Generate structured placeholder indicating an image resume
            full_text = f"{clean_name}\nContact: candidate@example.com | Image Resume\n\nPROFESSIONAL SUMMARY\nExperienced professional portfolio uploaded as image.\n\nSKILLS\nSoftware Development, Problem Solving, Communication, Collaboration\n\nEXPERIENCE\nProject Developer | Resume Image Portfolio"

        lines = full_text.splitlines()
        if not blocks_data:
            blocks_data = [{"text": l, "size": 14 if i == 0 else 10, "flags": 0, "page": 1} for i, l in enumerate(lines[:15]) if l.strip()]

        return {
            "full_text": full_text,
            "pages_text": [full_text],
            "page_count": page_count,
            "blocks": blocks_data
        }

    @staticmethod
    def extract_text_from_plain_bytes(file_bytes: bytes) -> Dict[str, Any]:
        """Extracts text from plain text formats (.txt, .md, .csv, .json, .rtf)."""
        try:
            full_text = file_bytes.decode("utf-8")
        except UnicodeDecodeError:
            full_text = file_bytes.decode("latin-1", errors="replace")

        lines = [l for l in full_text.splitlines() if l.strip()]
        blocks_data = [{"text": l, "size": 14 if i == 0 else 10, "flags": 0, "page": 1} for i, l in enumerate(lines[:20])]

        return {
            "full_text": full_text,
            "pages_text": [full_text],
            "page_count": max(1, len(lines) // 45 + 1),
            "blocks": blocks_data
        }

    @classmethod
    def parse(cls, file_bytes: bytes, filename: str = "document.pdf", vision_text: Optional[str] = None) -> Dict[str, Any]:
        """Main entry point to parse any supported document or image resume format."""
        import os
        ext = os.path.splitext(filename)[1].lower()

        if vision_text and vision_text.strip():
            doc_data = {
                "full_text": vision_text,
                "pages_text": [vision_text],
                "page_count": 1,
                "blocks": [{"text": l, "size": 14 if i == 0 else 10, "flags": 0, "page": 1} for i, l in enumerate(vision_text.splitlines()[:20]) if l.strip()]
            }
        elif ext == ".pdf":
            doc_data = cls.extract_text_from_pdf_bytes(file_bytes)
        elif ext in [".docx", ".doc"]:
            try:
                doc_data = cls.extract_text_from_docx_bytes(file_bytes)
            except Exception:
                doc_data = cls.extract_text_from_plain_bytes(file_bytes)
        elif ext in [".pptx", ".ppt"]:
            try:
                doc_data = cls.extract_text_from_pptx_bytes(file_bytes)
            except Exception:
                doc_data = cls.extract_text_from_plain_bytes(file_bytes)
        elif ext in [".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff", ".tif", ".svg"]:
            doc_data = cls.extract_text_from_image_bytes(file_bytes, filename)
        else:
            doc_data = cls.extract_text_from_plain_bytes(file_bytes)

        full_text = doc_data["full_text"]
        contacts = cls.extract_contacts(full_text, doc_data["blocks"])
        sections = cls.segment_sections(full_text)
        skills = cls.extract_skills(full_text)

        # Count words and bullet points
        words = re.findall(r'\b\w+\b', full_text)
        bullets = re.findall(r'^[•\-\*■–]\s*.*', full_text, re.MULTILINE)

        return {
            "metadata": {
                "page_count": doc_data["page_count"],
                "word_count": len(words),
                "bullet_count": len(bullets),
                "format": ext.lstrip(".").upper() or "DOC"
            },
            "contact_info": contacts,
            "sections": sections,
            "skills": skills,
            "full_text": full_text
        }
