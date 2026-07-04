import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const excuses = await prisma.excuseResponse.findMany({
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(excuses);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { title, response } = body;

  if (!title || !response) {
    return NextResponse.json(
      { error: "Title and response are required" },
      { status: 400 }
    );
  }

  const excuse = await prisma.excuseResponse.create({
    data: {
      title,
      response,
      isDefault: false,
      userId: session.user.id,
    },
  });

  return NextResponse.json(excuse);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  const excuse = await prisma.excuseResponse.findUnique({ where: { id } });
  if (!excuse) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (excuse.isDefault && !excuse.userId) {
    return NextResponse.json(
      { error: "Cannot delete system defaults" },
      { status: 400 }
    );
  }

  await prisma.excuseResponse.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
