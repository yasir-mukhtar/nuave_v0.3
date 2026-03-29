'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useOrgPlan } from '@/hooks/useOrgPlan';
import { getSubscriptionWarning, getPlanLabel } from '@/lib/plan-gate-client';
import { isPaidPlan } from '@/lib/plan-limits';
import { IconSparkles, IconAlertTriangle, IconX } from '@tabler/icons-react';
import { cn } from '@/lib/utils';

export default function PlanUpgradeBanner() {
  const { plan, subscriptionStatus, cancelAtPeriodEnd, currentPeriodEnd, loading } = useOrgPlan();
  const [dismissed, setDismissed] = useState(false);

  if (loading || dismissed) return null;

  // Check for subscription warnings first (past_due, expiring, etc.)
  const warning = getSubscriptionWarning(subscriptionStatus, cancelAtPeriodEnd, currentPeriodEnd);

  if (warning) {
    const isPastDue = subscriptionStatus === 'past_due';
    const isExpired = subscriptionStatus === 'expired';

    return (
      <div
        className={cn(
          'relative box-border flex w-full items-center justify-center gap-4 px-6 py-2.5',
          isPastDue || isExpired
            ? 'border-b border-red-200 bg-red-50'
            : 'border-b border-amber-200 bg-amber-50'
        )}
      >
        <div className="flex items-center gap-2.5">
          <IconAlertTriangle
            size={16}
            className={cn(isPastDue || isExpired ? 'text-red-900' : 'text-amber-800')}
          />
          <p
            className={cn(
              'm-0 type-body',
              isPastDue || isExpired ? 'text-red-900' : 'text-amber-800'
            )}
          >
            {warning}
          </p>
          {(isPastDue || isExpired) && (
            <Link
              href="/harga"
              className="ml-1 whitespace-nowrap rounded-sm bg-error px-3.5 py-1 type-body font-semibold text-white no-underline"
            >
              {isExpired ? 'Pilih paket' : 'Perbarui pembayaran'} →
            </Link>
          )}
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="absolute right-4 top-1/2 -translate-y-1/2 border-none bg-transparent p-1 cursor-pointer text-amber-600"
        >
          <IconX size={16} />
        </button>
      </div>
    );
  }

  // Free tier upgrade prompt
  if (!isPaidPlan(plan)) {
    return (
      <div className="relative box-border flex w-full items-center justify-center gap-4 border-b border-brand/20 bg-brand/5 px-6 py-2.5">
        <div className="flex items-center gap-2.5">
          <IconSparkles size={16} className="text-brand" />
          <p className="m-0 type-body text-brand">
            Upgrade ke Starter untuk monitoring harian, audit bulanan, dan fitur lengkap.
          </p>
          <Link
            href="/harga"
            className="ml-1 whitespace-nowrap rounded-sm bg-brand px-3.5 py-1 type-body font-semibold text-white no-underline"
          >
            Lihat paket →
          </Link>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="absolute right-4 top-1/2 -translate-y-1/2 border-none bg-transparent p-1 cursor-pointer text-brand"
        >
          <IconX size={16} />
        </button>
      </div>
    );
  }

  // Paid users with no warnings — no banner
  return null;
}
