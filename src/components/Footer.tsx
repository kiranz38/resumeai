import Link from "next/link";
import { LEGAL_DISCLAIMER, SITE_NAME } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Legal disclaimer */}
        <p className="mb-6 rounded-md bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800">
          {LEGAL_DISCLAIMER}
        </p>

        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
          </p>
          <nav className="flex gap-4">
            <Link href="/privacy" className="text-sm text-gray-500 hover:text-gray-700">
              Privacy
            </Link>
            <Link href="/terms" className="text-sm text-gray-500 hover:text-gray-700">
              Terms
            </Link>
            <Link href="/contact" className="text-sm text-gray-500 hover:text-gray-700">
              Contact
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
