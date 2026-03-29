import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase/server';
import { jsPDF } from 'jspdf';
import { type PlanId, getPlanPricing } from '@/lib/plan-limits';

// Pre-rendered logo-nuave-complete.svg at 4× (608×192 PNG)
const NUAVE_LOGO_BASE64 = 'data:image/png;base64,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';

const PLAN_LABELS: Record<PlanId, string> = {
  free: 'Gratis',
  starter: 'Starter',
  growth: 'Growth',
  agency: 'Agency',
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatEventType(type: string): string {
  switch (type) {
    case 'webhook_settlement':
    case 'webhook_capture':
      return 'Pembayaran Berhasil';
    case 'plan_upgrade':
      return 'Upgrade Paket';
    case 'plan_downgrade_scheduled':
      return 'Downgrade Dijadwalkan';
    case 'subscription_cancelled':
      return 'Langganan Dibatalkan';
    default:
      return type.replace(/_/g, ' ');
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;

    const supabaseServer = await createSupabaseServerClient();
    const { data: { user } } = await supabaseServer.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createSupabaseAdminClient();

    // Resolve org membership
    const { data: om } = await supabase
      .from('organization_members')
      .select('org_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (!om?.org_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Fetch the billing event — must belong to user's org
    const { data: event } = await supabase
      .from('billing_events')
      .select('*')
      .eq('id', eventId)
      .eq('org_id', om.org_id)
      .maybeSingle();

    if (!event) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Fetch org details
    const { data: org } = await supabase
      .from('organizations')
      .select('name, plan, billing_cycle')
      .eq('id', om.org_id)
      .maybeSingle();

    // Fetch user profile
    const { data: profile } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle();

    // Extract data from event payload
    const payload = (event.payload ?? {}) as Record<string, unknown>;
    const grossAmount = parseFloat((payload.gross_amount as string) ?? '0');
    const toPlan = (payload.to_plan as string | undefined)
      ?? (event.event_type.includes('webhook') ? (org?.plan ?? 'starter') : null);
    const billingCycle = (payload.billing_cycle as string) ?? org?.billing_cycle ?? 'monthly';
    const paymentType = payload.payment_type as string | undefined;
    const transactionId = (event.midtrans_transaction_id ?? payload.transaction_id ?? '') as string;
    const orderId = event.midtrans_order_id ?? '';

    // ── Build PDF ──────────────────────────────────────────────
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    // Colors
    const purple = [111, 66, 193] as const;
    const darkText = [17, 24, 39] as const;
    const mutedText = [107, 114, 128] as const;
    const borderColor = [229, 231, 235] as const;

    // ── Header: Nuave logo (N mark + logotype) ──
    // Pre-rendered from logo-nuave-complete.svg (76×24 viewBox) at 4× resolution
    const logoWidth = 38; // mm — proportional to original 76:24 aspect ratio
    const logoHeight = 12; // mm
    doc.addImage(NUAVE_LOGO_BASE64, 'PNG', margin, y - 1, logoWidth, logoHeight);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...mutedText);
    doc.text('nuave.ai', pageWidth - margin, y + 3, { align: 'right' });
    doc.text('hello@nuave.ai', pageWidth - margin, y + 8, { align: 'right' });

    y += 20;

    // Divider
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    // ── Invoice title + number ──
    const isPayment = ['webhook_settlement', 'webhook_capture'].includes(event.event_type);
    const docTitle = isPayment ? 'KUITANSI' : 'INVOICE';

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkText);
    doc.text(docTitle, margin, y + 6);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...mutedText);
    const docPrefix = isPayment ? 'RCP' : 'INV';
    const invoiceNumber = `${docPrefix}-${orderId || eventId.slice(0, 12).toUpperCase()}`;
    doc.text(invoiceNumber, pageWidth - margin, y + 2, { align: 'right' });
    doc.text(`Tanggal: ${formatDate(event.created_at)}`, pageWidth - margin, y + 7, { align: 'right' });

    y += 18;

    // ── Bill To ──
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...mutedText);
    doc.text('DITAGIHKAN KEPADA', margin, y);
    y += 6;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkText);
    doc.text(org?.name || 'Workspace', margin, y);
    y += 5;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...mutedText);
    doc.text(profile?.full_name || '', margin, y);
    y += 5;
    doc.text(user.email ?? '', margin, y);
    y += 12;

    // ── Table header ──
    const colX = {
      item: margin,
      detail: margin + 80,
      amount: pageWidth - margin,
    };

    doc.setFillColor(248, 249, 250);
    doc.rect(margin, y - 1, contentWidth, 9, 'F');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...mutedText);
    doc.text('ITEM', colX.item + 3, y + 5);
    doc.text('DETAIL', colX.detail, y + 5);
    doc.text('JUMLAH', colX.amount - 3, y + 5, { align: 'right' });
    y += 13;

    // ── Table row ──
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...darkText);
    doc.setFontSize(10);

    // Item name
    const planLabel = toPlan ? (PLAN_LABELS[toPlan as PlanId] ?? toPlan) : 'Langganan';
    const cycleLabel = billingCycle === 'annual' ? 'Tahunan' : 'Bulanan';
    const itemName = `Nuave ${planLabel}`;
    doc.setFont('helvetica', 'bold');
    doc.text(itemName, colX.item + 3, y + 1);

    // Detail
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...mutedText);
    doc.setFontSize(9);
    doc.text(`${formatEventType(event.event_type)} · ${cycleLabel}`, colX.detail, y + 1);

    // Amount
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkText);
    doc.setFontSize(10);
    doc.text(grossAmount > 0 ? formatCurrency(grossAmount) : '-', colX.amount - 3, y + 1, { align: 'right' });

    y += 8;

    // Row divider
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    // ── Total ──
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...mutedText);
    doc.text('TOTAL', colX.detail, y);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkText);
    doc.text(grossAmount > 0 ? formatCurrency(grossAmount) : '-', colX.amount - 3, y + 1, { align: 'right' });

    y += 16;

    // Divider
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    // ── Payment Details ──
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...mutedText);
    doc.text('DETAIL PEMBAYARAN', margin, y);
    y += 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...darkText);

    const details: [string, string][] = [
      ['Status', isPayment ? 'Lunas' : formatEventType(event.event_type)],
    ];
    if (paymentType) {
      details.push(['Metode Pembayaran', paymentType.replace(/_/g, ' ').toUpperCase()]);
    }
    if (transactionId) {
      details.push(['ID Transaksi Midtrans', transactionId]);
    }
    if (orderId) {
      details.push(['Order ID', orderId]);
    }

    for (const [label, value] of details) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...mutedText);
      doc.setFontSize(9);
      doc.text(label, margin, y);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...darkText);
      doc.setFontSize(10);
      doc.text(value, margin + 55, y);
      y += 6;
    }

    y += 10;

    // ── Footer ──
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...mutedText);
    doc.text(
      'Dokumen ini dibuat secara otomatis oleh Nuave dan sah tanpa tanda tangan.',
      pageWidth / 2,
      y,
      { align: 'center' }
    );
    y += 4;
    doc.text(
      'Pertanyaan tentang tagihan? Hubungi hello@nuave.ai',
      pageWidth / 2,
      y,
      { align: 'center' }
    );

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    const fileLabel = isPayment ? 'Receipt' : 'Invoice';
    const fileName = `Nuave-${fileLabel}-${orderId || eventId.slice(0, 12)}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'private, no-cache',
      },
    });
  } catch (error: unknown) {
    console.error('Invoice PDF generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
