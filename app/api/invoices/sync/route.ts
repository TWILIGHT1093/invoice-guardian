import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripeInvoices } from "@/lib/stripe";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user?.stripeAccountId) {
    return NextResponse.json(
      { error: "Stripe account not connected" },
      { status: 400 }
    );
  }

  try {
    const stripeInvoices = await getStripeInvoices(user.stripeAccountId);

    let synced = 0;
    for (const inv of stripeInvoices) {
      if (inv.status === "paid") continue;

      const existing = await prisma.invoice.findFirst({
        where: { stripeInvoiceId: inv.id },
      });

      if (!existing) {
        await prisma.invoice.create({
          data: {
            userId: user.id,
            source: "stripe",
            stripeInvoiceId: inv.id,
            clientName:
              inv.customer_name ||
              inv.customer_email ||
              "Unknown Client",
            clientEmail: inv.customer_email || null,
            amount: inv.amount_due / 100,
            currency: inv.currency,
            invoiceNumber: inv.number || null,
            dueDate: new Date((inv.due_date ?? Math.floor(Date.now() / 1000)) * 1000),
            status: "unpaid",
          },
        });
        synced++;
      } else {
        // Update status if changed
        const newStatus = "unpaid";
        if (existing.status !== newStatus) {
          await prisma.invoice.update({
            where: { id: existing.id },
            data: { status: newStatus },
          });
        }
      }
    }

    return NextResponse.json({ synced });
  } catch (error) {
    console.error("Stripe sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync with Stripe" },
      { status: 500 }
    );
  }
}
