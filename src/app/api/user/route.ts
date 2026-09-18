import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/requireUser";

function safeUser(user: typeof users.$inferSelect) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    timezone: user.timezone,
    date_format: user.date_format,
    theme: user.theme,
    created_at: user.created_at,
  };
}

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: safeUser(user),
    });
  } catch (error) {
    console.error("GET /api/user error:", error);

    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const updateData: Partial<typeof users.$inferInsert> = {};

    if (typeof body.name === "string") {
      updateData.name = body.name;
    }

    if (typeof body.avatar === "string") {
      updateData.avatar = body.avatar;
    }

    if (typeof body.timezone === "string") {
      updateData.timezone = body.timezone;
    }

    if (typeof body.date_format === "string") {
      updateData.date_format = body.date_format;
    }

    if (
      typeof body.theme === "string" ||
      typeof body.theme === "object"
    ) {
      updateData.theme =
        typeof body.theme === "string"
          ? body.theme
          : JSON.stringify(body.theme);
    }

    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, currentUser.id))
      .returning();

    if (!updatedUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: safeUser(updatedUser),
    });
  } catch (error) {
    console.error("PATCH /api/user error:", error);

    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}