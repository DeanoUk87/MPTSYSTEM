import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import nodemailer from "nodemailer";

// ─── Pure-JS PDF generation (no WASM dependencies) ───────────────────────────

function fmt(s?: string | null) {
  if (!s) return "";
  const p = s.split("-");
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : s;
}

function addrParts(...parts: (string | null | undefined)[]) {
  return parts.filter(Boolean).join(", ") || "";
}

/* Colours */
const C = {
  navy: "#1a3a5c",
  blue: "#1e4976",
  indigo: "#4338ca",
  grey: "#374151",
  text: "#374151",
  muted: "#6b7280",
  light: "#9ca3af",
  amber: "#b45309",
  amberDark: "#92400e",
  bannerBg: "#eff6ff",
  bannerBorder: "#dde4f5",
  rowBorder: "#f1f5f9",
  notesBg: "#fffbeb",
  notesBorder: "#f59e0b",
  white: "#ffffff",
};

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

async function buildJobSheetPdf(booking: any, settings: any): Promise<Buffer> {
  const PDFDocument = (await import("pdfkit")).default;

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({ size: "A4", margin: 0, bufferPages: true });
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = 595.28; // A4 width in points
    const M = 20; // margin
    const bodyX = M;
    const bodyW = W - 2 * M;
    let y = 0;

    const company = settings?.companyName || "MP Transport";
    const logoDataUrl: string | null = settings?.logo || null;
    const jobRef = (booking as any).jobRef || booking.id.slice(-8).toUpperCase();
    const vias: any[] = booking.viaAddresses || [];
    const rawJobNotes = booking.jobNotes || "";
    const items = booking.numberOfItems ? String(booking.numberOfItems) : null;
    const weight = booking.weight ? `${booking.weight} kg` : null;
    const miles = booking.miles ? `${Number(booking.miles).toFixed(1)} mi` : null;
    const units = [booking.chillUnit, booking.ambientUnit].filter(Boolean);

    // ─── Header bar ───────────────────────────────────────────────────────
    const headerH = 60;
    doc.rect(0, 0, W, headerH).fill(C.navy);
    // Logo or company name
    if (logoDataUrl && logoDataUrl.startsWith("data:image")) {
      try {
        const base64 = logoDataUrl.split(",")[1];
        const imgBuf = Buffer.from(base64, "base64");
        doc.image(imgBuf, M, 8, { height: 44, fit: [200, 44] });
      } catch {
        doc.fillColor(C.white).font("Helvetica-Bold").fontSize(16).text(company, M, 14, { width: 300 });
      }
    } else {
      doc.fillColor(C.white).font("Helvetica-Bold").fontSize(16).text(company, M, 14, { width: 300 });
    }
    if (settings?.companyAddress1) {
      doc.font("Helvetica").fontSize(8).fillColor("#c0c8d4")
        .text(addrParts(settings.companyAddress1, settings.city, settings.postcode), M, 34, { width: 300 });
    }
    if (settings?.phone) {
      doc.text(`Tel: ${settings.phone}`, M, 44, { width: 300 });
    }
    // Job ref box (right side) — REMOVED (already in banner below)
    y = headerH;

    // ─── Customer banner ──────────────────────────────────────────────────
    const bannerH = 36;
    doc.rect(0, y, W, bannerH).fill(C.bannerBg);
    doc.moveTo(0, y + bannerH).lineTo(W, y + bannerH).lineWidth(1).strokeColor(C.bannerBorder).stroke();

    const bannerCols = [
      { label: "Customer", value: booking.customer?.name || "—" },
      { label: "Job Ref", value: jobRef },
      { label: "Vehicle", value: booking.vehicle?.name || "—" },
    ];
    if (miles) bannerCols.push({ label: "Mileage", value: miles });
    const colW = bodyW / bannerCols.length;
    bannerCols.forEach((col, i) => {
      const cx = M + i * colW;
      doc.fillColor(C.muted).font("Helvetica").fontSize(7).text(col.label.toUpperCase(), cx, y + 6, { width: colW });
      doc.fillColor("#111827").font("Helvetica-Bold").fontSize(10).text(col.value, cx, y + 18, { width: colW });
    });
    y += bannerH + 1;

    // ─── Helpers ──────────────────────────────────────────────────────────

    function sectionHeader(title: string, color: string, iconType?: "parcel" | "pin" | "factory") {
      if (y > 750) { doc.addPage(); y = M; }
      const isLight = color === "#f0f4ff";
      doc.rect(0, y, W, 26).fill(color);
      const textColor = isLight ? "#4338ca" : C.white;
      const iconX = M;
      const textX = iconType ? M + 16 : M;

      // Simple text-based icons (Helvetica-safe)
      if (iconType) {
        const iconChar = iconType === "parcel" ? ">" : iconType === "pin" ? ">" : ">";
        doc.fillColor(textColor).font("Helvetica-Bold").fontSize(10).text(iconChar, iconX, y + 8, { width: 14 });
      }

      doc.fillColor(textColor).font("Helvetica-Bold").fontSize(9).text(title.toUpperCase(), textX, y + 8, { width: bodyW - (textX - M) });
      y += 26;
      y += 6; // spacing between header and rows
    }

    function row(label: string, value: string | null | undefined, valueColor = C.text) {
      if (!value?.trim()) return;
      if (y > 780) { doc.addPage(); y = M; }
      const rowH = 16;
      doc.moveTo(M, y + rowH).lineTo(W - M, y + rowH).lineWidth(0.5).strokeColor(C.rowBorder).stroke();
      doc.fillColor(C.text).font("Helvetica-Bold").fontSize(9).text(label, M, y + 3, { width: 100 });
      doc.fillColor(valueColor).font("Helvetica").fontSize(9).text(value.trim(), M + 104, y + 3, { width: bodyW - 104 });
      y += rowH;
    }

    function locationSection(title: string, color: string, icon: "parcel" | "pin" | "factory", data: {
      date?: string | null; time?: string | null; name?: string | null; address?: string | null;
      contact?: string | null; phone?: string | null; notes?: string | null; orders?: { ref: string; types: string[] }[];
    }) {
      sectionHeader(title, color, icon);
      row("Date:", fmt(data.date) || "—");
      row("Time:", data.time || "—");
      row("Name:", data.name || "—");
      row("Address:", data.address || "—");
      if (data.contact) row("Contact Name:", data.contact);
      if (data.phone) row("Telephone:", data.phone);
      if (data.notes?.trim()) row("Notes:", data.notes.trim(), C.amber);
      if (data.orders && data.orders.length > 0) {
        const orderText = data.orders.map(o => `${o.ref || "—"}${o.types.length ? ` (${o.types.join("+")})` : ""}`).join("  |  ");
        row("Collected Orders:", orderText, C.indigo);
      }
    }

    // ─── Collection ───────────────────────────────────────────────────────
    locationSection("Collection", C.blue, "parcel", {
      date: booking.collectionDate, time: booking.collectionTime,
      name: booking.collectionName,
      address: addrParts(booking.collectionAddress1, booking.collectionAddress2, booking.collectionArea, booking.collectionPostcode) || null,
      contact: booking.collectionContact, phone: booking.collectionPhone, notes: booking.collectionNotes,
    });

    // ─── Via stops ────────────────────────────────────────────────────────
    vias.forEach((v: any, i: number) => {
      let noteText = v.notes || "";
      let orders: { ref: string; types: string[] }[] = [];
      if (noteText.includes("---ORDERS---")) {
        const [text, ordJson] = noteText.split("---ORDERS---");
        noteText = text;
        try {
          const raw = JSON.parse(ordJson || "[]");
          orders = raw.map((o: any) => ({ ref: o.ref || "", types: Array.isArray(o.types) ? o.types : o.type ? [o.type] : [] }));
        } catch { orders = []; }
      }
      const label = `Via Stop ${i + 1}${v.viaType && v.viaType !== "Via" ? ` \u2014 ${v.viaType}` : ""}`;
      locationSection(label, "#f0f4ff", "pin", {
        date: v.viaDate, time: v.viaTime, name: v.name,
        address: addrParts(v.address1, v.address2, v.area, v.postcode) || null,
        contact: v.contact, phone: v.phone, notes: noteText, orders,
      });
    });

    // ─── Delivery ─────────────────────────────────────────────────────────
    {
      const rawDelivNotes = booking.deliveryNotes || "";
      let delivNoteText = rawDelivNotes;
      let delivOrders: { ref: string; types: string[] }[] = [];
      if (rawDelivNotes.includes("---ORDERS---")) {
        const [text, ordJson] = rawDelivNotes.split("---ORDERS---");
        delivNoteText = text;
        try {
          const raw = JSON.parse(ordJson || "[]");
          delivOrders = raw.map((o: any) => ({ ref: o.ref || "", types: Array.isArray(o.types) ? o.types : o.type ? [o.type] : [] }));
        } catch { delivOrders = []; }
      }
      locationSection("Delivery", C.blue, "factory", {
        date: booking.deliveryDate || booking.collectionDate, time: booking.deliveryTime,
        name: booking.deliveryName,
        address: addrParts(booking.deliveryAddress1, booking.deliveryAddress2, booking.deliveryArea, booking.deliveryPostcode) || null,
        contact: booking.deliveryContact, phone: booking.deliveryPhone,
        notes: delivNoteText || null, orders: delivOrders,
      });
    }

    // ─── Driver / Job Information ─────────────────────────────────────────
    sectionHeader("Driver / Job Information", C.grey);
    row("Driver:", booking.driver?.name || "TBC");
    if (booking.secondMan?.name) row("2nd Man:", booking.secondMan.name);
    if (booking.cxDriver?.name) row("CX Driver:", booking.cxDriver.name);
    if (items) row("Items:", items);
    if (weight) row("Weight:", weight);
    if (units.length > 0) row("Temp Units:", units.map((u: any) => `${u.unitType || "Unit"}: ${u.unitNumber}`).join("  |  "));

    // ─── Driver notes (highlighted box) ───────────────────────────────────
    if (rawJobNotes) {
      y += 6;
      if (y > 740) { doc.addPage(); y = M; }
      const noteX = M;
      const noteW = bodyW;
      const textW = noteW - 18;
      // measure height
      const measuredH = doc.font("Helvetica").fontSize(9).heightOfString(rawJobNotes, { width: textW });
      const boxH = measuredH + 28;
      // background
      doc.roundedRect(noteX, y, noteW, boxH, 4).fill(C.notesBg);
      // left accent bar
      doc.rect(noteX, y, 3, boxH).fill(C.notesBorder);
      // label
      doc.fillColor(C.amber).font("Helvetica-Bold").fontSize(8).text("DRIVER NOTES", noteX + 10, y + 6, { width: textW });
      doc.fillColor(C.amberDark).font("Helvetica").fontSize(9).text(rawJobNotes, noteX + 10, y + 18, { width: textW });
      y += boxH;
    }

    // ─── Footer ───────────────────────────────────────────────────────────
    doc.fillColor(C.light).font("Helvetica").fontSize(8).text(company, 0, 820, { width: W, align: "center" });

    doc.end();
  });
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
        viaAddresses: { orderBy: { createdAt: "asc" } },
      },
    }),
    prisma.settings.findFirst(),
  ]);

  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  const jobRef = (booking as any).jobRef || booking.id.slice(-8).toUpperCase();
  const from = settings?.cemail || process.env.SMTP_USER || "noreply@mptransport.com";
  const subject = `Job Sheet — ${jobRef} — ${booking.customer?.name || ""}`;

  try {
    const pdfBuffer = await buildJobSheetPdf(booking, settings);

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


