interface RewritePreviewsProps {
  previews: Array<{
    original: string;
    improved: string;
  }>;
}

export default function RewritePreviews({ previews }: RewritePreviewsProps) {
  if (previews.length === 0) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Rewrite Suggestions</h3>
        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
          Free Preview
        </span>
      </div>
      <p className="mb-4 text-sm text-gray-500">
        Here are sample rewrites to make your bullets more impactful. Upgrade to Pro for all rewrites.
      </p>
      <div className="space-y-4">
        {previews.map((preview, i) => (
          <div key={i} className="rounded-lg border border-gray-100 bg-gray-50 p-4">
            <div className="mb-3">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Before</span>
              <p className="mt-1 text-sm text-gray-600 line-through decoration-red-300">
                {preview.original}
              </p>
            </div>
            <div>
              <span className="text-xs font-medium text-green-600 uppercase tracking-wide">After</span>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {preview.improved}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
