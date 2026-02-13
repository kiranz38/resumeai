interface GapsListProps {
  gaps: string[];
}

export default function GapsList({ gaps }: GapsListProps) {
  if (gaps.length === 0) return null;

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6">
      <h3 className="mb-3 text-lg font-semibold text-red-900">Gaps &amp; Fixes</h3>
      <ul className="space-y-2">
        {gaps.map((gap, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-red-800">
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            {gap}
          </li>
        ))}
      </ul>
    </div>
  );
}
