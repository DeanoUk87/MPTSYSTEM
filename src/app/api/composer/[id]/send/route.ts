import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import nodemailer from "nodemailer";

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.mailtrap.io",
    port: parseInt(process.env.SMTP_PORT || "587"),
    auth: { user: process.env.SMTP_USER || "", pass: process.env.SMTP_PASS || "" },
  });
}

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const settings = await prisma.settings.findFirst();
  const sendLimit = settings?.sendLimit ?? 50;

  const composer = await prisma.adminComposer.findUnique({ where: { id } });
  if (!composer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const pending = await prisma.messageStatus.findMany({
    where: { messageId: id, sentStatus: 0 },
    include: { customer: true },
    take: sendLimit,
  });

  const transporter = getTransporter();
  let sent = 0;
  let failed = 0;

  for (const ms of pending) {
    const emails = ms.customer.customerEmail.split(",").map((e) => e.trim()).filter(Boolean);
    try {
      await transporter.sendMail({
        from: composer.fromEmail || settings?.cemail || process.env.SMTP_USER || "noreply@mpbooking.com",
        to: emails.join(", "),
        subject: composer.title,
        html: composer.message,
      });
      await prisma.messageStatus.update({
        where: { id: ms.id },
        data: { sentStatus: 1, sentAt: new Date() },
      });
      sent++;
    } catch {
      failed++;
    }
  }

  return NextResponse.json({ sent, failed, remaining: pending.length - sent });
}
