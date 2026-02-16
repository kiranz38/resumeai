import type { RadarBlocker } from "@/lib/types";

interface BlockerCardProps {
  blocker: RadarBlocker;
  index: number;
  locked?: boolean;
  /** Blur the fix & before/after but keep title + why visible (for free tier card 1) */
  blurFix?: boolean;
}

export default function BlockerCard({ blocker, index, locked = false, blurFix = false }: BlockerCardProps) {
  return (
    <div className={`relative rounded-xl border border-gray-200 bg-white p-5 ${locked ? "min-h-[180px] select-none overflow-hidden" : ""}`}>
      {/* Header */}
      <div className="mb-2 flex items-start gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-700">
          {index + 1}
        </span>
        <h4 className="text-sm font-semibold text-gray-900">{blocker.title}</h4>
      </div>

      {/* Why — always visible */}
      <p className="mb-2 text-sm text-gray-500">{blocker.why}</p>

      {/* How — blurred on free tier first card */}
      <div className="mb-2 rounded-lg bg-blue-50 px-3 py-2">
        <p className={`text-sm text-blue-800 ${blurFix ? "blur-[5px] select-none" : ""}`}>
          <span className="font-semibold">Fix: </span>
          {blocker.how}
        </p>
      </div>

      {/* Before/After — blurred on free tier first card */}
      {blocker.beforeAfter && (
        <div className={`mt-3 space-y-1.5 ${blurFix ? "blur-[5px] select-none" : ""}`}>
          <div className="rounded-lg bg-red-50 px-3 py-2">
            <span className="text-xs font-bold uppercase text-red-500">Before</span>
            <p className="mt-0.5 text-sm text-gray-600 line-through decoration-red-300">
              {blocker.beforeAfter.before}
            </p>
          </div>
          <div className="rounded-lg bg-green-50 px-3 py-2">
            <span className="text-xs font-bold uppercase text-green-600">After</span>
            <p className="mt-0.5 text-sm font-medium text-gray-900">
              {blocker.beforeAfter.after}
            </p>
          </div>
        </div>
      )}

      {/* Unlock hint on blurred first card */}
      {blurFix && !locked && (
        <div className="mt-3 text-center">
          <p className="text-xs font-semibold text-blue-600">Unlock to see the fix</p>
        </div>
      )}

      {/* Gradient fade overlay for fully locked cards (2nd & 3rd) */}
      {locked && (
        <div className="absolute inset-0 z-10 flex flex-col justify-end rounded-xl"
          style={{
            background: "linear-gradient(to bottom, transparent 35%, rgba(255,255,255,0.85) 55%, rgba(255,255,255,1) 70%)",
          }}
        >
          <div className="px-5 pb-5 text-center">
            <svg className="mx-auto h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <p className="mt-1 text-sm font-semibold text-blue-700">
              Unlock detailed fixes &mdash; Pro
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
