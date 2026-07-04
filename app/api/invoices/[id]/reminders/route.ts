import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateNextStage, getDaysOverdue } from "@/lib/scheduler";
import { renderTemplate, buildReminderVariables } from "@/lib/templates";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const reminders = await prisma.reminder.findMany({
    where: {
      invoiceId: id,
      invoice: { userId: session.user.id },
    },
    orderBy: { stage: "asc" },
  });

  return NextResponse.json(reminders);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const invoice = await prisma.invoice.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  if (invoice.status === "paid") {
    return NextResponse.json(
      { error: "Cannot create reminders for paid invoices" },
      { status: 400 }
    );
  }

  // Get user settings for timing
  const settings = await prisma.userSetting.findUnique({
    where: { userId: session.user.id },
  });

  const stageDays = settings
    ? [
        settings.stage1DaysAfterDue,
        settings.stage2DaysAfterDue,
        settings.stage3DaysAfterDue,
        settings.stage4DaysAfterDue,
      ]
    : [0, 7, 14, 30];

  // Calculate next stage
  const result = calculateNextStage(invoice.currentStage, invoice.dueDate, stageDays);
  if (!result) {
    return NextResponse.json(
      { error: "Invoice has completed all follow-up stages" },
      { status: 400 }
    );
  }

  // Get the email template for this stage
  const template = await prisma.emailTemplate.findFirst({
    where: {
      userId: session.user.id,
      stage: result.nextStage,
    },
  });

  if (!template) {
    return NextResponse.json(
      { error: `No email template found for stage ${result.nextStage}` },
      { status: 400 }
    );
  }

  // Render the template with invoice variables
  const daysOverdue = getDaysOverdue(invoice.dueDate);
  const variables = buildReminderVariables({
    clientName: invoice.clientName,
    amount: invoice.amount,
    invoiceNumber: invoice.invoiceNumber,
    dueDate: invoice.dueDate,
    daysOverdue,
  });

  const renderedSubject = renderTemplate(template.subject, variables);
  const renderedBody = renderTemplate(template.body, variables);

  // Create the reminder as draft
  const reminder = await prisma.reminder.create({
    data: {
      invoiceId: invoice.id,
      stage: result.nextStage,
      scheduledDate: result.nextDate,
      status: "draft",
      subject: renderedSubject,
      body: renderedBody,
    },
  });

  // Update invoice tracking
  await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      currentStage: result.nextStage,
      nextFollowUpDate: result.nextDate,
      lastFollowUpDate: new Date(),
    },
  });

  return NextResponse.json(reminder);
}
