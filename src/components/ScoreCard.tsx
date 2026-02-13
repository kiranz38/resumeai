interface ScoreCardProps {
  label: string;
  score: number;
  description: string;
}

function getScoreColor(score: number): { bg: string; text: string; ring: string } {
  if (score >= 75) return { bg: "bg-green-50", text: "text-green-700", ring: "stroke-green-500" };
  if (score >= 50) return { bg: "bg-yellow-50", text: "text-yellow-700", ring: "stroke-yellow-500" };
  return { bg: "bg-red-50", text: "text-red-700", ring: "stroke-red-500" };
}

export default function ScoreCard({ label, score, description }: ScoreCardProps) {
  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));
  const colors = getScoreColor(clampedScore);

  // SVG circle parameters
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clampedScore / 100) * circumference;

  return (
    <div className={`rounded-xl border border-gray-200 ${colors.bg} p-5`}>
      <div className="flex items-center gap-4">
        <div className="relative h-20 w-20 shrink-0">
          <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
            <circle
              cx="40"
              cy="40"
              r={radius}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="6"
            />
            <circle
              cx="40"
              cy="40"
              r={radius}
              fill="none"
              className={colors.ring}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-lg font-bold ${colors.text}`}>{clampedScore}</span>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{label}</h3>
          <p className="mt-0.5 text-xs text-gray-500">{description}</p>
        </div>
      </div>
    </div>
  );
}
