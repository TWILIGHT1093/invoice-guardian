import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "invoice.paid") {
    const invoice = event.data.object;
    const stripeInvoiceId = invoice.id;

    // Find and update the invoice in our database
    const dbInvoice = await prisma.invoice.findFirst({
      where: { stripeInvoiceId },
    });

    if (dbInvoice) {
      await prisma.invoice.update({
        where: { id: dbInvoice.id },
        data: {
          status: "paid",
          currentStage: 0,
          nextFollowUpDate: null,
        },
      });

      // Mark any pending reminders as skipped
      await prisma.reminder.updateMany({
        where: {
          invoiceId: dbInvoice.id,
          status: "draft",
        },
        data: { status: "skipped" },
      });
    }
  }

  return NextResponse.json({ received: true });
}
