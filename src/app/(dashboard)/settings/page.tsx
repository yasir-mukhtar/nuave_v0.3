'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useActiveWorkspace } from '@/hooks/useActiveWorkspace';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from '@/components/ui/navigation-menu';
import { IconPencil, IconCheck, IconX, IconArrowUpRight, IconReceipt, IconLoader2 } from '@tabler/icons-react';
import type { Organization } from '@/types';
import { useOrgPlan } from '@/hooks/useOrgPlan';
import { getPlanLabel } from '@/lib/plan-gate-client';
import { isPaidPlan } from '@/lib/plan-limits';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface BillingEvent {
  id: string;
  event_type: string;
  midtrans_order_id: string | null;
  payload: Record<string, unknown>;
  created_at: string;
}

interface RefundRequest {
  id: string;
  amount: number;
  status: string;
  reason: string;
  created_at: string;
}

function formatEventLabel(type: string): string {
  switch (type) {
    case 'webhook_settlement':
    case 'webhook_capture':
      return 'Pembayaran berhasil';
    case 'subscription_cancelled':
      return 'Langganan dibatalkan';
    case 'plan_upgrade':
      return 'Upgrade paket';
    case 'plan_downgrade_scheduled':
      return 'Downgrade dijadwalkan';
    default:
      return type.replace(/_/g, ' ');
  }
}

function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
}

type SectionId = 'profil' | 'workspace' | 'langganan';

const sections: { id: SectionId; label: string }[] = [
  { id: 'profil', label: 'Profil' },
  { id: 'workspace', label: 'Workspace' },
  { id: 'langganan', label: 'Langganan' },
];

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const validTabs: SectionId[] = ['profil', 'workspace', 'langganan'];

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><span className="type-body text-text-muted">Memuat...</span></div>}>
      <SettingsContent />
    </Suspense>
  );
}

function SettingsContent() {
  const supabase = createSupabaseBrowserClient();
  const searchParams = useSearchParams();
  const { activeWorkspaceId, refreshWorkspaces } = useActiveWorkspace();

  const [user, setUser] = useState<{ email: string; full_name: string } | null>(null);
  const [org, setOrg] = useState<Organization | null>(null);
  const [workspaceName, setWorkspaceName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<{ events: BillingEvent[]; refunds: RefundRequest[] } | null>(null);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const orgPlan = useOrgPlan();
  const tabParam = searchParams.get('tab') as SectionId | null;
  const [activeTab, setActiveTab] = useState<SectionId>(
    tabParam && validTabs.includes(tabParam) ? tabParam : 'profil'
  );

  useEffect(() => {
    async function load() {
      setLoading(true);

      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const { data: profile } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', authUser.id)
        .maybeSingle();

      setUser({ email: authUser.email ?? '', full_name: profile?.full_name ?? '' });

      const { data: omData } = await supabase
        .from('organization_members')
        .select('org_id, organizations(id, name, slug, plan, credits_balance, subscription_status, billing_cycle, plan_started_at, current_period_start, current_period_end, cancel_at_period_end, cancelled_at, pending_plan, created_at, updated_at)')
        .eq('user_id', authUser.id)
        .limit(1)
        .maybeSingle();

      const orgRow = (omData?.organizations as unknown) as Organization | null;
      if (orgRow) setOrg(orgRow);

      if (activeWorkspaceId) {
        const { data: ws } = await supabase
          .from('workspaces')
          .select('name')
          .eq('id', activeWorkspaceId)
          .maybeSingle();
        if (ws) setWorkspaceName(ws.name);
      }

      setLoading(false);
    }

    load();
  }, [activeWorkspaceId]);

  useEffect(() => {
    if (activeTab !== 'langganan') return;
    let cancelled = false;
    async function fetchInvoices() {
      setInvoicesLoading(true);
      try {
        const res = await fetch('/api/billing/invoices');
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setInvoices(data);
        }
      } finally {
        if (!cancelled) setInvoicesLoading(false);
      }
    }
    fetchInvoices();
    return () => { cancelled = true; };
  }, [activeTab]);

  async function saveWorkspaceName() {
    if (!activeWorkspaceId || !draftName.trim()) return;
    setSaving(true);
    await supabase
      .from('workspaces')
      .update({ name: draftName.trim() })
      .eq('id', activeWorkspaceId);
    setWorkspaceName(draftName.trim());
    setEditingName(false);
    setSaving(false);
    refreshWorkspaces();
  }

  function startEditing() {
    setDraftName(workspaceName);
    setEditingName(true);
  }

  function cancelEditing() {
    setEditingName(false);
    setDraftName('');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="type-body text-text-muted">Memuat...</span>
      </div>
    );
  }

  return (
    <div className="flex max-w-[720px] flex-col gap-6">
      {/* Page title */}
      <h1 className="type-heading-sm text-text-heading m-0">Pengaturan</h1>

      {/* Navigation */}
      <NavigationMenu>
        <NavigationMenuList>
          {sections.map((s) => (
            <NavigationMenuItem key={s.id}>
              <NavigationMenuLink
                active={activeTab === s.id}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab(s.id);
                }}
                className="cursor-pointer"
              >
                {s.label}
              </NavigationMenuLink>
            </NavigationMenuItem>
          ))}
        </NavigationMenuList>
      </NavigationMenu>

      {/* ── Profil ──────────────────────────────────────── */}
      {activeTab === 'profil' && (
        <div className="card flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <span className="type-caption font-medium text-text-muted">Nama</span>
            <span className="type-body text-text-heading">{user?.full_name || '-'}</span>
          </div>
          <div className="h-px bg-[var(--border-light)]" />
          <div className="flex flex-col gap-1">
            <span className="type-caption font-medium text-text-muted">Email</span>
            <span className="type-body text-text-heading">{user?.email || '-'}</span>
          </div>
        </div>
      )}

      {/* ── Workspace ───────────────────────────────────── */}
      {activeTab === 'workspace' && (
        <div className="card flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <span className="type-caption font-medium text-text-muted">Organisasi</span>
            <span className="type-body text-text-heading">{org?.name || '-'}</span>
          </div>
          <div className="h-px bg-[var(--border-light)]" />
          <div className="flex flex-col gap-1">
            <span className="type-caption font-medium text-text-muted">Nama workspace</span>
            {editingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveWorkspaceName();
                    if (e.key === 'Escape') cancelEditing();
                  }}
                  className="max-w-[320px]"
                  autoFocus
                />
                <Button size="icon" variant="ghost" onClick={saveWorkspaceName} disabled={saving}>
                  <IconCheck size={16} stroke={2} />
                </Button>
                <Button size="icon" variant="ghost" onClick={cancelEditing}>
                  <IconX size={16} stroke={2} />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="type-body text-text-heading">{workspaceName || '-'}</span>
                <button
                  onClick={startEditing}
                  className="flex items-center justify-center w-7 h-7 rounded-md bg-transparent border-none cursor-pointer text-text-muted hover:text-text-heading hover:bg-[var(--bg-surface)] transition-colors"
                >
                  <IconPencil size={14} stroke={2} />
                </button>
              </div>
            )}
          </div>
          <div className="h-px bg-[var(--border-light)]" />
          <div className="flex flex-col gap-1">
            <span className="type-caption font-medium text-text-muted">Paket</span>
            <span className="type-body text-text-heading capitalize">{org?.plan || '-'}</span>
          </div>
        </div>
      )}

      {/* ── Langganan ──────────────────────────────────── */}
      {activeTab === 'langganan' && (
        <div className="card flex flex-col gap-5">
          {/* Current plan */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="type-caption font-medium text-text-muted">Paket saat ini</span>
              <div className="flex items-center gap-2">
                <span className="type-heading-sm text-text-heading">
                  {getPlanLabel(orgPlan.plan)}
                </span>
                <Badge
                  variant={isPaidPlan(orgPlan.plan) ? 'default' : 'secondary'}
                  className="text-[10px] uppercase"
                >
                  {orgPlan.subscriptionStatus === 'active' ? 'Aktif' : orgPlan.subscriptionStatus}
                </Badge>
              </div>
            </div>
            <Button variant="brand" size="sm" asChild>
              <Link href="/harga">
                {isPaidPlan(orgPlan.plan) ? 'Ubah paket' : 'Upgrade'}
                <IconArrowUpRight size={14} />
              </Link>
            </Button>
          </div>

          <div className="h-px bg-[var(--border-light)]" />

          {/* Subscription details (paid plans only) */}
          {isPaidPlan(orgPlan.plan) && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <span className="type-caption font-medium text-text-muted">Siklus billing</span>
                  <span className="type-body text-text-heading capitalize">
                    {org?.billing_cycle === 'annual' ? 'Tahunan' : 'Bulanan'}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="type-caption font-medium text-text-muted">Periode berakhir</span>
                  <span className="type-body text-text-heading">
                    {orgPlan.currentPeriodEnd
                      ? formatDate(orgPlan.currentPeriodEnd)
                      : '-'}
                  </span>
                </div>
              </div>

              {orgPlan.cancelAtPeriodEnd && (
                <div className="rounded-md bg-amber-50 border border-amber-200 px-4 py-3">
                  <p className="type-body text-amber-800 m-0">
                    Langganan akan berakhir pada {orgPlan.currentPeriodEnd ? formatDate(orgPlan.currentPeriodEnd) : '-'}.
                    {orgPlan.pendingPlan && ` Paket akan berubah ke ${getPlanLabel(orgPlan.pendingPlan)}.`}
                  </p>
                </div>
              )}

              <div className="h-px bg-[var(--border-light)]" />

              {/* Cancel button */}
              {!orgPlan.cancelAtPeriodEnd && (
                <div className="flex flex-col gap-1">
                  <span className="type-caption font-medium text-text-muted">Batalkan langganan</span>
                  <p className="type-body text-text-muted m-0 mb-2">
                    Akses berlanjut hingga akhir periode billing. Data Anda tidak akan dihapus.
                  </p>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-fit"
                    onClick={async () => {
                      if (!confirm('Yakin ingin membatalkan langganan? Akses berlanjut hingga akhir periode.')) return;
                      const res = await fetch('/api/billing/cancel', { method: 'POST' });
                      if (res.ok) {
                        window.location.reload();
                      }
                    }}
                  >
                    Batalkan langganan
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Free plan upgrade prompt */}
          {!isPaidPlan(orgPlan.plan) && (
            <div className="rounded-md bg-brand/5 border border-brand/20 px-4 py-4 flex flex-col gap-2">
              <p className="type-body text-brand font-medium m-0">
                Upgrade untuk monitoring harian, audit bulanan, dan fitur premium.
              </p>
              <Button variant="brand" size="sm" asChild className="w-fit">
                <Link href="/harga">
                  Lihat paket →
                </Link>
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── Riwayat Transaksi ─────────────────────────────── */}
      {activeTab === 'langganan' && (
        <div className="card flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <IconReceipt size={18} className="text-text-muted" />
            <span className="type-body font-medium text-text-heading">Riwayat Transaksi</span>
          </div>

          {invoicesLoading && (
            <div className="flex items-center justify-center py-6">
              <IconLoader2 size={20} className="animate-spin text-text-muted" />
            </div>
          )}

          {!invoicesLoading && invoices && invoices.events.length === 0 && invoices.refunds.length === 0 && (
            <p className="type-body text-text-muted m-0 py-4 text-center">
              Belum ada transaksi.
            </p>
          )}

          {!invoicesLoading && invoices && (invoices.events.length > 0 || invoices.refunds.length > 0) && (
            <div className="flex flex-col">
              {invoices.events.map((ev) => {
                const amount = ev.payload?.gross_amount as string | undefined;
                const toPlan = ev.payload?.to_plan as string | undefined;
                return (
                  <div key={ev.id} className="flex items-center justify-between py-3 border-b border-[var(--border-light)] last:border-b-0">
                    <div className="flex flex-col gap-0.5">
                      <span className="type-body text-text-heading">
                        {formatEventLabel(ev.event_type)}
                      </span>
                      <span className="type-caption text-text-muted">
                        {formatDate(ev.created_at)}
                        {toPlan && ` · ${getPlanLabel(toPlan)}`}
                        {ev.midtrans_order_id && ` · ${ev.midtrans_order_id}`}
                      </span>
                    </div>
                    {amount && (
                      <span className="type-body font-medium text-text-heading">
                        {formatCurrency(amount)}
                      </span>
                    )}
                  </div>
                );
              })}

              {invoices.refunds.map((r) => (
                <div key={r.id} className="flex items-center justify-between py-3 border-b border-[var(--border-light)] last:border-b-0">
                  <div className="flex flex-col gap-0.5">
                    <span className="type-body text-text-heading">Refund</span>
                    <span className="type-caption text-text-muted">
                      {formatDate(r.created_at)} · {r.reason}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={r.status === 'processed' ? 'default' : 'secondary'} className="text-[10px] uppercase">
                      {r.status}
                    </Badge>
                    <span className="type-body font-medium text-text-heading">
                      {formatCurrency(r.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
