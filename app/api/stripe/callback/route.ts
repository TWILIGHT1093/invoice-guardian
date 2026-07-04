import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Check if onboarding is complete by checking the account status
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (user?.stripeAccountId) {
    // Mark onboarding as complete when they return
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeOnboardingComplete: true },
    });
  }

  return NextResponse.redirect(new URL("/settings", req.url));
}
