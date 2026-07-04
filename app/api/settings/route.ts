import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await prisma.userSetting.findUnique({
    where: { userId: session.user.id },
  });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeAccountId: true, stripeOnboardingComplete: true },
  });

  const templates = await prisma.emailTemplate.findMany({
    where: { userId: session.user.id },
    orderBy: { stage: "asc" },
  });

  return NextResponse.json({ settings, user, templates });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { settings, templates } = body;

  if (settings) {
    await prisma.userSetting.upsert({
      where: { userId: session.user.id },
      update: {
        stage1DaysAfterDue: settings.stage1DaysAfterDue,
        stage2DaysAfterDue: settings.stage2DaysAfterDue,
        stage3DaysAfterDue: settings.stage3DaysAfterDue,
        stage4DaysAfterDue: settings.stage4DaysAfterDue,
      },
      create: {
        userId: session.user.id,
        stage1DaysAfterDue: settings.stage1DaysAfterDue,
        stage2DaysAfterDue: settings.stage2DaysAfterDue,
        stage3DaysAfterDue: settings.stage3DaysAfterDue,
        stage4DaysAfterDue: settings.stage4DaysAfterDue,
      },
    });
  }

  if (templates) {
    for (const t of templates) {
      await prisma.emailTemplate.upsert({
        where: { userId_stage: { userId: session.user.id, stage: t.stage } },
        update: { subject: t.subject, body: t.body, name: t.name },
        create: {
          userId: session.user.id,
          stage: t.stage,
          name: t.name,
          subject: t.subject,
          body: t.body,
        },
      });
    }
  }

  return NextResponse.json({ success: true });
}
