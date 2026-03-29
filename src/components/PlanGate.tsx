'use client';

import { type ReactNode } from 'react';
import { type PlanId } from '@/lib/plan-limits';
import { canAccess, type ClientPlanCheckResult } from '@/lib/plan-gate-client';
import { IconLock } from '@tabler/icons-react';
import { UpgradeCTA } from './UpgradeCTA';

type Feature = Parameters<typeof canAccess>[1];

interface PlanGateProps {
  plan: PlanId;
  feature: Feature;
  children: ReactNode;
  /** Show a compact inline lock instead of overlay (for small elements) */
  inline?: boolean;
  /** Custom locked message */
  message?: string;
  /** While true, show children ungated (prevents flash-of-lock on page load) */
  loading?: boolean;
}

/**
 * Wraps children with a lock overlay when the feature is not available on the plan.
 * Pass `inline` for small elements (badges, buttons) that should show a lock icon instead.
 */
export function PlanGate({ plan, feature, children, inline, message, loading }: PlanGateProps) {
  const access = canAccess(plan, feature);

  // While plan is loading, show children ungated to avoid flash-of-lock for paid users
  if (loading || access.allowed) {
    return <>{children}</>;
  }

  if (inline) {
    return (
      <span className="inline-flex items-center gap-1 text-text-tertiary">
        <IconLock size={14} />
        <span className="type-caption">{message ?? access.reason}</span>
      </span>
    );
  }

  return (
    <div className="relative">
      {/* Blurred content behind */}
      <div className="pointer-events-none select-none blur-[2px] opacity-50">
        {children}
      </div>

      {/* Lock overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-lg bg-surface/80 backdrop-blur-[1px]">
        <div className="flex items-center gap-2 text-text-secondary">
          <IconLock size={20} />
          <span className="type-body font-medium">
            {message ?? access.reason}
          </span>
        </div>
        {access.upgradeTarget && (
          <UpgradeCTA target={access.upgradeTarget} size="sm" />
        )}
      </div>
    </div>
  );
}
