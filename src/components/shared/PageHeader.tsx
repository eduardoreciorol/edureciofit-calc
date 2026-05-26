"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  backHref?: string;
  right?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, backHref, right, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex items-center h-14 px-4 bg-[#09090B]/90 backdrop-blur border-b border-[#27272A]",
        className
      )}
    >
      {backHref ? (
        <Link
          href={backHref}
          className="mr-3 p-1 -ml-1 rounded-md text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#18181B] transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
      ) : (
        <Image
          src="/logo-horizontal.png"
          alt="Creando Gigantes"
          width={110}
          height={28}
          className="object-contain mr-3 flex-shrink-0"
          priority
        />
      )}

      <h1 className="flex-1 text-[15px] font-semibold text-[#FAFAFA] truncate">
        {title}
      </h1>

      {right && <div className="ml-3">{right}</div>}
    </header>
  );
}
