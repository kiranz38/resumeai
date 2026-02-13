interface KeywordListProps {
  matched: string[];
  missing: string[];
}

export default function KeywordList({ matched, missing }: KeywordListProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">Keywords</h3>

      {missing.length > 0 && (
        <div className="mb-4">
          <h4 className="mb-2 text-sm font-medium text-red-700">Missing Keywords</h4>
          <div className="flex flex-wrap gap-2">
            {missing.map((keyword, i) => (
              <span
                key={i}
                className="inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700 ring-1 ring-red-200"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      {matched.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-medium text-green-700">Matched Keywords</h4>
          <div className="flex flex-wrap gap-2">
            {matched.map((keyword, i) => (
              <span
                key={i}
                className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 ring-1 ring-green-200"
              >
                <svg className="mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      {matched.length === 0 && missing.length === 0 && (
        <p className="text-sm text-gray-500">No keywords detected. Try providing a more detailed job description.</p>
      )}
    </div>
  );
}
