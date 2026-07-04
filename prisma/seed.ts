import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

const libsql = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const adapter = new PrismaLibSQL(libsql);
const prisma = new PrismaClient({ adapter });

const defaultTemplates = [
  {
    stage: 1,
    name: "Friendly Nudge",
    subject: "Invoice {{invoice_number}} — friendly reminder",
    body: `Hi {{client_name}},

I hope you're doing well! I wanted to follow up on invoice {{invoice_number}} for {{amount}}, which was due on {{due_date}}.

I know things can get busy, so I just wanted to make sure this didn't slip through the cracks. If you've already sent payment, please disregard this message.

If you have any questions about the invoice, I'm happy to help.

Best regards`,
  },
  {
    stage: 2,
    name: "Soft Deadline",
    subject: "Following up on Invoice {{invoice_number}}",
    body: `Hi {{client_name}},

I'm writing to follow up on invoice {{invoice_number}} for {{amount}}, which is now {{days_overdue}} days overdue.

I understand that sometimes payments get delayed, but I wanted to check in to see if there's anything I can help with. Perhaps there was an issue with the original invoice, or you need additional documentation?

Please let me know how you'd like to proceed.

Best regards`,
  },
  {
    stage: 3,
    name: "Late Fee Notice",
    subject: "Invoice {{invoice_number}} — late fee applied",
    body: `Hi {{client_name}},

This is a reminder that invoice {{invoice_number}} for {{amount}} is now {{days_overdue}} days past due.

Please be advised that a late fee may be applied to outstanding balances after this period. To avoid additional charges, please submit payment at your earliest convenience.

If you're experiencing difficulties, I'm open to discussing a payment plan.

Best regards`,
  },
  {
    stage: 4,
    name: "Escalation Warning",
    subject: "Final notice — Invoice {{invoice_number}}",
    body: `Hi {{client_name}},

This is my final notice regarding invoice {{invoice_number}} for {{amount}}, which is now {{days_overdue}} days overdue.

Despite multiple attempts to contact you, this invoice remains unpaid. If payment is not received within the next 7 days, I will be forced to take further action to recover the outstanding amount.

Please resolve this matter immediately to avoid any escalation.

Best regards`,
  },
];

const defaultExcuses = [
  {
    title: "I thought I paid already",
    response:
      "I understand the confusion! Let me check our records. It looks like the payment hasn't been received yet. Would you like me to resend the invoice or confirm the payment details?",
  },
  {
    title: "Can we do a payment plan?",
    response:
      "Absolutely, I'm flexible and want to work with you. We can split the {{amount}} into manageable installments. What payment schedule would work best for your situation?",
  },
  {
    title: "I never received the invoice",
    response:
      "No problem! I'll resend the invoice right away. Could you confirm your current email address to make sure it goes to the right place?",
  },
  {
    title: "The project wasn't completed to my satisfaction",
    response:
      "I'm sorry to hear that. I'd like to understand your concerns better so we can find a resolution. Could you share specific feedback on what didn't meet your expectations?",
  },
  {
    title: "We're still reviewing the work",
    response:
      "I understand. Could you let me know when you expect the review to be complete? I want to make sure I'm available if you have any questions about the deliverables.",
  },
  {
    title: "We're waiting on funding from our client",
    response:
      "I appreciate you letting me know. While I understand the delay, I still need to account for this on my end. Could you provide an expected timeline for when the funding will come through?",
  },
];

async function main() {
  // Clean existing data
  await prisma.excuseResponse.deleteMany();
  await prisma.emailTemplate.deleteMany();

  // Seed system-wide default email templates (no userId = system defaults)
  for (const template of defaultTemplates) {
    await prisma.emailTemplate.create({
      data: {
        stage: template.stage,
        name: template.name,
        subject: template.subject,
        body: template.body,
        isDefault: true,
      },
    });
  }

  // Seed default excuse responses
  for (const excuse of defaultExcuses) {
    await prisma.excuseResponse.create({
      data: {
        title: excuse.title,
        response: excuse.response,
        isDefault: true,
      },
    });
  }

  console.log("Seeded default templates and excuse responses");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
