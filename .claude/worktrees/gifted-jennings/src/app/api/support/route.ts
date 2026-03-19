import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const { name, email, category, subject, message } = await req.json();

    if (!name || !email || !category || !subject || !message) {
      return NextResponse.json(
        { error: "Semua field wajib diisi." },
        { status: 400 }
      );
    }

    const { error } = await resend.emails.send({
      from: "Nuave Support <support@nuave.ai>",
      to: "hello.nuave@gmail.com",
      cc: "mail.yasirmukhtar@gmail.com",
      replyTo: email,
      subject: `[${category}] ${subject}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px;">
          <h2 style="color: #111827; margin-bottom: 24px;">Pesan Baru dari Formulir Bantuan</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <tr>
              <td style="padding: 8px 12px; font-weight: 600; color: #374151; width: 120px; vertical-align: top;">Nama</td>
              <td style="padding: 8px 12px; color: #374151;">${escapeHtml(name)}</td>
            </tr>
            <tr style="background: #F9FAFB;">
              <td style="padding: 8px 12px; font-weight: 600; color: #374151; vertical-align: top;">Email</td>
              <td style="padding: 8px 12px; color: #374151;"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; font-weight: 600; color: #374151; vertical-align: top;">Kategori</td>
              <td style="padding: 8px 12px; color: #374151;">${escapeHtml(category)}</td>
            </tr>
            <tr style="background: #F9FAFB;">
              <td style="padding: 8px 12px; font-weight: 600; color: #374151; vertical-align: top;">Subjek</td>
              <td style="padding: 8px 12px; color: #374151;">${escapeHtml(subject)}</td>
            </tr>
          </table>
          <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 16px;">
            <p style="font-weight: 600; color: #374151; margin: 0 0 8px 0;">Pesan:</p>
            <p style="color: #374151; margin: 0; white-space: pre-wrap; line-height: 1.6;">${escapeHtml(message)}</p>
          </div>
          <p style="font-size: 12px; color: #9CA3AF; margin-top: 24px;">
            Dikirim melalui formulir bantuan di nuave.ai
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { error: "Gagal mengirim pesan. Silakan coba lagi." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Support API error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
