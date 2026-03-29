'use client';

import Link from 'next/link';
import { type PlanId } from '@/lib/plan-limits';
import { getPlanLabel } from '@/lib/plan-gate-client';
import { Button } from '@/components/ui/button';
import { IconArrowUpRight } from '@tabler/icons-react';

interface UpgradeCTAProps {
  target: PlanId;
  size?: 'sm' | 'default';
  className?: string;
}

/**
 * Reusable upgrade call-to-action button that links to the pricing page.
 */
export function UpgradeCTA({ target, size = 'default', className }: UpgradeCTAProps) {
  const label = getPlanLabel(target);

  return (
    <Button variant="brand" size={size} asChild className={className}>
      <Link href="/harga">
        Upgrade ke {label}
        <IconArrowUpRight size={16} />
      </Link>
    </Button>
  );
}
