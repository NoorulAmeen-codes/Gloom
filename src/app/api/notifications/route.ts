import { NextResponse } from "next/server";
import { db } from "@/db";
import { notifications, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { ensureSeedData } from "@/lib/seed";

export async function GET() {
  try {
    let [user] = await db.select().from(users).limit(1);
    if (!user) {
      user = await ensureSeedData();
    }

    const items = await db
      .select()
      .from(notifications)
      .orderBy(desc(notifications.created_at));

    const unreadCount = items.filter((n) => !n.read).length;

    return NextResponse.json({ notifications: items, unreadCount });
  } catch (error) {
    console.error("GET /api/notifications error:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, markAllRead } = body;

    if (markAllRead) {
      await db.update(notifications).set({ read: true });
      return NextResponse.json({ success: true });
    }

    if (id) {
      await db.update(notifications).set({ read: true }).where(eq(notifications.id, id));
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  } catch (error) {
    console.error("PATCH /api/notifications error:", error);
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
  }
}
