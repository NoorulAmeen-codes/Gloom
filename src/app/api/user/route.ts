import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ensureSeedData } from "@/lib/seed";

export async function GET() {
  try {
    let [user] = await db.select().from(users).limit(1);
    if (!user) {
      user = await ensureSeedData();
    }
    return NextResponse.json({ user });
  } catch (error) {
    console.error("GET /api/user error:", error);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    let [user] = await db.select().from(users).limit(1);
    if (!user) {
      user = await ensureSeedData();
    }

    const updateData: Partial<typeof users.$inferInsert> = {};
    if (typeof body.name === "string") updateData.name = body.name;
    if (typeof body.avatar === "string") updateData.avatar = body.avatar;
    if (typeof body.timezone === "string") updateData.timezone = body.timezone;
    if (typeof body.date_format === "string") updateData.date_format = body.date_format;
    if (typeof body.theme === "string" || typeof body.theme === "object") {
      updateData.theme = typeof body.theme === "string" ? body.theme : JSON.stringify(body.theme);
    }

    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, user.id))
      .returning();

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("PATCH /api/user error:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
