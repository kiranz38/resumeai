"use client";

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { JOB_BOARD_COUNTRIES } from "@/lib/constants";

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

interface JobBoardProps {
  onSelectJob: (jdText: string) => void;
}

// Simple in-memory cache for search results
const searchCache = new Map<
  string,
  { data: JobListing[]; totalPages: number; ts: number }
>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes client-side

function getCachedResults(key: string) {
  const cached = searchCache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached;
  return null;
}

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

const DEBOUNCE_MS = 400;
const MIN_QUERY_LENGTH = 3;

/** Strip HTML tags and decode entities to plain text */
function stripHtml(html: string): string {
  if (typeof document !== "undefined") {
    const div = document.createElement("div");
    div.innerHTML = html;
    return (div.textContent || div.innerText || "").trim();
  }
  // SSR fallback: regex strip
  return html
    .replace(/<[^>]*>/g, "\n")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export default function JobBoard({ onSelectJob }: JobBoardProps) {
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("us");
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchJobs = useCallback(
    async (q: string, ctry: string, searchPage: number) => {
      if (!q || q.length < MIN_QUERY_LENGTH) return;

      // Check cache
      const cacheKey = `${q}|${ctry}|${searchPage}`;
      const cached = getCachedResults(cacheKey);
      if (cached) {
        setJobs(cached.data);
        setTotalPages(cached.totalPages);
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
        setJobs(data.jobs || []);
        setTotalPages(data.totalPages || 0);
        setPage(searchPage);

        // Cache result
        searchCache.set(cacheKey, {
          data: data.jobs || [],
          totalPages: data.totalPages || 0,
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

  // Debounced live search: fires when query >= 3 chars
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const q = query.trim();
    if (q.length < MIN_QUERY_LENGTH) {
      // Clear results if user deletes back below threshold
      if (hasSearched && q.length === 0) {
        setJobs([]);
        setHasSearched(false);
        setTotalPages(0);
      }
      return;
    }

    debounceRef.current = setTimeout(() => {
      fetchJobs(q, country, 1);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, country, fetchJobs, hasSearched]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (debounceRef.current) clearTimeout(debounceRef.current);
      fetchJobs(query.trim(), country, 1);
    },
    [fetchJobs, query, country],
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      fetchJobs(query.trim(), country, newPage);
    },
    [fetchJobs, query, country],
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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Job Board</h1>
        <p className="mt-1 text-gray-500">
          Start typing to search real jobs, then analyze your CV match instantly.
        </p>
      </div>

      {/* Search form */}
      <form onSubmit={handleSubmit} className="mb-6 flex gap-3">
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
            placeholder="Start typing a job title, keyword, or company..."
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

      {/* Typing hint */}
      {!hasSearched && query.length > 0 && query.length < MIN_QUERY_LENGTH && (
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

      {/* Empty state */}
      {!hasSearched && !query && (
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

      {/* No results */}
      {hasSearched && !isLoading && jobs.length === 0 && (
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

      {/* Results */}
      <div className="space-y-3">
        {jobs.map((job) => {
          const salary = formatSalary(job);
          const location = [job.job_city, job.job_state, job.job_country]
            .filter(Boolean)
            .join(", ");

          return (
            <div
              key={job.job_id}
              className="group rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-blue-200 hover:shadow-sm"
            >
              <div className="flex gap-4">
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
                  <h3 className="font-semibold text-gray-900">
                    {job.job_title}
                  </h3>
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

                {/* Primary CTA — Analyze CV Match */}
                <div className="flex flex-shrink-0 items-center">
                  <button
                    onClick={() => onSelectJob(stripHtml(job.job_description))}
                    className="animate-pulse-ring inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
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
                    Analyze CV Match
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
    </div>
  );
}
