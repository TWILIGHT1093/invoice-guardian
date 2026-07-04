import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reminders = await prisma.reminder.findMany({
    where: {
      invoice: { userId: session.user.id },
      status: "draft",
    },
    include: { invoice: true },
    orderBy: { scheduledDate: "asc" },
  });

  return NextResponse.json(reminders);
}
