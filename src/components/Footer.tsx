import Link from "next/link";
import { LEGAL_DISCLAIMER } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="bg-gray-900">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Legal disclaimer */}
        <p className="mb-6 rounded-md bg-gray-800 border border-gray-700 px-4 py-3 text-sm text-gray-400">
          {LEGAL_DISCLAIMER}
        </p>

        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <span className="font-[family-name:var(--font-caveat)] text-lg font-bold text-white/70 tracking-wide">
              Resume Mate
            </span>
            <span className="text-xs text-gray-600">
              &copy; {new Date().getFullYear()}
            </span>
          </div>
          <nav className="flex gap-4">
            <Link href="/privacy" className="text-sm text-gray-500 transition-colors hover:text-gray-300">
              Privacy
            </Link>
            <Link href="/terms" className="text-sm text-gray-500 transition-colors hover:text-gray-300">
              Terms
            </Link>
            <Link href="/contact" className="text-sm text-gray-500 transition-colors hover:text-gray-300">
              Contact
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
