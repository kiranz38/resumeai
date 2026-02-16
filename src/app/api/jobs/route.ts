import { NextResponse } from "next/server";
import { rateLimitRoute } from "@/lib/rate-limiter";

interface CacheEntry {
  data: unknown;
  ts: number;
}

// In-memory cache with stale-while-revalidate
const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour — fresh
const STALE_TTL = 2 * 60 * 60 * 1000; // 2 hours — serve stale while revalidating

// Track in-flight background revalidations to prevent duplicates
const revalidating = new Set<string>();

function getCached(key: string): { data: unknown; stale: boolean } | null {
  const entry = cache.get(key);
  if (!entry) return null;
  const age = Date.now() - entry.ts;
  if (age > STALE_TTL) {
    cache.delete(key);
    return null;
  }
  return { data: entry.data, stale: age > CACHE_TTL };
}

function setCache(key: string, data: unknown) {
  if (cache.size > 200) {
    const now = Date.now();
    for (const [k, v] of cache) {
      if (now - v.ts > STALE_TTL) cache.delete(k);
    }
  }
  cache.set(key, { data, ts: Date.now() });
}

// Country code → display name (used to enrich the JSearch query for non-US countries)
const COUNTRY_LABEL: Record<string, string> = {
  us: "United States",
  gb: "United Kingdom",
  ca: "Canada",
  au: "Australia",
  de: "Germany",
  in: "India",
  fr: "France",
  nl: "Netherlands",
  sg: "Singapore",
};

// Country code → ISO country code used in LinkedIn's countries_derived field
const LINKEDIN_COUNTRY_CODE: Record<string, string> = {
  us: "US",
  gb: "GB",
  ca: "CA",
  au: "AU",
  de: "DE",
  in: "IN",
  fr: "FR",
  nl: "NL",
  sg: "SG",
};

// Country code → fragments for Remotive location matching
const COUNTRY_LOCATION_TERMS: Record<string, string[]> = {
  us: ["united states", "usa", "u.s.", "north america"],
  gb: ["united kingdom", "uk", "england", "britain", "europe"],
  ca: ["canada", "north america"],
  au: ["australia", "oceania"],
  de: ["germany", "europe"],
  in: ["india", "asia"],
  sg: ["singapore", "asia"],
  fr: ["france", "europe"],
  nl: ["netherlands", "europe"],
};

/** Allowed country codes */
const VALID_COUNTRIES = new Set(Object.keys(COUNTRY_LABEL));

/** Fetch with abort-based timeout (ms) */
async function fetchWithTimeout(
  url: string,
  init: RequestInit & { timeout?: number } = {},
): Promise<Response> {
  const { timeout = 8000, ...fetchInit } = init;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...fetchInit, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

interface StandardJob {
  job_id: string;
  job_title: string;
  employer_name: string;
  employer_logo: string | null;
  job_city: string;
  job_state: string;
  job_country: string;
  job_description: string;
  job_posted_at_datetime_utc: string;
  job_employment_type: string;
  job_apply_link?: string | null;
  job_min_salary: number | null;
  job_max_salary: number | null;
  job_salary_currency: string | null;
  job_salary_period: string | null;
}

/** Deduplicate jobs by normalized title + employer */
function deduplicateJobs(jobs: StandardJob[]): StandardJob[] {
  const seen = new Set<string>();
  return jobs.filter((j) => {
    const key = `${j.job_title.toLowerCase().trim()}|${j.employer_name.toLowerCase().trim()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function GET(request: Request) {
  try {
    // Rate limit
    const { response: rateLimited } = rateLimitRoute(request, "jobs");
    if (rateLimited) return rateLimited;

    const { searchParams } = new URL(request.url);
    const rawQ = searchParams.get("q")?.trim();
    const rawCountry = searchParams.get("country") ?? "us";
    const rawPage = searchParams.get("page") || "1";

    // Sanitize: strip control chars from query
    const q = rawQ?.replace(/[\x00-\x1f\x7f]/g, "").slice(0, 200);
    if (!q) {
      return NextResponse.json(
        { error: "Query parameter 'q' is required." },
        { status: 400 },
      );
    }

    // Validate country code against allowlist — empty string means "worldwide"
    const country = rawCountry === "" ? "" : (VALID_COUNTRIES.has(rawCountry.toLowerCase()) ? rawCountry.toLowerCase() : "us");

    // Validate page is a positive integer
    const pageNum = parseInt(rawPage, 10);
    const page = (Number.isFinite(pageNum) && pageNum > 0 && pageNum <= 100) ? String(pageNum) : "1";

    const apiKey = process.env.RAPIDAPI_KEY;
    if (!apiKey) {
      // No API key → fall back to Remotive instead of returning an error
      console.log("[jobs] No RAPIDAPI_KEY — using Remotive fallback");
      return await fetchRemotiveFallback(q, country);
    }

    // Check cache (stale-while-revalidate)
    const cacheKey = `${q}|${country}|${page}`;
    const cached = getCached(cacheKey);
    if (cached) {
      if (cached.stale && !revalidating.has(cacheKey)) {
        // Serve stale data immediately, revalidate in background
        revalidating.add(cacheKey);
        revalidateInBackground(apiKey, q, country, page, cacheKey);
      }
      return NextResponse.json(cached.data);
    }

    // ── Strategy: JSearch + LinkedIn in parallel → Remotive fallback ──
    const [jsearchResult, linkedInResult] = await Promise.all([
      fetchJSearch(apiKey, q, country, page),
      fetchLinkedInJobs(apiKey, q, country, page),
    ]);

    if (jsearchResult) {
      setCache(cacheKey, jsearchResult);
      return NextResponse.json(jsearchResult);
    }

    if (linkedInResult) {
      setCache(cacheKey, linkedInResult);
      return NextResponse.json(linkedInResult);
    }

    // Both empty → fall back to Remotive (free, no key needed)
    console.log(`[jobs] JSearch + LinkedIn empty for "${q}" in ${country} — trying Remotive`);
    return await fetchRemotiveFallback(q, country);
  } catch (error) {
    console.error("[jobs] Error:", error instanceof Error ? error.message : "Unknown");
    return NextResponse.json(
      { error: "Job search failed." },
      { status: 500 },
    );
  }
}

/** Background revalidation — fire-and-forget refresh of stale cache entries */
async function revalidateInBackground(
  apiKey: string,
  q: string,
  country: string,
  page: string,
  cacheKey: string,
) {
  try {
    const [js, li] = await Promise.all([
      fetchJSearch(apiKey, q, country, page),
      fetchLinkedInJobs(apiKey, q, country, page),
    ]);
    const result = js || li || null;
    if (result) {
      setCache(cacheKey, result);
    }
  } catch {
    // Background revalidation failure is non-critical
  } finally {
    revalidating.delete(cacheKey);
  }
}

/**
 * Fetch from JSearch API. Tries two strategies:
 * 1. Pass `country` param (works well for US, CA, IN)
 * 2. If 0 results, retry with country name appended to query
 *    (e.g. "developer" → "developer in United Kingdom")
 *
 * Returns null if both attempts fail or return 0 results.
 */
async function fetchJSearch(
  apiKey: string,
  query: string,
  country: string,
  page: string,
): Promise<{ jobs: unknown[]; totalPages: number; source: string } | null> {
  const headers = {
    "x-rapidapi-key": apiKey,
    "x-rapidapi-host": "jsearch.p.rapidapi.com",
  };

  // Attempt 1: use the country parameter
  const params1 = new URLSearchParams({
    query,
    page,
    num_pages: "1",
    date_posted: "all",
  });
  if (country) {
    params1.set("country", country);
  }

  try {
    const res1 = await fetchWithTimeout(
      `https://jsearch.p.rapidapi.com/search?${params1}`,
      { headers, timeout: 8000 },
    );

    if (res1.ok) {
      const json = await res1.json();
      const jobs = json.data || [];
      if (jobs.length > 0) {
        const totalPages = Math.ceil((json.total || jobs.length) / 10);
        return { jobs, totalPages, source: "jsearch" };
      }
    } else if (res1.status === 401 || res1.status === 403 || res1.status === 429) {
      console.warn(`[jobs] JSearch ${res1.status} — skipping to fallback`);
      return null;
    }
  } catch (err) {
    console.warn("[jobs] JSearch attempt 1 failed:", (err as Error).message);
  }

  // Attempt 2: append country name to the query (works for GB, SG, etc.)
  const countryName = country ? COUNTRY_LABEL[country.toLowerCase()] : undefined;
  if (!countryName || country.toLowerCase() === "us") {
    // US already tried with country param; no-country means "remote/anywhere"
    return null;
  }

  const enrichedQuery = `${query} in ${countryName}`;
  const params2 = new URLSearchParams({
    query: enrichedQuery,
    page,
    num_pages: "1",
    date_posted: "all",
  });

  try {
    const res2 = await fetchWithTimeout(
      `https://jsearch.p.rapidapi.com/search?${params2}`,
      { headers, timeout: 8000 },
    );

    if (res2.ok) {
      const json = await res2.json();
      const jobs = json.data || [];
      if (jobs.length > 0) {
        const totalPages = Math.ceil((json.total || jobs.length) / 10);
        return { jobs, totalPages, source: "jsearch" };
      }
    }
  } catch (err) {
    console.error("[jobs] JSearch attempt 2 failed:", (err as Error).message);
  }

  return null;
}

/**
 * LinkedIn Job Search API (RapidAPI) — bulk feed endpoint.
 * Fetches recent jobs and filters by keyword + country on our side.
 * The bulk response is cached separately since it's the same for all queries.
 */

interface LinkedInJob {
  id?: string;
  title?: string;
  organization?: string;
  organization_logo?: string;
  url?: string;
  date_posted?: string;
  employment_type?: string[];
  countries_derived?: string[];
  cities_derived?: string[];
  regions_derived?: string[];
  salary_raw?: {
    currency?: string;
    value?: { minValue?: number; maxValue?: number; unitText?: string };
  };
  description?: string;
}

async function fetchLinkedInJobs(
  apiKey: string,
  query: string,
  country: string,
  _page: string,
): Promise<{ jobs: StandardJob[]; totalPages: number; source: string } | null> {
  const countryCode = country ? LINKEDIN_COUNTRY_CODE[country.toLowerCase()] : "";
  // Only reject if a specific country was requested but isn't in our map
  if (country && !countryCode) return null;

  try {
    // Check if we have a cached bulk feed
    const bulkCacheKey = "linkedin_bulk";
    let allJobs = getCached(bulkCacheKey)?.data as LinkedInJob[] | null;

    if (!allJobs) {
      const res = await fetchWithTimeout(
        "https://linkedin-job-search-api.p.rapidapi.com/active-jb-1h?limit=100&offset=0&description_type=text",
        {
          headers: {
            "x-rapidapi-key": apiKey,
            "x-rapidapi-host": "linkedin-job-search-api.p.rapidapi.com",
          },
          timeout: 8000,
        },
      );

      if (!res.ok) {
        if (res.status === 401 || res.status === 403 || res.status === 429) {
          console.warn(`[jobs] LinkedIn API ${res.status} — skipping to fallback`);
        }
        return null;
      }

      const data = await res.json();

      // API returns error object when quota exceeded
      if (!Array.isArray(data)) {
        console.warn("[jobs] LinkedIn API returned non-array:", data?.message || "unknown");
        return null;
      }

      allJobs = data as LinkedInJob[];
      setCache(bulkCacheKey, allJobs);
    }

    // Filter by country (skip when worldwide)
    const countryMatched = countryCode
      ? allJobs.filter((j) => j.countries_derived?.includes(countryCode))
      : allJobs;

    // Filter by query keyword in title or organization
    const q = query.toLowerCase();
    const filtered = (q === "hiring" ? countryMatched : countryMatched.filter(
      (j) =>
        j.title?.toLowerCase().includes(q) ||
        j.organization?.toLowerCase().includes(q) ||
        j.description?.toLowerCase().includes(q),
    ));

    if (filtered.length === 0) return null;

    // Map to our standard format — return ALL results (client paginates)
    const jobs: StandardJob[] = deduplicateJobs(filtered.map((j) => {
      const city = j.cities_derived?.[0] || "";
      const region = j.regions_derived?.[0] || "";
      const salary = j.salary_raw?.value;

      return {
        job_id: String(j.id || Math.random()),
        job_title: j.title || "",
        employer_name: j.organization || "",
        employer_logo: j.organization_logo || null,
        job_city: city,
        job_state: region,
        job_country: countryCode || "Remote",
        job_description: j.description || j.title || "",
        job_posted_at_datetime_utc: j.date_posted || "",
        job_employment_type: j.employment_type?.[0] || "FULL_TIME",
        job_apply_link: j.url || null,
        job_min_salary: salary?.minValue || null,
        job_max_salary: salary?.maxValue || null,
        job_salary_currency: j.salary_raw?.currency || null,
        job_salary_period: salary?.unitText || null,
      };
    }));

    return { jobs, totalPages: Math.ceil(jobs.length / 10), source: "linkedin" };
  } catch (err) {
    console.error("[jobs] LinkedIn API failed:", (err as Error).message);
    return null;
  }
}

/**
 * Remotive API fallback — returns remote jobs filtered by query and country.
 * Used when JSearch and LinkedIn fail, are rate-limited, or have no API key.
 * Bulk feed is cached separately to avoid re-fetching on every call.
 */
async function fetchRemotiveFallback(query: string, country: string) {
  try {
    // Check for cached Remotive bulk feed
    const bulkCacheKey = "remotive_bulk";
    let allRemotiveJobs = getCached(bulkCacheKey)?.data as Array<Record<string, unknown>> | null;

    if (!allRemotiveJobs) {
      const response = await fetchWithTimeout("https://remotive.com/api/remote-jobs", {
        timeout: 8000,
      });

      if (!response.ok) {
        return NextResponse.json(
          { error: "Job search temporarily unavailable." },
          { status: 502 },
        );
      }

      const json = await response.json();
      allRemotiveJobs = (json.jobs || []) as Array<Record<string, unknown>>;
      setCache(bulkCacheKey, allRemotiveJobs);
    }

    const q = query.toLowerCase();
    const countryTerms = country ? (COUNTRY_LOCATION_TERMS[country.toLowerCase()] || []) : [];

    // Filter jobs matching the query
    const queryMatched = allRemotiveJobs
      .filter(
        (j) =>
          q === "hiring" || // Default query — show all
          (j.title as string | undefined)?.toLowerCase().includes(q) ||
          (j.company_name as string | undefined)?.toLowerCase().includes(q) ||
          (j.description as string | undefined)?.toLowerCase().includes(q),
      );

    // Prefer jobs that mention the selected country/region
    const countryFiltered = countryTerms.length > 0
      ? queryMatched.filter(
          (j) => {
            const loc = ((j.candidate_required_location as string) || "").toLowerCase();
            if (!loc || loc === "worldwide" || loc === "anywhere") return true;
            return countryTerms.some((term) => loc.includes(term));
          },
        )
      : queryMatched;

    // If country filtering left too few results, fall back to all query matches
    const sourceList = countryFiltered.length >= 3 ? countryFiltered : queryMatched;

    // Map to standard format — return ALL results (client paginates)
    const mapped: StandardJob[] = deduplicateJobs(sourceList
      .map(
        (j) => ({
          job_id: String(j.id || Math.random()),
          job_title: (j.title as string) || "",
          employer_name: (j.company_name as string) || "",
          employer_logo: (j.company_logo as string) || null,
          job_city: "",
          job_state: "",
          job_country: (j.candidate_required_location as string) || "Remote",
          job_description: (j.description as string) || "",
          job_posted_at_datetime_utc: (j.publication_date as string) || "",
          job_employment_type: (j.job_type as string) || "FULL_TIME",
          job_apply_link: null,
          job_min_salary: null,
          job_max_salary: null,
          job_salary_currency: null,
          job_salary_period: null,
        }),
      ));

    return NextResponse.json({
      jobs: mapped,
      totalPages: Math.ceil(mapped.length / 10),
      source: "remotive",
    });
  } catch {
    return NextResponse.json(
      { error: "Job search temporarily unavailable." },
      { status: 502 },
    );
  }
}
