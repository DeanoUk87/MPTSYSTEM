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

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { invoiceId } = await req.json();
  if (!invoiceId) return NextResponse.json({ error: "invoiceId required" }, { status: 400 });

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { customer: true },
  });
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  const customer = invoice.customer;
  if (!customer?.customerEmail) {
    return NextResponse.json({ error: "Customer has no email address" }, { status: 400 });
  }

  const settings = await prisma.settings.findFirst();
  const from = settings?.cemail || process.env.SMTP_USER || "noreply@mpbooking.com";
  const subject = settings?.messageTitle || "Your Invoice is Ready";
  const body = (settings?.defaultMessage2 || "Please find attached your invoice {invoice_number}.")
    .replace("{invoice_number}", invoice.invoiceNumber);

  const toAddresses = customer.customerEmail.split(",").map((e) => e.trim()).filter(Boolean);
  const bcc = customer.customerEmailBcc?.trim() || undefined;

  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from,
      to: toAddresses.join(", "),
      bcc,
      subject,
      html: `<p>${body.replace(/\n/g, "<br>")}</p><p><em>Invoice: ${invoice.invoiceNumber} | Due: ${invoice.dueDate ?? "N/A"}</em></p>`,
    });

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { emailStatus: 1, printer: 2 },
    });
    await prisma.sale.updateMany({
      where: { invoiceNumber: invoice.invoiceNumber },
      data: { msCreated: 1 },
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
