import { NextResponse } from "next/server";
import { db } from "@/db";
import { quotes } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/requireUser";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const order = body.order;

    if (
      !Array.isArray(order) ||
      !order.every(
        (item: unknown) =>
          typeof item === "object" &&
          item !== null &&
          typeof (item as { id?: unknown }).id === "number" &&
          typeof (item as { sort_order?: unknown }).sort_order === "number"
      )
    ) {
      return NextResponse.json(
        { error: "Invalid order data" },
        { status: 400 }
      );
    }

    for (const item of order) {
      await db
        .update(quotes)
        .set({
          sort_order: item.sort_order,
        })
        .where(
          and(
            eq(quotes.id, item.id),
            eq(quotes.user_id, user.id)
          )
        );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("POST /api/quotes/reorder error:", error);

    return NextResponse.json(
      { error: "Failed to save quote order" },
      { status: 500 }
    );
  }
}