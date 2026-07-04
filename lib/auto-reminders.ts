import { prisma } from "./prisma";
import { getDueStages, getDaysOverdue } from "./scheduler";
import { renderTemplate, buildReminderVariables } from "./templates";

/**
 * For a given unpaid invoice, check all escalation stages and generate
 * draft reminders for any that have been crossed but don't have a reminder yet.
 */
export async function generateRemindersForInvoice(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
  });

  if (!invoice || invoice.status === "paid") return;

  const settings = await prisma.userSetting.findUnique({
    where: { userId: invoice.userId },
  });

  const stageDays = settings
    ? [
        settings.stage1DaysAfterDue,
        settings.stage2DaysAfterDue,
        settings.stage3DaysAfterDue,
        settings.stage4DaysAfterDue,
      ]
    : [0, 7, 14, 30];

  const dueStages = getDueStages(invoice.currentStage, invoice.dueDate, stageDays);

  for (const { stage, scheduledDate } of dueStages) {
    const existing = await prisma.reminder.findFirst({
      where: { invoiceId: invoice.id, stage },
    });

    if (existing) continue;

    const template = await prisma.emailTemplate.findFirst({
      where: { userId: invoice.userId, stage },
    });

    if (!template) continue;

    const daysOverdue = getDaysOverdue(invoice.dueDate);
    const variables = buildReminderVariables({
      clientName: invoice.clientName,
      amount: invoice.amount,
      invoiceNumber: invoice.invoiceNumber,
      dueDate: invoice.dueDate,
      daysOverdue,
    });

    await prisma.reminder.create({
      data: {
        invoiceId: invoice.id,
        stage,
        scheduledDate,
        status: "draft",
        subject: renderTemplate(template.subject, variables),
        body: renderTemplate(template.body, variables),
      },
    });

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        currentStage: stage,
        nextFollowUpDate: scheduledDate,
      },
    });
  }
}
