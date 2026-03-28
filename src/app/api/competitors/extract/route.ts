export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { extractCompetitorsForAudit } from '@/lib/competitor-extraction';

export async function POST(request: Request) {
  try {
    const { audit_id } = await request.json();

    if (!audit_id) {
      return NextResponse.json({ error: 'audit_id required' }, { status: 400 });
    }

    const result = await extractCompetitorsForAudit(audit_id);

    return NextResponse.json({
      ...result,
      audit_id,
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
