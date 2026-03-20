"use client";

import Link from "next/link";
import { IconX } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

const LOGO_SVG = "https://framerusercontent.com/images/r9wYEZlQeEIZBKytCeKUn5f1QGw.svg";

interface WizardLayoutProps {
  currentStep: number;
  totalSteps: number;
  children: React.ReactNode;
  onClose?: () => void;
}

export default function WizardLayout({ currentStep, totalSteps, children, onClose }: WizardLayoutProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5">
        <Link href="/" className="flex items-center gap-2 no-underline">
          <img src={LOGO_SVG} alt="Nuave" width={28} height={28} className="object-contain" />
          <span className="font-heading text-xl font-semibold text-text-heading">
            Nuave
          </span>
        </Link>

        <button
          onClick={onClose}
          aria-label="Tutup"
          className="flex h-10 w-10 items-center justify-center rounded-md border border-border-default bg-transparent text-text-body transition-colors duration-150 hover:border-border-strong hover:bg-surface active:bg-surface-raised cursor-pointer"
        >
          <IconX size={20} stroke={1.5} />
        </button>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-[520px] px-6 pb-20 pt-10">
        {/* Step indicator */}
        <div className="mb-10">
          <p className="mb-2 font-body text-[13px] leading-4 text-text-muted">
            Langkah {currentStep}/{totalSteps}
          </p>
          <div className="flex gap-1.5">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-sm transition-colors duration-200",
                  i < currentStep ? "bg-brand" : "bg-border-default"
                )}
              />
            ))}
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}
