import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const invoices = await prisma.invoice.findMany({
    where: { userId: session.user.id },
    orderBy: { dueDate: "desc" },
    include: {
      reminders: {
        orderBy: { stage: "desc" },
        take: 1,
      },
    },
  });

  return NextResponse.json(invoices);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { clientName, clientEmail, amount, invoiceNumber, dueDate } = body;

  if (!clientName || !amount || !dueDate) {
    return NextResponse.json(
      { error: "Client name, amount, and due date are required" },
      { status: 400 }
    );
  }

  const invoice = await prisma.invoice.create({
    data: {
      userId: session.user.id,
      source: "manual",
      clientName,
      clientEmail: clientEmail || null,
      amount: parseFloat(amount),
      invoiceNumber: invoiceNumber || null,
      dueDate: new Date(dueDate),
      status: "unpaid",
    },
  });

  return NextResponse.json(invoice);
}
