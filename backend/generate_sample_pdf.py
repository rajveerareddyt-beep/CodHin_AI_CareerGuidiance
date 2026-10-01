import os
import fitz  # PyMuPDF

os.makedirs("backend/samples", exist_ok=True)

def create_pdf(filename, title, content_lines):
    doc = fitz.open()
    page = doc.new_page(width=595, height=842)  # A4

    # Add header
    p1 = fitz.Point(50, 50)
    page.insert_text(p1, title, fontsize=18, fontname="helv", color=(0.1, 0.15, 0.3))

    y = 80
    for line in content_lines:
        line_str = line.strip()
        if not line_str:
            y += 8
            continue

        if line_str.isupper() and len(line_str) < 35:
            y += 10
            page.insert_text(fitz.Point(50, y), line_str, fontsize=12, fontname="helv", color=(0.15, 0.25, 0.5))
            # draw subtle separator line
            page.draw_line(fitz.Point(50, y + 2), fitz.Point(545, y + 2), color=(0.7, 0.75, 0.85), width=0.8)
            y += 14
        elif line_str.startswith("•") or line_str.startswith("-"):
            page.insert_text(fitz.Point(60, y), line_str, fontsize=9.5, fontname="helv", color=(0.2, 0.2, 0.2))
            y += 14
        else:
            page.insert_text(fitz.Point(50, y), line_str, fontsize=10, fontname="helv", color=(0.2, 0.2, 0.2))
            y += 14

        if y > 790:
            page = doc.new_page(width=595, height=842)
            y = 50

    filepath = os.path.join("backend/samples", filename)
    doc.save(filepath)
    doc.close()
    print(f"Generated {filepath}")

# Fullstack Resume
fullstack_content = [
    "Alexander Morgan",
    "alex.morgan@techforge.io | (555) 234-8901 | linkedin.com/in/alexandermorgan | github.com/alexmorgan-dev",
    "San Francisco, CA",
    "",
    "PROFESSIONAL SUMMARY",
    "Results-driven Full-Stack Engineer with 5+ years of experience engineering scalable web applications and distributed cloud architectures. Spearheaded migration of legacy systems to modern React, Node.js, and microservices on AWS, driving a 45% reduction in latency and 99.99% availability.",
    "",
    "CORE TECHNICAL SKILLS",
    "• Languages: TypeScript, JavaScript, Python, SQL, HTML, CSS, Bash",
    "• Frameworks: React, Next.js, Node.js, Express, FastAPI, Tailwind CSS, Redux",
    "• Databases & Cloud: MySQL, PostgreSQL, Redis, AWS (S3, ECS, Lambda), Docker, Kubernetes, CI/CD",
    "• Tools & Practices: Git, REST API, GraphQL, System Design, Agile, Scrum, Jest, PyTest",
    "",
    "PROFESSIONAL EXPERIENCE",
    "Senior Full-Stack Developer | NovaCloud Solutions | 2022 - Present",
    "• Architected and deployed microservices architecture handling 15,000+ requests per second, reducing infrastructure costs by 32% ($120,000 annually).",
    "• Engineered real-time collaborative dashboard using React, TypeScript, and WebSockets, accelerating team productivity by 40% for over 50,000 active users.",
    "• Optimized complex MySQL database queries and implemented distributed Redis caching, decreasing average page load time from 3.2s to 650ms.",
    "• Mentored 6 junior and mid-level software engineers on code review standards, test-driven development (TDD), and cloud-native patterns.",
    "",
    "Full-Stack Software Engineer | Apex Digital Labs | 2019 - 2022",
    "• Developed 18+ high-traffic RESTful APIs utilizing Node.js, Express, and PostgreSQL with 95% automated test coverage.",
    "• Spearheaded frontend revamp migrating monolithic codebase to modular React with Next.js, boosting mobile conversion rates by 28%.",
    "• Automated continuous integration and continuous deployment (CI/CD) pipelines with GitHub Actions and Docker, cutting deployment cycles from 4 hours to 12 minutes.",
    "• Resolved 120+ mission-critical production tickets, maintaining 99.95% system uptime across global customer clusters.",
    "",
    "EDUCATION & CERTIFICATIONS",
    "• Bachelor of Science in Computer Science | University of California, Berkeley | 2019",
    "• AWS Certified Solutions Architect - Associate | Amazon Web Services | 2023",
    "• Certified Kubernetes Administrator (CKA) | Linux Foundation | 2024"
]

create_pdf("Alexander_Morgan_FullStack.pdf", "Alexander Morgan", fullstack_content)
