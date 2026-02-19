import type { JobProfile } from "./types";

/**
 * Deterministic job description parser - extracts structured info from JD text.
 */
export function parseJobDescription(text: string): JobProfile {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  const title = extractJobTitle(lines, text);
  const company = extractCompany(lines, text);
  const { required, preferred } = extractRequirements(text);
  const responsibilities = extractResponsibilities(text);
  const keywords = extractKeywords(text);
  const seniorityLevel = detectSeniority(text);

  return {
    title: title || undefined,
    company: company || undefined,
    requiredSkills: required,
    preferredSkills: preferred,
    responsibilities,
    keywords,
    seniorityLevel,
  };
}

function extractJobTitle(lines: string[], _text: string): string | null {
  // First line is often the title
  for (const line of lines.slice(0, 3)) {
    if (/\b(engineer|developer|manager|designer|analyst|scientist|architect|lead|director|consultant|specialist|coordinator)\b/i.test(line)) {
      // Remove company suffix (use alternation, NOT char class — [at] matches letters 'a' and 't')
      return line.replace(/\s*(?:[—–|]|\s-\s|@\s+)\s*.+$/, "").replace(/\s*\(.+\)$/, "").trim();
    }
  }
  // First non-empty line as fallback
  return lines[0] || null;
}

function extractCompany(lines: string[], text: string): string | null {
  // Pattern: "at CompanyName" or "— CompanyName" or "Company Name" in title line
  const titleLine = lines[0] || "";
  const companyMatch = titleLine.match(/(?:[—–|]|\s-\s|@\s+)\s*(.+?)(?:\s*\(|$)/);
  if (companyMatch) return companyMatch[1].trim();

  // "About CompanyName" or "About the company" section
  const aboutMatch = text.match(/About\s+([A-Z][\w\s]+?)(?:\n|:)/);
  if (aboutMatch) return aboutMatch[1].trim();

  // Company in "at Company" format
  const atMatch = text.match(/(?:at|@)\s+([A-Z][\w\s&.]+?)(?:\n|\.|\s{2})/);
  if (atMatch) return atMatch[1].trim();

  return null;
}

function extractRequirements(text: string): { required: string[]; preferred: string[] } {
  const required: string[] = [];
  const preferred: string[] = [];

  const sections = text.split(/\n(?=[A-Z])/);

  let inRequired = false;
  let inPreferred = false;

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    const lower = trimmed.toLowerCase();

    // Detect section headers
    if (/\b(requirements?|qualifications?|must have|required|what you.?ll need|minimum)\b/i.test(lower) && trimmed.length < 80) {
      inRequired = true;
      inPreferred = false;
      continue;
    }
    if (/\b(nice to have|preferred|bonus|ideal|plus|desired|optional)\b/i.test(lower) && trimmed.length < 80) {
      inPreferred = true;
      inRequired = false;
      continue;
    }
    if (/\b(responsibilities|about the|what you.?ll do|overview|benefits|perks|compensation|we offer|about us)\b/i.test(lower) && trimmed.length < 80) {
      inRequired = false;
      inPreferred = false;
      continue;
    }

    // Extract bullet items
    const isBullet = /^[•·●▪◦\-–—*]\s*/.test(trimmed) || /^\d+[.)]\s*/.test(trimmed);
    if (isBullet) {
      const content = trimmed.replace(/^[•·●▪◦\-–—*]\s*/, "").replace(/^\d+[.)]\s*/, "").trim();
      if (content.length > 3) {
        if (inPreferred) {
          preferred.push(content);
        } else if (inRequired) {
          required.push(content);
        }
      }
    }
  }

  // If no structured sections found, try to extract skills from full text
  if (required.length === 0 && preferred.length === 0) {
    const bullets = text.match(/[•·●▪◦\-–—*]\s*.+/g) || [];
    for (const bullet of bullets) {
      const content = bullet.replace(/^[•·●▪◦\-–—*]\s*/, "").trim();
      if (content.length > 3) {
        required.push(content);
      }
    }
  }

  return { required, preferred };
}

function extractResponsibilities(text: string): string[] {
  const responsibilities: string[] = [];
  let inResponsibilities = false;

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    const lower = trimmed.toLowerCase();

    if (/\b(responsibilities|what you.?ll do|role|duties)\b/i.test(lower) && trimmed.length < 80) {
      inResponsibilities = true;
      continue;
    }
    if (inResponsibilities && /\b(requirements?|qualifications?|about|benefits)\b/i.test(lower) && trimmed.length < 80) {
      inResponsibilities = false;
      continue;
    }

    if (inResponsibilities) {
      const isBullet = /^[•·●▪◦\-–—*]\s*/.test(trimmed) || /^\d+[.)]\s*/.test(trimmed);
      if (isBullet) {
        const content = trimmed.replace(/^[•·●▪◦\-–—*]\s*/, "").replace(/^\d+[.)]\s*/, "").trim();
        if (content.length > 3) {
          responsibilities.push(content);
        }
      }
    }
  }

  return responsibilities;
}

function extractKeywords(text: string): string[] {
  const keywords: Set<string> = new Set();

  // Technical skills and tools
  const techPatterns = [
    /\b(JavaScript|TypeScript|Python|Java|C\+\+|C#|Go|Golang|Rust|Ruby|PHP|Swift|Kotlin|Scala|R|MATLAB)\b/gi,
    /\b(React|Angular|Vue|Svelte|Next\.?js|Nuxt|Gatsby|Remix)\b/gi,
    /\b(Node\.?js|Express|Django|Flask|FastAPI|Spring|Rails|Laravel|\.NET|ASP\.NET)\b/gi,
    /\b(AWS|GCP|Azure|Google Cloud|Amazon Web Services)\b/gi,
    /\b(Docker|Kubernetes|K8s|Terraform|Pulumi|Ansible|CloudFormation)\b/gi,
    /\b(PostgreSQL|MySQL|MongoDB|Redis|Elasticsearch|DynamoDB|Cassandra|SQLite)\b/gi,
    /\b(GraphQL|REST|gRPC|WebSocket|API|microservices)\b/gi,
    /\b(CI\/CD|GitHub Actions|Jenkins|CircleCI|GitLab CI|Travis)\b/gi,
    /\b(Git|SVN|Agile|Scrum|Kanban|Jira|Confluence)\b/gi,
    /\b(HTML|CSS|SASS|SCSS|Tailwind|Bootstrap|Material UI)\b/gi,
    /\b(Kafka|RabbitMQ|Redis Streams|SQS|Pub\/Sub)\b/gi,
    /\b(TensorFlow|PyTorch|Scikit-learn|NLP|Machine Learning|Deep Learning|AI|ML|LLM)\b/gi,
    /\b(Linux|Unix|Bash|Shell|PowerShell)\b/gi,
    /\b(Figma|Sketch|Adobe|Photoshop)\b/gi,
    /\b(SQL|NoSQL|ETL|Data Pipeline|Data Engineering)\b/gi,
    /\b(OAuth|JWT|SAML|SSO|Authentication|Authorization|Security)\b/gi,
  ];

  for (const pattern of techPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      keywords.add(normalizeKeyword(match[0]));
    }
  }

  // Soft skills and domain terms
  const softPatterns = [
    /\b(leadership|mentoring|mentorship|coaching|team lead)\b/gi,
    /\b(system design|architecture|scalability|distributed systems)\b/gi,
    /\b(communication|collaboration|cross-functional|stakeholder)\b/gi,
    /\b(project management|product management|roadmap)\b/gi,
    /\b(testing|TDD|BDD|unit test|integration test|e2e|QA)\b/gi,
    /\b(performance|optimization|monitoring|observability)\b/gi,
    /\b(compliance|GDPR|SOC\s*2|HIPAA|PCI)\b/gi,
  ];

  for (const pattern of softPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      keywords.add(normalizeKeyword(match[0]));
    }
  }

  return Array.from(keywords);
}

function normalizeKeyword(keyword: string): string {
  // Normalize common variations
  const map: Record<string, string> = {
    "nodejs": "Node.js",
    "node.js": "Node.js",
    "nextjs": "Next.js",
    "next.js": "Next.js",
    "golang": "Go",
    "k8s": "Kubernetes",
    "gcp": "GCP",
    "aws": "AWS",
    "google cloud": "GCP",
    "amazon web services": "AWS",
  };

  const lower = keyword.toLowerCase();
  return map[lower] || keyword;
}

function detectSeniority(text: string): string {
  const lower = text.toLowerCase();

  if (/\b(principal|staff|distinguished|fellow)\b/.test(lower)) return "Principal";
  if (/\b(director|vp|vice president|head of)\b/.test(lower)) return "Director";
  if (/\b(senior|sr\.?|lead)\b/.test(lower)) return "Senior";
  if (/\b(manager|engineering manager)\b/.test(lower)) return "Manager";
  if (/\b(mid[- ]?level|intermediate)\b/.test(lower)) return "Mid";
  if (/\b(junior|jr\.?|entry[- ]?level|associate|intern)\b/.test(lower)) return "Junior";
  if (/\b(5\+|6\+|7\+|8\+|9\+|10\+)\s*years?\b/.test(lower)) return "Senior";
  if (/\b(3\+|4\+)\s*years?\b/.test(lower)) return "Mid";
  if (/\b(1\+|2\+|0\+)\s*years?\b/.test(lower)) return "Junior";

  return "Mid"; // Default
}
