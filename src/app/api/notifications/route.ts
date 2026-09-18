import { NextResponse } from "next/server";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/requireUser";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const items = await db
      .select()
      .from(notifications)
      .where(eq(notifications.user_id, user.id))
      .orderBy(desc(notifications.created_at));

    const unreadCount = items.filter((n) => !n.read).length;

    return NextResponse.json({
      notifications: items,
      unreadCount,
    });
  } catch (error) {
    console.error("GET /api/notifications error:", error);

    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, markAllRead } = body;

    if (markAllRead) {
      await db
        .update(notifications)
        .set({ read: true })
        .where(eq(notifications.user_id, user.id));

      return NextResponse.json({
        success: true,
      });
    }

    if (id) {
      const [updatedNotification] = await db
        .update(notifications)
        .set({ read: true })
        .where(
          and(
            eq(notifications.id, Number(id)),
            eq(notifications.user_id, user.id)
          )
        )
        .returning();

      if (!updatedNotification) {
        return NextResponse.json(
          { error: "Notification not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
      });
    }

    return NextResponse.json(
      { error: "Invalid payload" },
      { status: 400 }
    );
  } catch (error) {
    console.error(
      "PATCH /api/notifications error:",
      error
    );

    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 }
    );
  }
}