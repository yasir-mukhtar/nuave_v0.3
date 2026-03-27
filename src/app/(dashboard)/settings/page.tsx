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
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { IconPencil, IconCheck, IconX, IconDownload } from '@tabler/icons-react';
import type { Organization, CreditTransaction } from '@/types';

type SectionId = 'profil' | 'workspace' | 'kredit' | 'pembelian';

const sections: { id: SectionId; label: string }[] = [
  { id: 'profil', label: 'Profil' },
  { id: 'workspace', label: 'Workspace' },
  { id: 'kredit', label: 'Kredit' },
  { id: 'pembelian', label: 'Pembelian' },
];

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function openReceiptWindow(txn: CreditTransaction, orgName: string) {
  const w = window.open('', '_blank', 'width=600,height=700');
  if (!w) return;

  const date = new Date(txn.created_at);
  const formattedDate = date.toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const formattedTime = date.toLocaleTimeString('id-ID', {
    hour: '2-digit', minute: '2-digit',
  });
  const receiptNo = `NV-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${txn.id.slice(0, 8).toUpperCase()}`;

  w.document.write(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>Kwitansi ${receiptNo}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111827; padding: 48px; max-width: 560px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
    .brand { font-size: 20px; font-weight: 700; }
    .receipt-label { font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
    .divider { height: 1px; background: #e5e7eb; margin: 24px 0; }
    .row { display: flex; justify-content: space-between; padding: 8px 0; }
    .label { color: #6b7280; font-size: 14px; }
    .value { font-size: 14px; font-weight: 500; text-align: right; }
    .footer { margin-top: 48px; font-size: 12px; color: #9ca3af; text-align: center; }
    .print-btn { display: block; margin: 32px auto 0; padding: 10px 24px; background: #533AFD; color: #fff; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; }
    .print-btn:hover { background: #3d2bc7; }
    @media print { .print-btn { display: none; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">nuave</div>
      <div style="font-size:13px; color:#6b7280; margin-top:2px;">nuave.ai</div>
    </div>
    <div style="text-align:right;">
      <div class="receipt-label">Kwitansi</div>
      <div style="font-size:14px; font-weight:600; margin-top:2px;">${receiptNo}</div>
    </div>
  </div>

  <div class="row">
    <span class="label">Tanggal</span>
    <span class="value">${formattedDate}, ${formattedTime}</span>
  </div>
  <div class="row">
    <span class="label">Organisasi</span>
    <span class="value">${orgName}</span>
  </div>
  <div class="row">
    <span class="label">Deskripsi</span>
    <span class="value">${txn.description || 'Pembelian kredit'}</span>
  </div>
  <div class="row">
    <span class="label">Jumlah kredit</span>
    <span class="value">${txn.amount} kredit</span>
  </div>

  <div class="divider"></div>

  <div class="row">
    <span class="label">Saldo setelah transaksi</span>
    <span class="value">${txn.balance_after ?? '-'} kredit</span>
  </div>

  <div class="divider"></div>

  <div class="footer">
    Dokumen ini dibuat secara otomatis oleh nuave.ai<br/>
    ID Transaksi: ${txn.id}
  </div>

  <button class="print-btn" onclick="window.print()">Cetak / Simpan PDF</button>
</body>
</html>`);
  w.document.close();
}

const validTabs: SectionId[] = ['profil', 'workspace', 'kredit', 'pembelian'];

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
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
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
        .select('org_id, organizations(id, name, slug, plan, credits_balance, created_at, updated_at)')
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

      if (orgRow) {
        const { data: txns } = await supabase
          .from('credit_transactions')
          .select('*')
          .eq('org_id', orgRow.id)
          .order('created_at', { ascending: false })
          .limit(50);
        if (txns) setTransactions(txns as CreditTransaction[]);
      }

      setLoading(false);
    }

    load();
  }, [activeWorkspaceId]);

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

  const txnTypeLabel: Record<string, string> = {
    purchase: 'Pembelian',
    deduction: 'Pemakaian',
    bonus: 'Bonus',
    refund: 'Pengembalian',
  };

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

      {/* ── Kredit ──────────────────────────────────────── */}
      {activeTab === 'kredit' && (
        <div className="card flex flex-col gap-5">
          <div className="flex items-baseline gap-2">
            <span className="type-heading-sm text-[var(--purple)] font-bold">{org?.credits_balance ?? 0}</span>
            <span className="type-body text-text-muted">kredit tersisa</span>
          </div>

          <div className="h-px bg-[var(--border-light)]" />

          <div className="flex flex-col gap-3">
            <span className="type-title text-text-heading">Riwayat kredit</span>
            {transactions.length === 0 ? (
              <p className="type-body text-text-muted m-0">Belum ada transaksi.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="type-caption font-medium">Tanggal</TableHead>
                    <TableHead className="type-caption font-medium">Tipe</TableHead>
                    <TableHead className="type-caption font-medium">Keterangan</TableHead>
                    <TableHead className="type-caption font-medium text-right">Jumlah</TableHead>
                    <TableHead className="type-caption font-medium text-right">Saldo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((txn) => (
                    <TableRow key={txn.id}>
                      <TableCell className="type-body text-text-body whitespace-nowrap">
                        {formatDate(txn.created_at)}
                      </TableCell>
                      <TableCell className="type-body text-text-body">
                        {txnTypeLabel[txn.type] ?? txn.type}
                      </TableCell>
                      <TableCell className="type-body text-text-muted">
                        {txn.description || '-'}
                      </TableCell>
                      <TableCell className={`type-body text-right font-medium ${txn.amount > 0 ? 'text-[var(--green)]' : 'text-text-body'}`}>
                        {txn.amount > 0 ? '+' : ''}{txn.amount}
                      </TableCell>
                      <TableCell className="type-body text-right text-text-body">
                        {txn.balance_after ?? '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      )}

      {/* ── Pembelian & Kwitansi ────────────────────────── */}
      {activeTab === 'pembelian' && (
        <div className="card flex flex-col gap-3">
          {transactions.filter((t) => t.type === 'purchase').length === 0 ? (
            <p className="type-body text-text-muted m-0">Belum ada pembelian.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="type-caption font-medium">Tanggal</TableHead>
                  <TableHead className="type-caption font-medium">Keterangan</TableHead>
                  <TableHead className="type-caption font-medium text-right">Kredit</TableHead>
                  <TableHead className="type-caption font-medium text-right">Kwitansi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions
                  .filter((t) => t.type === 'purchase')
                  .map((txn) => (
                    <TableRow key={txn.id}>
                      <TableCell className="type-body text-text-body whitespace-nowrap">
                        {formatDate(txn.created_at)}
                      </TableCell>
                      <TableCell className="type-body text-text-body">
                        {txn.description || 'Pembelian kredit'}
                      </TableCell>
                      <TableCell className="type-body text-right font-medium text-[var(--green)]">
                        +{txn.amount}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openReceiptWindow(txn, org?.name ?? '')}
                          className="gap-1.5"
                        >
                          <IconDownload size={14} stroke={2} />
                          Unduh
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}
    </div>
  );
}
