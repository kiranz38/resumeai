"use client";

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { JOB_BOARD_COUNTRIES } from "@/lib/constants";
import { quickMatchScore, matchScoreDisplay, LOW_MATCH_THRESHOLD } from "@/lib/quick-match";
import LowMatchDialog from "@/components/LowMatchDialog";

interface JobListing {
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
  job_min_salary: number | null;
  job_max_salary: number | null;
  job_salary_currency: string | null;
  job_salary_period: string | null;
}

type JobWithScore = JobListing & { matchScore?: number };

interface JobBoardProps {
  onSelectJob: (jdText: string, jobTitle?: string) => void;
  onBulkGenerate?: (jobs: Array<{ title: string; jd: string }>) => void;
  /** Resume text from user session — enables match score ranking */
  resumeText?: string;
}

const MAX_BULK_SELECT = 5;
const DEFAULT_QUERY = "hiring";
const JOBS_PER_PAGE = 10;

// Simple in-memory cache for search results
const searchCache = new Map<
  string,
  { data: JobListing[]; totalPages: number; source: string; ts: number }
>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes client-side

function getCachedResults(key: string) {
  const cached = searchCache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached;
  return null;
}

// Module-level memoization caches for stripHtml and match scores
const strippedHtmlCache = new Map<string, string>();
const MAX_STRIPPED_CACHE = 500;

const matchScoreCache = new Map<string, number>();
const MAX_SCORE_CACHE = 500;

function formatSalary(job: JobListing): string | null {
  if (!job.job_min_salary && !job.job_max_salary) return null;
  const currency = job.job_salary_currency || "USD";
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(n);
  if (job.job_min_salary && job.job_max_salary) {
    return `${fmt(job.job_min_salary)} - ${fmt(job.job_max_salary)}`;
  }
  return fmt(job.job_min_salary || job.job_max_salary || 0);
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 3;

/** Strip HTML tags and decode entities to plain text (safe — no innerHTML) */
function stripHtml(html: string): string {
  const cached = strippedHtmlCache.get(html);
  if (cached !== undefined) return cached;

  const result = html
    .replace(/<[^>]*>/g, "\n")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (strippedHtmlCache.size >= MAX_STRIPPED_CACHE) {
    // Evict oldest entry
    const firstKey = strippedHtmlCache.keys().next().value;
    if (firstKey !== undefined) strippedHtmlCache.delete(firstKey);
  }
  strippedHtmlCache.set(html, result);
  return result;
}

/** Cached match score lookup */
function getCachedMatchScore(resumeText: string, jobId: string, jobDescription: string): number {
  const cacheKey = `${jobId}|${resumeText.length}`;
  const cached = matchScoreCache.get(cacheKey);
  if (cached !== undefined) return cached;

  const score = quickMatchScore(resumeText, stripHtml(jobDescription));

  if (matchScoreCache.size >= MAX_SCORE_CACHE) {
    const firstKey = matchScoreCache.keys().next().value;
    if (firstKey !== undefined) matchScoreCache.delete(firstKey);
  }
  matchScoreCache.set(cacheKey, score);
  return score;
}

/** Deduplicate jobs by normalized title + employer (client-side safety net) */
function deduplicateJobs(jobs: JobWithScore[]): JobWithScore[] {
  const seen = new Set<string>();
  return jobs.filter((j) => {
    const key = `${j.job_title.toLowerCase().trim()}|${j.employer_name.toLowerCase().trim()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Skeleton card shown while loading — mimics a real job card layout */
function JobSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-100 bg-white p-4">
      <div className="flex gap-4">
        <div className="h-12 w-12 flex-shrink-0 rounded-lg bg-gray-200" />
        <div className="min-w-0 flex-1 space-y-2.5">
          <div className="h-4 w-3/5 rounded bg-gray-200" />
          <div className="h-3.5 w-2/5 rounded bg-gray-200" />
          <div className="flex gap-2">
            <div className="h-3 w-20 rounded bg-gray-100" />
            <div className="h-3 w-16 rounded bg-gray-100" />
            <div className="h-3 w-14 rounded bg-gray-100" />
          </div>
        </div>
        <div className="hidden sm:block">
          <div className="h-9 w-28 rounded-lg bg-gray-200" />
        </div>
      </div>
    </div>
  );
}

function JobSkeletonList({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }, (_, i) => (
        <JobSkeleton key={i} />
      ))}
    </div>
  );
}

export default function JobBoard({ onSelectJob, onBulkGenerate, resumeText }: JobBoardProps) {
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("us");
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [defaultJobs, setDefaultJobs] = useState<JobListing[]>([]);
  const [isDefaultView, setIsDefaultView] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Source tracking for client-side vs server-side pagination
  const [source, setSource] = useState<string>("jsearch");
  const [allClientJobs, setAllClientJobs] = useState<JobListing[]>([]);

  // Low-match permission dialog state
  const [lowMatchDialog, setLowMatchDialog] = useState<{
    jobTitle: string;
    matchScore: number;
    lowMatchCount?: number;
    totalCount?: number;
    onProceed: () => void;
  } | null>(null);

  // ── All jobs for current context (before pagination) ──
  const allJobs = useMemo<JobListing[]>(() => {
    if (isDefaultView) return defaultJobs;
    return allClientJobs.length > 0 ? allClientJobs : jobs;
  }, [isDefaultView, defaultJobs, allClientJobs, jobs]);

  // ── Client-side pagination — always 10 per page ──
  const totalPages = Math.ceil(allJobs.length / JOBS_PER_PAGE);

  const visibleJobs = useMemo<JobListing[]>(() => {
    const start = (page - 1) * JOBS_PER_PAGE;
    return allJobs.slice(start, start + JOBS_PER_PAGE);
  }, [allJobs, page]);

  // ── Sorted jobs with match scores + dedup ──
  const sortedJobs = useMemo<JobWithScore[]>(() => {
    if (!visibleJobs.length) return [];

    const withScores: JobWithScore[] = visibleJobs.map((job) => ({
      ...job,
      matchScore: resumeText
        ? getCachedMatchScore(resumeText, job.job_id, job.job_description)
        : undefined,
    }));

    // Deduplicate as client-side safety net
    const deduped = deduplicateJobs(withScores);

    if (resumeText) {
      // Sort by match score descending — best matches first
      return deduped.sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
    }

    // No resume → sort alphabetically by job title
    return deduped.sort((a, b) => a.job_title.localeCompare(b.job_title));
  }, [visibleJobs, resumeText]);

  const toggleSelect = useCallback((jobId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) {
        next.delete(jobId);
      } else if (next.size < MAX_BULK_SELECT) {
        next.add(jobId);
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // ── Quick Analyze with low-match gate ──
  const handleQuickAnalyze = useCallback(
    (job: JobWithScore) => {
      const jdText = stripHtml(job.job_description);
      const title = `${job.job_title} at ${job.employer_name}`;

      if (
        job.matchScore !== undefined &&
        job.matchScore < LOW_MATCH_THRESHOLD
      ) {
        setLowMatchDialog({
          jobTitle: title,
          matchScore: job.matchScore,
          onProceed: () => {
            setLowMatchDialog(null);
            onSelectJob(jdText, title);
          },
        });
        return;
      }

      onSelectJob(jdText, title);
    },
    [onSelectJob],
  );

  // ── Bulk Generate with low-match gate ──
  const handleBulkGenerate = useCallback(() => {
    if (!onBulkGenerate || selectedIds.size === 0) return;

    const selected = sortedJobs
      .filter((j) => selectedIds.has(j.job_id))
      .map((j) => ({
        title: `${j.job_title} at ${j.employer_name}`,
        jd: stripHtml(j.job_description),
        matchScore: j.matchScore,
      }));

    const lowMatchJobs = selected.filter(
      (j) => j.matchScore !== undefined && j.matchScore < LOW_MATCH_THRESHOLD,
    );

    const proceed = () => {
      setLowMatchDialog(null);
      onBulkGenerate(
        selected.map((j) => ({ title: j.title, jd: j.jd })),
      );
    };

    if (lowMatchJobs.length > 0) {
      setLowMatchDialog({
        jobTitle: lowMatchJobs[0].title,
        matchScore: Math.min(...lowMatchJobs.map((j) => j.matchScore ?? 0)),
        lowMatchCount: lowMatchJobs.length,
        totalCount: selected.length,
        onProceed: proceed,
      });
      return;
    }

    proceed();
  }, [onBulkGenerate, selectedIds, sortedJobs]);

  const fetchJobs = useCallback(
    async (q: string, ctry: string, searchPage: number) => {
      if (!q || q.length < MIN_QUERY_LENGTH) return;

      // Check cache
      const cacheKey = `${q}|${ctry}|${searchPage}`;
      const cached = getCachedResults(cacheKey);
      if (cached) {
        const src = cached.source || "jsearch";
        setSource(src);
        setAllClientJobs(cached.data);
        setJobs(cached.data);
        setPage(searchPage);
        setHasSearched(true);
        setIsLoading(false);
        return;
      }

      // Abort any in-flight request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);
      setError(null);
      setHasSearched(true);

      try {
        const params = new URLSearchParams({
          q,
          country: ctry,
          page: String(searchPage),
        });
        const response = await fetch(`/api/jobs?${params}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Failed to search jobs.");
        }

        const data = await response.json();
        const src = data.source || "jsearch";
        const allJobs = data.jobs || [];

        setSource(src);
        setAllClientJobs(allJobs);
        setJobs(allJobs);
        setPage(searchPage);

        // Cache result
        searchCache.set(cacheKey, {
          data: allJobs,
          totalPages: data.totalPages || Math.ceil(allJobs.length / JOBS_PER_PAGE),
          source: src,
          ts: Date.now(),
        });
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError(
          err instanceof Error
            ? err.message
            : "Search failed. Please try again.",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // ── Fetch default/featured jobs on mount + whenever country changes ──
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const loadDefaults = async () => {
      setIsLoading(true);
      setDefaultJobs([]);
      try {
        const params = new URLSearchParams({
          q: DEFAULT_QUERY,
          country,
          page: "1",
        });
        // 12s client timeout — if server takes longer, show empty state gracefully
        const timer = setTimeout(() => controller.abort(), 12000);
        const response = await fetch(`/api/jobs?${params}`, { signal: controller.signal });
        clearTimeout(timer);
        if (response.ok && !cancelled) {
          const data = await response.json();
          setDefaultJobs(data.jobs || []);
          setSource(data.source || "jsearch");
        }
      } catch {
        // Silent fail for defaults — user can still search manually
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    // Reset to default view when country changes
    setIsDefaultView(true);
    setHasSearched(false);
    setJobs([]);
    setAllClientJobs([]);
    setQuery("");
    setPage(1);
    loadDefaults();

    return () => { cancelled = true; controller.abort(); };
  }, [country]);

  // Debounced live search: fires when query >= 3 chars
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const q = query.trim();
    if (q.length < MIN_QUERY_LENGTH) {
      // User cleared search — restore default view
      if (q.length === 0 && !isDefaultView) {
        setIsDefaultView(true);
        setHasSearched(false);
      }
      return;
    }

    debounceRef.current = setTimeout(() => {
      setIsDefaultView(false);
      setIsLoading(true); // Set loading immediately to prevent empty flash
      fetchJobs(q, country, 1);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, country, fetchJobs, isDefaultView]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (debounceRef.current) clearTimeout(debounceRef.current);
      const q = query.trim();
      if (q.length >= MIN_QUERY_LENGTH) {
        setIsDefaultView(false);
        setIsLoading(true);
        fetchJobs(q, country, 1);
      }
    },
    [fetchJobs, query, country],
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      setPage(newPage);
      // Scroll to top of job list
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [],
  );

  // Memoize the country options to avoid re-rendering
  const countryOptions = useMemo(
    () =>
      JOB_BOARD_COUNTRIES.map((c) => (
        <option key={c.code} value={c.code}>
          {c.label}
        </option>
      )),
    [],
  );

  const showJobs = sortedJobs.length > 0;
  const showEmptyDefault = isDefaultView && defaultJobs.length === 0 && !isLoading;
  // Only show "no results" after a completed search — never during typing or loading
  const isTyping = query.trim().length >= MIN_QUERY_LENGTH && !hasSearched;
  const showNoResults = !isDefaultView && hasSearched && !isLoading && !isTyping && jobs.length === 0 && allClientJobs.length === 0;

  return (
    <div className="relative pb-20">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Board</h1>
          <p className="mt-1 text-sm text-gray-500 sm:text-base">
            Search real jobs, then analyze your CV match or select multiple to bulk generate tailored CVs.
          </p>
        </div>

        {/* Sticky Bulk Generate button — top-right, always visible when jobs selected */}
        {onBulkGenerate && selectedIds.size > 0 && (
          <div className="sticky top-4 z-30 flex flex-shrink-0 items-center gap-2">
            <button
              onClick={clearSelection}
              className="rounded-lg border border-gray-200 px-2.5 py-2 text-xs text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              title="Clear selection"
            >
              Clear
            </button>
            <button
              onClick={handleBulkGenerate}
              className="animate-pulse-ring inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-blue-700"
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
                {selectedIds.size}
              </div>
              Bulk Generate
            </button>
          </div>
        )}
      </div>

      {/* Search form */}
      <form onSubmit={handleSubmit} className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by job title, keyword, or company..."
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {isLoading && (
            <svg
              className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-blue-500"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}
        </div>
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {countryOptions}
        </select>
      </form>

      {/* Resume match info banner */}
      {resumeText && showJobs && (
        <div className="mb-4 rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-2.5 text-sm text-indigo-700">
          Jobs are ranked by how well they match your uploaded resume. Higher match scores appear first.
        </div>
      )}

      {/* Selection hint */}
      {showJobs && onBulkGenerate && selectedIds.size === 0 && (
        <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-2.5 text-sm text-blue-700">
          <span className="font-medium">Tip:</span> Select up to {MAX_BULK_SELECT} jobs to bulk generate tailored CVs for each one.
        </div>
      )}

      {/* Typing hint */}
      {!hasSearched && isDefaultView && query.length > 0 && query.length < MIN_QUERY_LENGTH && (
        <p className="mb-4 text-center text-sm text-gray-400">
          Type {MIN_QUERY_LENGTH - query.length} more character
          {MIN_QUERY_LENGTH - query.length > 1 ? "s" : ""} to search...
        </p>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Section header with top pagination */}
      {showJobs && (
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
              {isDefaultView ? "Featured Jobs" : "Search Results"}
            </h2>
            {isLoading && (
              <div className="flex items-center gap-1.5 text-xs text-blue-500">
                <div className="h-3 w-3 animate-spin rounded-full border-[1.5px] border-blue-500 border-t-transparent" />
                Updating...
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">
              {allJobs.length} job{allJobs.length !== 1 ? "s" : ""}
              {resumeText ? " — sorted by match" : ""}
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1 || isLoading}
                  className="rounded-md border border-gray-200 p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Previous page"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="min-w-[3.5rem] text-center text-xs text-gray-500">
                  {page}/{totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages || isLoading}
                  className="rounded-md border border-gray-200 p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Next page"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Skeleton loading (no results yet) */}
      {isLoading && !showJobs && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <span className="text-sm text-gray-500">
              {isDefaultView ? "Loading featured jobs..." : "Searching..."}
            </span>
          </div>
          <JobSkeletonList count={6} />
        </div>
      )}

      {/* Empty state — no defaults loaded */}
      {showEmptyDefault && !query && (
        <div className="py-16 text-center">
          <svg
            className="mx-auto h-16 w-16 text-gray-200"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <p className="mt-4 text-lg font-medium text-gray-600">
            Find your next role
          </p>
          <p className="mt-1 text-sm text-gray-400">
            Search by job title, skill, or company name
          </p>
        </div>
      )}

      {/* No search results */}
      {showNoResults && (
        <div className="py-12 text-center text-gray-500">
          <svg
            className="mx-auto h-12 w-12 text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <p className="mt-3">
            No jobs found. Try a different search term or country.
          </p>
        </div>
      )}

      {/* ── Job listings ── */}
      <div className={`space-y-3 transition-opacity duration-200 ${isLoading && showJobs ? "opacity-60" : "opacity-100"}`}>
        {sortedJobs.map((job) => {
          const salary = formatSalary(job);
          const location = [job.job_city, job.job_state, job.job_country]
            .filter(Boolean)
            .join(", ");
          const isSelected = selectedIds.has(job.job_id);
          const canSelect = isSelected || selectedIds.size < MAX_BULK_SELECT;
          const scoreInfo = job.matchScore !== undefined
            ? matchScoreDisplay(job.matchScore)
            : null;

          return (
            <div
              key={job.job_id}
              className={`group rounded-xl border bg-white p-4 transition-all hover:shadow-sm ${
                isSelected
                  ? "border-blue-400 bg-blue-50/30 ring-1 ring-blue-200"
                  : "border-gray-200 hover:border-blue-200"
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                <div className="flex flex-1 min-w-0 gap-3 sm:gap-4">
                {/* Checkbox for multi-select */}
                {onBulkGenerate && (
                  <div className="flex flex-shrink-0 items-start pt-1">
                    <button
                      onClick={() => toggleSelect(job.job_id)}
                      disabled={!canSelect}
                      className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                        isSelected
                          ? "border-blue-600 bg-blue-600"
                          : canSelect
                            ? "border-gray-300 hover:border-blue-400"
                            : "cursor-not-allowed border-gray-200 opacity-50"
                      }`}
                      aria-label={isSelected ? "Deselect job" : "Select job"}
                    >
                      {isSelected && (
                        <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  </div>
                )}

                {/* Company logo placeholder */}
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100">
                  {job.employer_logo ? (
                    <img
                      src={job.employer_logo}
                      alt={job.employer_name}
                      className="h-8 w-8 rounded object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-lg font-bold text-gray-400">
                      {job.employer_name?.[0] || "?"}
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="truncate font-semibold text-gray-900">
                      {job.job_title}
                    </h3>
                    {/* Match score badge */}
                    {scoreInfo && job.matchScore !== undefined && (
                      <span
                        className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${scoreInfo.bgClass} ${scoreInfo.colorClass}`}
                      >
                        {job.matchScore}% {scoreInfo.label}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{job.employer_name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    {location && <span>{location}</span>}
                    {salary && (
                      <>
                        <span className="text-gray-300">|</span>
                        <span className="font-medium text-green-600">
                          {salary}
                        </span>
                      </>
                    )}
                    {job.job_employment_type && (
                      <>
                        <span className="text-gray-300">|</span>
                        <span>
                          {job.job_employment_type.replace("_", " ")}
                        </span>
                      </>
                    )}
                    {job.job_posted_at_datetime_utc && (
                      <>
                        <span className="text-gray-300">|</span>
                        <span>{timeAgo(job.job_posted_at_datetime_utc)}</span>
                      </>
                    )}
                  </div>
                </div>
                </div>

                {/* Primary CTA */}
                <div className="flex flex-shrink-0 items-center sm:self-center self-end">
                  <button
                    onClick={() => handleQuickAnalyze(job)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Quick Analyze
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1 || isLoading}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages || isLoading}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* ── Floating Bulk Generate Bar (bottom) ── */}
      {onBulkGenerate && selectedIds.size > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 px-3 py-2.5 shadow-lg backdrop-blur-sm sm:px-4 sm:py-3">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 sm:h-8 sm:w-8 sm:text-sm">
                {selectedIds.size}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">
                  {selectedIds.size} job{selectedIds.size !== 1 ? "s" : ""} selected
                </p>
                <p className="hidden text-xs text-gray-500 sm:block">
                  A tailored CV will be generated for each
                </p>
              </div>
            </div>
            <div className="flex flex-shrink-0 items-center gap-2 sm:gap-3">
              <button
                onClick={clearSelection}
                className="text-xs text-gray-500 hover:text-gray-700 sm:text-sm"
              >
                Clear
              </button>
              <button
                onClick={handleBulkGenerate}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 sm:gap-2 sm:px-5 sm:py-2.5 sm:text-sm"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Bulk Generate CVs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Low Match Permission Dialog ── */}
      {lowMatchDialog && (
        <LowMatchDialog
          jobTitle={lowMatchDialog.jobTitle}
          matchScore={lowMatchDialog.matchScore}
          lowMatchCount={lowMatchDialog.lowMatchCount}
          totalCount={lowMatchDialog.totalCount}
          onConfirm={lowMatchDialog.onProceed}
          onCancel={() => setLowMatchDialog(null)}
        />
      )}
    </div>
  );
}
