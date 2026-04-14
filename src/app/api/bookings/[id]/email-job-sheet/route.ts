import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import nodemailer from "nodemailer";

function fmt(s?: string | null) {
  if (!s) return "";
  const p = s.split("-");
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : s;
}

function addr(...parts: (string | null | undefined)[]) {
  return parts.filter(Boolean).join(", ") || "—";
}

function buildHtml(booking: any, settings: any): string {
  const company = settings?.companyName || "MP Transport";
  const vias: any[] = booking.viaAddresses || [];

  const viasHtml = vias.map((v: any, i: number) => {
    let orders: any[] = [];
    if (v.notes?.includes("---ORDERS---")) {
      try { orders = JSON.parse(v.notes.split("---ORDERS---")[1] || "[]"); } catch { /* */ }
    }
    const noteText = v.notes?.split("---ORDERS---")[0] || "";
    return `
      <tr><td colspan="4" style="background:#f0f4ff;padding:8px 12px;font-weight:bold;color:#4338ca;font-size:12px;border-top:2px solid #e2e8f0;">
        📍 Via Stop ${i + 1}${v.viaType && v.viaType !== "Via" ? ` — ${v.viaType}` : ""}
      </td></tr>
      <tr>
        <td style="padding:6px 12px;font-size:12px;color:#374151;width:18%;vertical-align:top"><strong>Location:</strong></td>
        <td style="padding:6px 12px;font-size:12px;color:#374151" colspan="3">${addr(v.name, v.address1, v.address2, v.area, v.postcode)}</td>
      </tr>
      ${v.viaDate ? `<tr><td style="padding:4px 12px;font-size:12px;color:#374151"><strong>Date / Time:</strong></td><td style="padding:4px 12px;font-size:12px;color:#374151" colspan="3">${fmt(v.viaDate)} ${v.viaTime || ""}</td></tr>` : ""}
      ${v.contact ? `<tr><td style="padding:4px 12px;font-size:12px;color:#374151"><strong>Contact:</strong></td><td style="padding:4px 12px;font-size:12px;color:#374151" colspan="3">${v.contact}${v.phone ? ` · ${v.phone}` : ""}</td></tr>` : ""}
      ${orders.length > 0 ? `<tr><td style="padding:4px 12px;font-size:12px;color:#374151;vertical-align:top"><strong>Orders:</strong></td><td style="padding:4px 12px;font-size:12px;color:#374151" colspan="3">${orders.map((o: any) => `${o.ref} (${o.type})`).join(", ")}</td></tr>` : ""}
      ${noteText ? `<tr><td style="padding:4px 12px;font-size:12px;color:#374151"><strong>Notes:</strong></td><td style="padding:4px 12px;font-size:12px;color:#b45309" colspan="3">${noteText}</td></tr>` : ""}
    `;
  }).join("");

  let deliveryOrders: any[] = [];
  const rawDelivNotes = booking.deliveryNotes || "";
  if (rawDelivNotes.includes("---ORDERS---")) {
    try { deliveryOrders = JSON.parse(rawDelivNotes.split("---ORDERS---")[1] || "[]"); } catch { /* */ }
  }
  const delivNoteText = rawDelivNotes.split("---ORDERS---")[0] || "";

  const units = [booking.chillUnit, booking.ambientUnit].filter(Boolean);

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Job Sheet — ${booking.jobRef || booking.id.slice(-8).toUpperCase()}</title></head>
<body style="font-family:Arial,sans-serif;background:#f1f5f9;margin:0;padding:20px;">
<div style="max-width:700px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,.12)">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#1a3a5c,#1e4976);padding:22px 28px;color:#fff">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td>
          <h1 style="margin:0;font-size:24px;font-weight:900;letter-spacing:-0.5px">${company}</h1>
          ${settings?.companyAddress1 ? `<p style="margin:4px 0 0;font-size:12px;opacity:.75">${addr(settings.companyAddress1, settings.city, settings.postcode)}</p>` : ""}
          ${settings?.phone ? `<p style="margin:3px 0 0;font-size:12px;opacity:.75">Tel: ${settings.phone}</p>` : ""}
        </td>
        <td style="text-align:right;vertical-align:top">
          <div style="display:inline-block;background:rgba(255,255,255,.15);border:2px solid rgba(255,255,255,.3);border-radius:8px;padding:10px 16px;text-align:center">
            <p style="margin:0;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;opacity:.8">Job Reference</p>
            <p style="margin:4px 0 0;font-size:22px;font-weight:900;letter-spacing:1px">${booking.jobRef || booking.id.slice(-8).toUpperCase()}</p>
          </div>
        </td>
      </tr>
    </table>
  </div>

  <!-- Customer / PO banner -->
  <div style="background:#f0f4ff;padding:14px 28px;border-bottom:1px solid #dde4f5">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding-right:20px"><span style="font-size:10px;color:#6b7280;font-weight:700;text-transform:uppercase;letter-spacing:.5px">Customer</span><br><strong style="font-size:14px;color:#111827">${booking.customer?.name || "—"}</strong></td>
        <td style="padding-right:20px"><span style="font-size:10px;color:#6b7280;font-weight:700;text-transform:uppercase;letter-spacing:.5px">Account No.</span><br><strong style="font-size:14px;color:#111827">${booking.customer?.accountNumber || "—"}</strong></td>
        <td style="padding-right:20px"><span style="font-size:10px;color:#6b7280;font-weight:700;text-transform:uppercase;letter-spacing:.5px">PO Number</span><br><strong style="font-size:14px;color:#111827">${booking.purchaseOrder || "—"}</strong></td>
        <td><span style="font-size:10px;color:#6b7280;font-weight:700;text-transform:uppercase;letter-spacing:.5px">Vehicle</span><br><strong style="font-size:14px;color:#111827">${booking.vehicle?.name || "—"}</strong></td>
      </tr>
    </table>
  </div>

  <!-- Details table -->
  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">

    <!-- Collection -->
    <tr><td colspan="4" style="background:#1e4976;padding:9px 14px;color:#fff;font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:.5px">📍 Collection</td></tr>
    <tr>
      <td style="padding:8px 14px;font-size:12px;color:#374151;width:18%;vertical-align:top"><strong>Date / Time:</strong></td>
      <td style="padding:8px 14px;font-size:12px;color:#374151" colspan="3">${fmt(booking.collectionDate)} ${booking.collectionTime || ""}</td>
    </tr>
    <tr>
      <td style="padding:5px 14px;font-size:12px;color:#374151;vertical-align:top"><strong>Location:</strong></td>
      <td style="padding:5px 14px;font-size:12px;color:#374151" colspan="3">${addr(booking.collectionName, booking.collectionAddress1, booking.collectionAddress2, booking.collectionArea, booking.collectionPostcode)}</td>
    </tr>
    ${booking.collectionContact ? `<tr><td style="padding:5px 14px;font-size:12px;color:#374151"><strong>Contact:</strong></td><td style="padding:5px 14px;font-size:12px;color:#374151" colspan="3">${booking.collectionContact}${booking.collectionPhone ? ` · ${booking.collectionPhone}` : ""}</td></tr>` : ""}
    ${booking.collectionNotes ? `<tr><td style="padding:5px 14px;font-size:12px;color:#374151;vertical-align:top"><strong>Notes:</strong></td><td style="padding:5px 14px;font-size:12px;color:#b45309" colspan="3">${booking.collectionNotes}</td></tr>` : ""}

    <!-- Via stops -->
    ${viasHtml}

    <!-- Delivery -->
    <tr><td colspan="4" style="background:#1e4976;padding:9px 14px;color:#fff;font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:.5px">🏭 Delivery</td></tr>
    <tr>
      <td style="padding:8px 14px;font-size:12px;color:#374151;vertical-align:top"><strong>Date / Time:</strong></td>
      <td style="padding:8px 14px;font-size:12px;color:#374151" colspan="3">${fmt(booking.deliveryDate || booking.collectionDate)} ${booking.deliveryTime || "—"}</td>
    </tr>
    <tr>
      <td style="padding:5px 14px;font-size:12px;color:#374151;vertical-align:top"><strong>Location:</strong></td>
      <td style="padding:5px 14px;font-size:12px;color:#374151" colspan="3">${addr(booking.deliveryName, booking.deliveryAddress1, booking.deliveryAddress2, booking.deliveryArea, booking.deliveryPostcode)}</td>
    </tr>
    ${booking.deliveryContact ? `<tr><td style="padding:5px 14px;font-size:12px;color:#374151"><strong>Contact:</strong></td><td style="padding:5px 14px;font-size:12px;color:#374151" colspan="3">${booking.deliveryContact}${booking.deliveryPhone ? ` · ${booking.deliveryPhone}` : ""}</td></tr>` : ""}
    ${deliveryOrders.length > 0 ? `<tr><td style="padding:5px 14px;font-size:12px;color:#374151;vertical-align:top"><strong>Orders:</strong></td><td style="padding:5px 14px;font-size:12px;color:#374151" colspan="3">${deliveryOrders.map((o: any) => `${o.ref} (${o.type})`).join(", ")}</td></tr>` : ""}
    ${delivNoteText ? `<tr><td style="padding:5px 14px;font-size:12px;color:#374151;vertical-align:top"><strong>Notes:</strong></td><td style="padding:5px 14px;font-size:12px;color:#b45309" colspan="3">${delivNoteText}</td></tr>` : ""}

    <!-- Driver / Job Details -->
    <tr><td colspan="4" style="background:#374151;padding:9px 14px;color:#fff;font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:.5px">🚘 Driver &amp; Job Details</td></tr>
    <tr>
      <td style="padding:7px 14px;font-size:12px;color:#374151"><strong>Driver:</strong></td>
      <td style="padding:7px 14px;font-size:12px;color:#374151">${booking.driver?.name || "TBC"}</td>
      <td style="padding:7px 14px;font-size:12px;color:#374151"><strong>Items / Weight:</strong></td>
      <td style="padding:7px 14px;font-size:12px;color:#374151">${booking.numberOfItems || "—"}${booking.weight ? ` · ${booking.weight} kg` : ""}</td>
    </tr>
    ${booking.secondMan?.name ? `<tr><td style="padding:5px 14px;font-size:12px;color:#374151"><strong>2nd Man:</strong></td><td style="padding:5px 14px;font-size:12px;color:#374151" colspan="3">${booking.secondMan.name}</td></tr>` : ""}
    ${booking.cxDriver?.name ? `<tr><td style="padding:5px 14px;font-size:12px;color:#374151"><strong>CX Driver:</strong></td><td style="padding:5px 14px;font-size:12px;color:#374151" colspan="3">${booking.cxDriver.name}</td></tr>` : ""}
    ${units.length > 0 ? `<tr><td style="padding:5px 14px;font-size:12px;color:#374151;vertical-align:top"><strong>Temp Units:</strong></td><td style="padding:5px 14px;font-size:12px;color:#374151" colspan="3">${units.map((u: any) => `${u.unitType ? u.unitType.charAt(0).toUpperCase() + u.unitType.slice(1) : "Unit"}: ${u.unitNumber}`).join("  |  ")}</td></tr>` : ""}
    ${booking.jobNotes ? `<tr><td style="padding:5px 14px;font-size:12px;color:#374151;vertical-align:top"><strong>Driver Notes:</strong></td><td style="padding:5px 14px;font-size:12px;color:#b45309" colspan="3"><strong>${booking.jobNotes}</strong></td></tr>` : ""}

  </table>

  <!-- Footer -->
  <div style="background:#f8fafc;padding:14px 28px;border-top:1px solid #e2e8f0;text-align:center">
    <p style="margin:0;font-size:11px;color:#9ca3af">Generated by ${company} · ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
    ${settings?.phone || settings?.cemail ? `<p style="margin:4px 0 0;font-size:11px;color:#9ca3af">${[settings.phone ? `Tel: ${settings.phone}` : "", settings.cemail || ""].filter(Boolean).join("  ·  ")}</p>` : ""}
  </div>

</div>
</body></html>`;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { email } = await req.json();
  if (!email?.trim()) return NextResponse.json({ error: "Email address is required" }, { status: 400 });

  const [booking, settings] = await Promise.all([
    prisma.booking.findUnique({
      where: { id },
      include: {
        customer: true, vehicle: true, driver: true,
        secondMan: true, cxDriver: true,
        chillUnit: true, ambientUnit: true,
        viaAddresses: { where: { deletedAt: null }, orderBy: { createdAt: "asc" } },
      },
    }),
    prisma.settings.findFirst(),
  ]);

  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  const html = buildHtml(booking, settings);
  const from = settings?.cemail || process.env.SMTP_USER || "noreply@mptransport.com";
  const subject = `Job Sheet — ${booking.jobRef || booking.id.slice(-8).toUpperCase()} — ${booking.customer?.name || ""}`;

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.mailtrap.io",
      port: parseInt(process.env.SMTP_PORT || "587"),
      auth: { user: process.env.SMTP_USER || "", pass: process.env.SMTP_PASS || "" },
    });
    await transporter.sendMail({ from, to: email.trim(), subject, html });
    return NextResponse.json({ sent: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to send email" }, { status: 500 });
  }
}
