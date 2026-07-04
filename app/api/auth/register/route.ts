import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, password: hashed },
    });

    // Create default settings for the new user
    await prisma.userSetting.create({
      data: { userId: user.id },
    });

    // Copy system default email templates for this user
    const defaults = await prisma.emailTemplate.findMany({
      where: { isDefault: true, userId: null },
    });

    for (const def of defaults) {
      await prisma.emailTemplate.create({
        data: {
          userId: user.id,
          stage: def.stage,
          name: def.name,
          subject: def.subject,
          body: def.body,
          isDefault: false,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
