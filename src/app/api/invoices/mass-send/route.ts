import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import nodemailer from "nodemailer";

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.mailtrap.io",
    port: parseInt(process.env.SMTP_PORT || "587"),
    auth: {
      user: process.env.SMTP_USER || "",
      pass: process.env.SMTP_PASS || "",
    },
  });
}

export async function POST(_req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await prisma.settings.findFirst();
  const sendLimit = settings?.sendLimit ?? 50;
  const from = settings?.cemail || process.env.SMTP_USER || "noreply@mpbooking.com";
  const subject = settings?.messageTitle || "Your Invoice is Ready";

  const invoices = await prisma.invoice.findMany({
    where: { emailStatus: 0 },
    take: sendLimit,
    include: { customer: true },
  });

  if (!invoices.length) {
    return NextResponse.json({ sent: 0, message: "No unsent invoices." });
  }

  const transporter = getTransporter();
  let sent = 0;
  let failed = 0;

  for (const invoice of invoices) {
    const customer = invoice.customer;
    if (!customer?.customerEmail) { failed++; continue; }

    const body = (settings?.defaultMessage2 || "Please find attached your invoice {invoice_number}.")
      .replace("{invoice_number}", invoice.invoiceNumber);

    const toAddresses = customer.customerEmail.split(",").map((e) => e.trim()).filter(Boolean);
    const bcc = customer.customerEmailBcc?.trim() || undefined;

    try {
      await transporter.sendMail({
        from,
        to: toAddresses.join(", "),
        bcc,
        subject,
        html: `<p>${body.replace(/\n/g, "<br>")}</p><p><em>Invoice: ${invoice.invoiceNumber} | Due: ${invoice.dueDate ?? "N/A"}</em></p>`,
      });

      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { emailStatus: 1, printer: 2 },
      });
      await prisma.sale.updateMany({
        where: { invoiceNumber: invoice.invoiceNumber },
        data: { msCreated: 1 },
      });
      sent++;
    } catch {
      failed++;
    }
  }

  return NextResponse.json({ sent, failed, total: invoices.length });
}
