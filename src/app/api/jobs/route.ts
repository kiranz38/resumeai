import { NextResponse } from "next/server";

interface CacheEntry {
  data: unknown;
  ts: number;
}

// In-memory cache with 1-hour TTL
const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function getCached(key: string): unknown | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: unknown) {
  // Evict stale entries periodically (keep cache bounded)
  if (cache.size > 200) {
    const now = Date.now();
    for (const [k, v] of cache) {
      if (now - v.ts > CACHE_TTL) cache.delete(k);
    }
  }
  cache.set(key, { data, ts: Date.now() });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    const country = searchParams.get("country") || "us";
    const page = searchParams.get("page") || "1";

    if (!q) {
      return NextResponse.json(
        { error: "Query parameter 'q' is required." },
        { status: 400 },
      );
    }

    const apiKey = process.env.RAPIDAPI_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Job search is not configured." },
        { status: 503 },
      );
    }

    // Check cache
    const cacheKey = `${q}|${country}|${page}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const params = new URLSearchParams({
      query: q,
      page,
      num_pages: "1",
    });
    if (country) {
      params.set("country", country);
    }

    const response = await fetch(
      `https://jsearch.p.rapidapi.com/search?${params}`,
      {
        headers: {
          "x-rapidapi-key": apiKey,
          "x-rapidapi-host": "jsearch.p.rapidapi.com",
        },
        // Cache in Next.js fetch layer too (1 hour)
        next: { revalidate: 3600 },
      },
    );

    if (!response.ok) {
      // Fallback: try Remotive API for remote jobs
      if (response.status === 429 || response.status === 403) {
        return await fetchRemotiveFallback(q);
      }
      console.error("[jobs] JSearch error:", response.status);
      return NextResponse.json(
        { error: "Job search temporarily unavailable." },
        { status: 502 },
      );
    }

    const json = await response.json();
    const jobs = json.data || [];
    const totalPages = Math.ceil((json.total || jobs.length) / 10);

    const result = { jobs, totalPages };
    setCache(cacheKey, result);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[jobs] Error:", error instanceof Error ? error.message : "Unknown");
    return NextResponse.json(
      { error: "Job search failed." },
      { status: 500 },
    );
  }
}

async function fetchRemotiveFallback(query: string) {
  try {
    const response = await fetch("https://remotive.com/api/remote-jobs", {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Job search temporarily unavailable." },
        { status: 502 },
      );
    }

    const json = await response.json();
    const q = query.toLowerCase();

    // Filter jobs matching the query
    const filtered = (json.jobs || [])
      .filter(
        (j: { title?: string; company_name?: string; description?: string }) =>
          j.title?.toLowerCase().includes(q) ||
          j.company_name?.toLowerCase().includes(q) ||
          j.description?.toLowerCase().includes(q),
      )
      .slice(0, 20)
      .map(
        (j: {
          id?: number;
          title?: string;
          company_name?: string;
          company_logo?: string;
          candidate_required_location?: string;
          description?: string;
          publication_date?: string;
          job_type?: string;
          salary?: string;
        }) => ({
          job_id: String(j.id || Math.random()),
          job_title: j.title || "",
          employer_name: j.company_name || "",
          employer_logo: j.company_logo || null,
          job_city: "",
          job_state: "",
          job_country: j.candidate_required_location || "Remote",
          job_description: j.description || "",
          job_posted_at_datetime_utc: j.publication_date || "",
          job_employment_type: j.job_type || "FULL_TIME",
          job_min_salary: null,
          job_max_salary: null,
          job_salary_currency: null,
          job_salary_period: null,
        }),
      );

    return NextResponse.json({ jobs: filtered, totalPages: 1 });
  } catch {
    return NextResponse.json(
      { error: "Job search temporarily unavailable." },
      { status: 502 },
    );
  }
}
