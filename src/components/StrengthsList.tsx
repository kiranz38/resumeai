interface StrengthsListProps {
  strengths: string[];
}

export default function StrengthsList({ strengths }: StrengthsListProps) {
  if (strengths.length === 0) return null;

  return (
    <div className="rounded-xl border border-green-200 bg-green-50 p-6">
      <h3 className="mb-3 text-lg font-semibold text-green-900">Strengths</h3>
      <ul className="space-y-2">
        {strengths.map((strength, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-green-800">
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {strength}
          </li>
        ))}
      </ul>
    </div>
  );
}
