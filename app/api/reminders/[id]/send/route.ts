import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const reminder = await prisma.reminder.findFirst({
    where: { id, invoice: { userId: session.user.id } },
    include: { invoice: true },
  });

  if (!reminder) {
    return NextResponse.json({ error: "Reminder not found" }, { status: 404 });
  }

  if (reminder.status !== "draft") {
    return NextResponse.json(
      { error: "Reminder is not in draft status" },
      { status: 400 }
    );
  }

  if (!reminder.invoice.clientEmail) {
    return NextResponse.json(
      { error: "Invoice has no client email address" },
      { status: 400 }
    );
  }

  try {
    await sendEmail({
      to: reminder.invoice.clientEmail,
      subject: reminder.subject,
      html: reminder.body.replace(/\n/g, "<br>"),
    });

    await prisma.reminder.update({
      where: { id: reminder.id },
      data: {
        status: "sent",
        sentAt: new Date(),
      },
    });

    // Update invoice tracking: clear next follow-up since we just sent one
    await prisma.invoice.update({
      where: { id: reminder.invoiceId },
      data: {
        lastFollowUpDate: new Date(),
        nextFollowUpDate: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to send email:", error);
    const message = error instanceof Error ? error.message : "Failed to send email";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
