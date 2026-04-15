import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import nodemailer from "nodemailer";
import React from "react";
// @react-pdf/renderer loaded lazily inside POST to prevent V8 WASM/large-bundle OOM at startup
let Document: any, Page: any, Text: any, View: any, renderToBuffer: any, PdfImage: any;
let S: any = null;
async function ensurePdfLoaded() {
  if (renderToBuffer) return;
  const pdf: any = await import("@react-pdf/renderer");
  Document = pdf.Document; Page = pdf.Page; Text = pdf.Text; View = pdf.View;
  renderToBuffer = pdf.renderToBuffer; PdfImage = pdf.Image;
  S = pdf.StyleSheet.create(rawStyles);
}

function fmt(s?: string | null) {
  if (!s) return "";
  const p = s.split("-");
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : s;
}

function addrParts(...parts: (string | null | undefined)[]) {
  return parts.filter(Boolean).join(", ") || "";
}

// ─── PDF Styles ───────────────────────────────────────────────────────────────

const rawStyles = {
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
};

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
        viaAddresses: { orderBy: { createdAt: "asc" } },
      },
    }),
    prisma.settings.findFirst(),
  ]);

  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  const jobRef = booking.jobRef || booking.id.slice(-8).toUpperCase();
  const from = settings?.cemail || process.env.SMTP_USER || "noreply@mptransport.com";
  const subject = `Job Sheet — ${jobRef} — ${booking.customer?.name || ""}`;

  try {
    await ensurePdfLoaded();
    const pdfBuffer = await renderToBuffer(
      React.createElement(JobSheetDoc, { booking, settings }) as any
    );

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


