"use client";

import { forwardRef } from "react";

interface DashboardTileProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
  disabled?: boolean;
  comingSoon?: boolean;
  variant?: "default" | "dark";
  onClick?: () => void;
}

const DashboardTile = forwardRef<HTMLButtonElement, DashboardTileProps>(
  function DashboardTile(
    { icon, title, description, badge, disabled, comingSoon, variant = "default", onClick },
    ref,
  ) {
    const isDark = variant === "dark";

    return (
      <button
        ref={ref}
        onClick={onClick}
        disabled={disabled || comingSoon}
        className={`group flex w-full flex-col items-start rounded-xl border p-6 text-left transition-all ${
          isDark
            ? "border-blue-800 bg-[#1a2744]"
            : "border-gray-200 bg-white"
        } ${
          disabled || comingSoon
            ? "cursor-not-allowed opacity-60"
            : "hover:-translate-y-0.5 hover:shadow-md"
        }`}
      >
        <div
          className={`mb-4 flex h-12 w-12 items-center justify-center rounded-lg ${
            isDark
              ? "bg-blue-500/20 text-blue-300 group-hover:bg-blue-500/30"
              : "bg-blue-50 text-primary group-hover:bg-blue-100"
          }`}
        >
          {icon}
        </div>
        <h3
          className={`text-base font-semibold ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          {title}
        </h3>
        <p
          className={`mt-1 text-sm ${
            isDark ? "text-blue-200/70" : "text-gray-500"
          }`}
        >
          {description}
        </p>
        {(badge || comingSoon) && (
          <span
            className={`mt-3 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
              comingSoon
                ? "bg-gray-100 text-gray-500"
                : isDark
                  ? "bg-blue-500/20 text-blue-300"
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
