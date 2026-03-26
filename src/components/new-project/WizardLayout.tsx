"use client";

import Link from "next/link";
import { IconX } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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
          <span className="type-title text-text-heading">
            Nuave
          </span>
        </Link>

        <Button variant="default" size="icon" onClick={onClose} aria-label="Tutup">
          <IconX size={20} stroke={1.5} />
        </Button>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-[520px] px-6 pb-20 pt-10">
        {/* Step indicator */}
        <div className="mb-10">
          <p className="mb-2 type-caption text-text-muted">
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
