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
    // Job ref box (right side)
    const refBoxW = 100;
    const refBoxX = W - M - refBoxW;
    doc.roundedRect(refBoxX, 10, refBoxW, 40, 4).lineWidth(1).strokeColor("#ffffff").fillAndStroke("#2a4d6e", "#ffffff");
    doc.fillColor("#c0c8d4").font("Helvetica").fontSize(7).text("JOB REFERENCE", refBoxX, 16, { width: refBoxW, align: "center" });
    doc.fillColor(C.white).font("Helvetica-Bold").fontSize(14).text(jobRef, refBoxX, 28, { width: refBoxW, align: "center" });
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
      doc.rect(0, y, W, 24).fill(color);
      const textColor = isLight ? "#4338ca" : C.white;
      const iconX = M;
      const iconY = y + 5;
      const textX = iconType ? M + 18 : M;

      // Draw vector icons
      if (iconType === "parcel") {
        // Small parcel/box icon
        doc.save();
        doc.rect(iconX, iconY, 12, 10).lineWidth(1).strokeColor(textColor).stroke();
        doc.moveTo(iconX, iconY + 3).lineTo(iconX + 12, iconY + 3).strokeColor(textColor).stroke();
        doc.moveTo(iconX + 6, iconY + 3).lineTo(iconX + 6, iconY + 10).strokeColor(textColor).stroke();
        doc.restore();
      } else if (iconType === "pin") {
        // Map pin icon
        doc.save();
        doc.circle(iconX + 6, iconY + 4, 4).lineWidth(1).strokeColor(textColor).stroke();
        doc.circle(iconX + 6, iconY + 4, 1.5).fill(textColor);
        doc.moveTo(iconX + 3, iconY + 7).lineTo(iconX + 6, iconY + 13).lineTo(iconX + 9, iconY + 7).lineWidth(1).strokeColor(textColor).stroke();
        doc.restore();
      } else if (iconType === "factory") {
        // Factory/building icon
        doc.save();
        doc.rect(iconX, iconY + 2, 12, 10).lineWidth(1).strokeColor(textColor).stroke();
        doc.rect(iconX + 2, iconY + 5, 3, 3).fill(textColor);
        doc.rect(iconX + 7, iconY + 5, 3, 3).fill(textColor);
        doc.moveTo(iconX, iconY + 2).lineTo(iconX + 6, iconY - 1).lineTo(iconX + 12, iconY + 2).lineWidth(1).strokeColor(textColor).stroke();
        doc.restore();
      }

      doc.fillColor(textColor).font("Helvetica-Bold").fontSize(9).text(title.toUpperCase(), textX, y + 7, { width: bodyW - (textX - M) });
      y += 24;
      y += 4; // spacing between header and rows
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
      contact?: string | null; phone?: string | null; notes?: string | null;
    }) {
      sectionHeader(title, color, icon);
      row("Date:", fmt(data.date) || "—");
      row("Time:", data.time || "—");
      row("Name:", data.name || "—");
      row("Address:", data.address || "—");
      if (data.contact) row("Contact Name:", data.contact);
      if (data.phone) row("Telephone:", data.phone);
      if (data.notes?.trim()) row("Notes:", data.notes.trim(), C.amber);
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
      const noteText = v.notes?.split("---ORDERS---")[0] || "";
      const label = `Via Stop ${i + 1}${v.viaType && v.viaType !== "Via" ? ` \u2014 ${v.viaType}` : ""}`;
      locationSection(label, "#f0f4ff", "pin", {
        date: v.viaDate, time: v.viaTime, name: v.name,
        address: addrParts(v.address1, v.address2, v.area, v.postcode) || null,
        contact: v.contact, phone: v.phone, notes: noteText,
      });
    });

    // ─── Delivery ─────────────────────────────────────────────────────────
    locationSection("Delivery", C.blue, "factory", {
      date: booking.deliveryDate || booking.collectionDate, time: booking.deliveryTime,
      name: booking.deliveryName,
      address: addrParts(booking.deliveryAddress1, booking.deliveryAddress2, booking.deliveryArea, booking.deliveryPostcode) || null,
      contact: booking.deliveryContact, phone: booking.deliveryPhone,
      notes: (booking.deliveryNotes || "").split("---ORDERS---")[0] || null,
    });

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


