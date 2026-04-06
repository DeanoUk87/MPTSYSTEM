import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const messages = await prisma.adminComposer.findMany({
    include: { messageBy: { select: { name: true } }, _count: { select: { messagesStatus: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(messages);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, message, messageType, toDesc, fromEmail, document } = await req.json();
  const userId = (session.user as any)?.id;

  const composer = await prisma.adminComposer.create({
    data: { title, message, messageType, toDesc, fromEmail, document, messageById: userId },
  });

  // Pre-create message_status entries for all customers with emails
  const customers = await prisma.customer.findMany({
    where: { customerEmail: { not: "" } },
  });
  for (const c of customers) {
    await prisma.messageStatus.create({
      data: { messageId: composer.id, customerId: c.id, sentStatus: 0 },
    });
  }

  return NextResponse.json(composer, { status: 201 });
}
