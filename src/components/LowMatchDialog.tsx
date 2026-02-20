"use client";

interface LowMatchDialogProps {
  jobTitle: string;
  matchScore: number;
  /** How many low-match jobs (for bulk mode) */
  lowMatchCount?: number;
  totalCount?: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function LowMatchDialog({
  jobTitle,
  matchScore,
  lowMatchCount,
  totalCount,
  onConfirm,
  onCancel,
}: LowMatchDialogProps) {
  const isBulk = (lowMatchCount ?? 0) > 0 && (totalCount ?? 0) > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 max-w-md rounded-2xl bg-white p-6 shadow-xl animate-slide-up-in">
        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-100">
            <svg
              className="h-5 w-5 text-amber-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              Low Match Detected
            </h3>
            <p className="text-sm text-gray-500">
              {isBulk
                ? `${lowMatchCount} of ${totalCount} selected job${totalCount !== 1 ? "s" : ""} have low match scores`
                : `${matchScore}% match with this role`}
            </p>
          </div>
        </div>

        {/* Explanation */}
        <p className="mb-3 text-sm text-gray-700">
          {isBulk ? (
            <>
              Some of your selected jobs have limited overlap with your resume.
              We can still generate tailored CVs by:
            </>
          ) : (
            <>
              Your resume has limited overlap with{" "}
              <span className="font-medium">&ldquo;{jobTitle}&rdquo;</span>.
              We can still help by:
            </>
          )}
        </p>

        <ul className="mb-5 space-y-2 text-sm text-gray-600">
          {[
            "Highlighting your transferable skills relevant to this role",
            "Reframing your existing experience to match the job description",
            "Identifying key gaps you could address to strengthen your application",
          ].map((text) => (
            <li key={text} className="flex items-start gap-2">
              <svg
                className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              {text}
            </li>
          ))}
        </ul>

        <p className="mb-5 text-xs text-gray-400 italic">
          Everyone deserves a chance. We&apos;ll work with what you have and
          make it shine.
        </p>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
          >
            Enhance &amp; Generate
          </button>
        </div>
      </div>
    </div>
  );
}
