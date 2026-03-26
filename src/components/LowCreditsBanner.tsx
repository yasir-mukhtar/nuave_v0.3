"use client";

import Link from "next/link";
import { useState } from "react";
import { useCreditsBalance } from "@/hooks/useCreditsBalance";
import { IconCoins, IconX } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

export default function LowCreditsBanner() {
  const { credits } = useCreditsBalance();
  const [dismissed, setDismissed] = useState(false);

  if (credits === null || credits > 5 || dismissed) return null;

  const isEmpty = credits === 0;

  return (
    <div
      className={cn(
        "relative box-border flex w-full items-center justify-center gap-4 px-6 py-2.5",
        isEmpty
          ? "border-b border-red-200 bg-red-50"
          : "border-b border-amber-200 bg-amber-50"
      )}
    >
      {/* Centered content */}
      <div className="flex items-center gap-2.5">
        <IconCoins
          size={16}
          className={cn(isEmpty ? "text-red-900" : "text-amber-800")}
        />
        <p
          className={cn(
            "m-0 type-body",
            isEmpty ? "text-red-900" : "text-amber-800"
          )}
        >
          {isEmpty
            ? "Kredit kamu sudah habis. Beli kredit untuk melanjutkan audit dan fitur lainnya."
            : `Kredit kamu hampir habis — tersisa ${credits} kredit.`}
        </p>
        <Link
          href="/dashboard/credits"
          className={cn(
            "ml-1 whitespace-nowrap rounded-sm px-3.5 py-1 type-body font-semibold text-white no-underline",
            isEmpty ? "bg-error" : "bg-amber-600"
          )}
        >
          Beli kredit →
        </Link>
      </div>

      {/* Dismiss button */}
      <button
        onClick={() => setDismissed(true)}
        className={cn(
          "absolute right-4 top-1/2 -translate-y-1/2 border-none bg-transparent p-1 cursor-pointer",
          isEmpty ? "text-error" : "text-amber-600"
        )}
      >
        <IconX size={16} />
      </button>
    </div>
  );
}
