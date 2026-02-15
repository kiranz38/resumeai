"use client";

import { forwardRef } from "react";

interface DashboardTileProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
  disabled?: boolean;
  comingSoon?: boolean;
  onClick?: () => void;
}

const DashboardTile = forwardRef<HTMLButtonElement, DashboardTileProps>(
  function DashboardTile(
    { icon, title, description, badge, disabled, comingSoon, onClick },
    ref,
  ) {
    return (
      <button
        ref={ref}
        onClick={onClick}
        disabled={disabled || comingSoon}
        className={`group flex w-full flex-col items-start rounded-xl border border-gray-200 bg-white p-6 text-left transition-all ${
          disabled || comingSoon
            ? "cursor-not-allowed opacity-60"
            : "hover:-translate-y-0.5 hover:shadow-md"
        }`}
      >
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100">
          {icon}
        </div>
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
        {(badge || comingSoon) && (
          <span
            className={`mt-3 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
              comingSoon
                ? "bg-gray-100 text-gray-500"
                : "bg-blue-50 text-blue-700"
            }`}
          >
            {comingSoon ? "Coming soon" : badge}
          </span>
        )}
      </button>
    );
  },
);

export default DashboardTile;
