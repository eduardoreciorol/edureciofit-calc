"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  {
    href: "/swap",
    label: "Intercambiar",
    icon: (active: boolean) => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={cn("h-5 w-5", active ? "text-[#3B82F6]" : "text-[#A1A1AA]")}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"
        />
      </svg>
    ),
  },
  {
    href: "/receta",
    label: "Receta",
    icon: (active: boolean) => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={cn("h-5 w-5", active ? "text-[#3B82F6]" : "text-[#A1A1AA]")}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      </svg>
    ),
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#18181B] border-t border-[#27272A] pb-safe">
      <div className="flex h-16 max-w-[480px] mx-auto">
        {tabs.map((tab) => {
          const active = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors",
                active ? "text-[#3B82F6]" : "text-[#A1A1AA] hover:text-[#FAFAFA]"
              )}
            >
              {tab.icon(active)}
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
