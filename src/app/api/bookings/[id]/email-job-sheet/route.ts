import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import nodemailer from "nodemailer";
import React from "react";
import { Document, Page, Text, View, StyleSheet, renderToBuffer, Image as PdfImage } from "@react-pdf/renderer";

function fmt(s?: string | null) {
  if (!s) return "";
  const p = s.split("-");
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : s;
}

function addrParts(...parts: (string | null | undefined)[]) {
  return parts.filter(Boolean).join(", ") || "";
}

// ─── PDF Styles ───────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 9, color: "#374151", backgroundColor: "#f8fafc", paddingBottom: 30 },
  header: { backgroundColor: "#1a3a5c", padding: "16 20 14 20", flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  headerLeft: { flex: 1 },
  headerCompany: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#ffffff", marginBottom: 3 },
  headerSub: { fontSize: 8, color: "rgba(255,255,255,0.75)", marginTop: 1 },
  headerLogo: { width: 70, height: 35, objectFit: "contain" },
  jobRefBox: { backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 6, padding: "8 12", textAlign: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.3)" },
  jobRefLabel: { fontSize: 7, color: "rgba(255,255,255,0.75)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 },
  jobRefValue: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#ffffff" },

  customerBanner: { backgroundColor: "#eff6ff", padding: "8 20", flexDirection: "row", gap: 20, borderBottomWidth: 1, borderBottomColor: "#dde4f5" },
  bannerItem: { flex: 1 },
  bannerLabel: { fontSize: 7, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 },
  bannerValue: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#111827" },

  sectionHeader: { backgroundColor: "#1e4976", padding: "6 14", color: "#ffffff", fontSize: 9, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 8 },
  sectionHeaderGrey: { backgroundColor: "#374151", padding: "6 14", color: "#ffffff", fontSize: 9, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 8 },
  sectionHeaderIndigo: { backgroundColor: "#4338ca", padding: "6 14", color: "#ffffff", fontSize: 9, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 8 },
  body: { paddingHorizontal: 14, paddingTop: 5 },
  row: { flexDirection: "row", paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  rowLabel: { fontFamily: "Helvetica-Bold", width: 100, color: "#374151", paddingRight: 6 },
  rowValue: { flex: 1, color: "#374151" },
  rowValueAmber: { flex: 1, color: "#b45309" },

  notesBox: { margin: "6 14 0 14", padding: "8 10", backgroundColor: "#fffbeb", borderRadius: 4, borderLeftWidth: 3, borderLeftColor: "#f59e0b" },
  notesLabel: { fontFamily: "Helvetica-Bold", fontSize: 8, color: "#b45309", marginBottom: 2 },
  notesText: { fontSize: 9, color: "#92400e" },

  footer: { position: "absolute", bottom: 10, left: 20, right: 20, textAlign: "center", fontSize: 8, color: "#9ca3af" },
  gap: { marginTop: 4 },
  content: { margin: "0 14" },
});

// ─── Section Row helper ───────────────────────────────────────────────────────

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value?.trim()) return null;
  return React.createElement(View, { style: S.row },
    React.createElement(Text, { style: S.rowLabel }, label),
    React.createElement(Text, { style: S.rowValue }, value)
  );
}

// ─── Location section (collection / via / delivery) ───────────────────────────

function LocationSection({ title, color, date, time, name, address, contact, phone, notes }: {
  title: string; color: "blue" | "indigo" | "grey";
  date?: string | null; time?: string | null; name?: string | null; address?: string | null;
  contact?: string | null; phone?: string | null; notes?: string | null;
}) {
  const headerStyle = color === "indigo" ? S.sectionHeaderIndigo : color === "grey" ? S.sectionHeaderGrey : S.sectionHeader;
  return React.createElement(React.Fragment, null,
    React.createElement(Text, { style: headerStyle }, title),
    React.createElement(View, { style: S.body },
      React.createElement(View, { style: S.row },
        React.createElement(Text, { style: S.rowLabel }, "Date:"),
        React.createElement(Text, { style: S.rowValue }, [fmt(date), time].filter(Boolean).join("  ") || "—")
      ),
      React.createElement(View, { style: S.row },
        React.createElement(Text, { style: S.rowLabel }, "Name:"),
        React.createElement(Text, { style: S.rowValue }, name || "—")
      ),
      React.createElement(View, { style: S.row },
        React.createElement(Text, { style: S.rowLabel }, "Address:"),
        React.createElement(Text, { style: S.rowValue }, address || "—")
      ),
      contact ? React.createElement(View, { style: S.row },
        React.createElement(Text, { style: S.rowLabel }, "Contact Name:"),
        React.createElement(Text, { style: S.rowValue }, contact)
      ) : null,
      phone ? React.createElement(View, { style: S.row },
        React.createElement(Text, { style: S.rowLabel }, "Telephone:"),
        React.createElement(Text, { style: S.rowValue }, phone)
      ) : null,
      notes?.trim() ? React.createElement(View, { style: S.row },
        React.createElement(Text, { style: S.rowLabel }, "Notes:"),
        React.createElement(Text, { style: S.rowValueAmber }, notes.trim())
      ) : null,
    )
  );
}

// ─── PDF Document ─────────────────────────────────────────────────────────────

function JobSheetDoc({ booking, settings }: { booking: any; settings: any }) {
  const company = settings?.companyName || "MP Transport";
  const jobRef = booking.jobRef || booking.id.slice(-8).toUpperCase();
  const vias: any[] = booking.viaAddresses || [];
  const logoUrl = settings?.logo || null;

  const rawJobNotes = booking.jobNotes || "";
  const items = booking.numberOfItems ? String(booking.numberOfItems) : null;
  const weight = booking.weight ? `${booking.weight} kg` : null;
  const miles = booking.miles ? `${Number(booking.miles).toFixed(1)} mi` : null;
  const units = [booking.chillUnit, booking.ambientUnit].filter(Boolean);

  return React.createElement(Document, null,
    React.createElement(Page, { size: "A4", style: S.page },

      // Header
      React.createElement(View, { style: S.header },
        React.createElement(View, { style: S.headerLeft },
          logoUrl
            ? React.createElement(PdfImage, { src: logoUrl, style: S.headerLogo })
            : React.createElement(Text, { style: S.headerCompany }, company),
          settings?.companyAddress1
            ? React.createElement(Text, { style: S.headerSub }, addrParts(settings.companyAddress1, settings.city, settings.postcode))
            : null,
          settings?.phone
            ? React.createElement(Text, { style: S.headerSub }, `Tel: ${settings.phone}`)
            : null,
        ),
        React.createElement(View, { style: S.jobRefBox },
          React.createElement(Text, { style: S.jobRefLabel }, "Job Reference"),
          React.createElement(Text, { style: S.jobRefValue }, jobRef),
        )
      ),

      // Customer banner — customer name + vehicle + job ref only
      React.createElement(View, { style: S.customerBanner },
        React.createElement(View, { style: S.bannerItem },
          React.createElement(Text, { style: S.bannerLabel }, "Customer"),
          React.createElement(Text, { style: S.bannerValue }, booking.customer?.name || "—"),
        ),
        React.createElement(View, { style: S.bannerItem },
          React.createElement(Text, { style: S.bannerLabel }, "Job Ref"),
          React.createElement(Text, { style: S.bannerValue }, jobRef),
        ),
        React.createElement(View, { style: S.bannerItem },
          React.createElement(Text, { style: S.bannerLabel }, "Vehicle"),
          React.createElement(Text, { style: S.bannerValue }, booking.vehicle?.name || "—"),
        ),
        miles ? React.createElement(View, { style: S.bannerItem },
          React.createElement(Text, { style: S.bannerLabel }, "Mileage"),
          React.createElement(Text, { style: S.bannerValue }, miles),
        ) : null,
      ),

      // Collection
      React.createElement(LocationSection, {
        title: "Collection",
        color: "blue",
        date: booking.collectionDate,
        time: booking.collectionTime,
        name: booking.collectionName,
        address: addrParts(booking.collectionAddress1, booking.collectionAddress2, booking.collectionArea, booking.collectionPostcode) || null,
        contact: booking.collectionContact,
        phone: booking.collectionPhone,
        notes: booking.collectionNotes,
      }),

      // Via stops
      ...vias.map((v: any, i: number) => {
        const noteText = v.notes?.split("---ORDERS---")[0] || "";
        return React.createElement(LocationSection, {
          key: v.id || i,
          title: `Via Stop ${i + 1}${v.viaType && v.viaType !== "Via" ? ` — ${v.viaType}` : ""}`,
          color: "indigo",
          date: v.viaDate,
          time: v.viaTime,
          name: v.name,
          address: addrParts(v.address1, v.address2, v.area, v.postcode) || null,
          contact: v.contact,
          phone: v.phone,
          notes: noteText,
        });
      }),

      // Delivery
      React.createElement(LocationSection, {
        title: "Delivery",
        color: "blue",
        date: booking.deliveryDate || booking.collectionDate,
        time: booking.deliveryTime,
        name: booking.deliveryName,
        address: addrParts(booking.deliveryAddress1, booking.deliveryAddress2, booking.deliveryArea, booking.deliveryPostcode) || null,
        contact: booking.deliveryContact,
        phone: booking.deliveryPhone,
        notes: (booking.deliveryNotes || "").split("---ORDERS---")[0] || null,
      }),

      // Driver / Job Information
      React.createElement(Text, { style: S.sectionHeaderGrey }, "Driver / Job Information"),
      React.createElement(View, { style: S.body },
        React.createElement(View, { style: S.row },
          React.createElement(Text, { style: S.rowLabel }, "Driver:"),
          React.createElement(Text, { style: S.rowValue }, booking.driver?.name || "TBC")
        ),
        booking.secondMan?.name ? React.createElement(View, { style: S.row },
          React.createElement(Text, { style: S.rowLabel }, "2nd Man:"),
          React.createElement(Text, { style: S.rowValue }, booking.secondMan.name)
        ) : null,
        booking.cxDriver?.name ? React.createElement(View, { style: S.row },
          React.createElement(Text, { style: S.rowLabel }, "CX Driver:"),
          React.createElement(Text, { style: S.rowValue }, booking.cxDriver.name)
        ) : null,
        items ? React.createElement(View, { style: S.row },
          React.createElement(Text, { style: S.rowLabel }, "Items:"),
          React.createElement(Text, { style: S.rowValue }, items)
        ) : null,
        weight ? React.createElement(View, { style: S.row },
          React.createElement(Text, { style: S.rowLabel }, "Weight:"),
          React.createElement(Text, { style: S.rowValue }, weight)
        ) : null,
        units.length > 0 ? React.createElement(View, { style: S.row },
          React.createElement(Text, { style: S.rowLabel }, "Temp Units:"),
          React.createElement(Text, { style: S.rowValue }, units.map((u: any) => `${u.unitType || "Unit"}: ${u.unitNumber}`).join("  |  "))
        ) : null,
      ),

      // Main job notes — highlighted box
      rawJobNotes ? React.createElement(View, { style: S.notesBox },
        React.createElement(Text, { style: S.notesLabel }, "DRIVER NOTES"),
        React.createElement(Text, { style: S.notesText }, rawJobNotes),
      ) : null,

      // Footer — company name only
      React.createElement(Text, { style: S.footer }, company),
    )
  );
}

// ─── API Route ────────────────────────────────────────────────────────────────

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

  const jobRef = booking.jobRef || booking.id.slice(-8).toUpperCase();
  const from = settings?.cemail || process.env.SMTP_USER || "noreply@mptransport.com";
  const subject = `Job Sheet — ${jobRef} — ${booking.customer?.name || ""}`;

  try {
    const pdfBuffer = await renderToBuffer(React.createElement(JobSheetDoc, { booking, settings }));

    const smtpPort = parseInt(process.env.SMTP_PORT || "587");
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.mailtrap.io",
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: process.env.SMTP_USER || "", pass: process.env.SMTP_PASS || "" },
    });

    await transporter.sendMail({
      from,
      to: email.trim(),
      subject,
      text: `Please find attached the job sheet for ${jobRef}.`,
      attachments: [{
        filename: `JobSheet-${jobRef}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      }],
    });

    return NextResponse.json({ sent: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to send email" }, { status: 500 });
  }
}


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
    const smtpPort = parseInt(process.env.SMTP_PORT || "587");
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.mailtrap.io",
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: process.env.SMTP_USER || "", pass: process.env.SMTP_PASS || "" },
    });
    await transporter.sendMail({ from, to: email.trim(), subject, html });
    return NextResponse.json({ sent: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to send email" }, { status: 500 });
  }
}
