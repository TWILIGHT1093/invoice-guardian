import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createConnectedAccount, createAccountLink } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  let accountId = user.stripeAccountId;

  if (!accountId) {
    const account = await createConnectedAccount(user.email);
    accountId = account.id;

    await prisma.user.update({
      where: { id: user.id },
      data: { stripeAccountId: accountId },
    });
  }

  const origin = req.headers.get("origin") || "http://localhost:3000";
  const link = await createAccountLink(accountId, origin);

  return NextResponse.json({ url: link.url });
}
