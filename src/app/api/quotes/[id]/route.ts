import { NextResponse } from "next/server";
import { db } from "@/db";
import { quotes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/requireUser";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const quoteId = parseInt(id, 10);

    if (isNaN(quoteId)) {
      return NextResponse.json(
        { error: "Invalid quote ID" },
        { status: 400 }
      );
    }

    // Make sure this quote belongs to the logged-in user.
    const [existingQuote] = await db
      .select()
      .from(quotes)
      .where(
        and(
          eq(quotes.id, quoteId),
          eq(quotes.user_id, user.id)
        )
      );

    if (!existingQuote) {
      return NextResponse.json(
        { error: "Quote not found" },
        { status: 404 }
      );
    }

    const body = await request.json();

    const updateData: Partial<
      typeof quotes.$inferInsert
    > = {};

    if (typeof body.text === "string") {
      updateData.text = body.text.trim();
    }

    if (typeof body.author === "string") {
      updateData.author = body.author.trim();
    }

    if (
      typeof body.background_image_url === "string"
    ) {
      updateData.background_image_url =
        body.background_image_url;
    }

    const [updated] = await db
      .update(quotes)
      .set(updateData)
      .where(
        and(
          eq(quotes.id, quoteId),
          eq(quotes.user_id, user.id)
        )
      )
      .returning();

    return NextResponse.json({
      quote: updated,
    });
  } catch (error) {
    console.error(
      "PATCH /api/quotes/[id] error:",
      error
    );

    return NextResponse.json(
      { error: "Failed to update quote" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const quoteId = parseInt(id, 10);

    if (isNaN(quoteId)) {
      return NextResponse.json(
        { error: "Invalid quote ID" },
        { status: 400 }
      );
    }

    const [deleted] = await db
      .delete(quotes)
      .where(
        and(
          eq(quotes.id, quoteId),
          eq(quotes.user_id, user.id)
        )
      )
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { error: "Quote not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "DELETE /api/quotes/[id] error:",
      error
    );

    return NextResponse.json(
      { error: "Failed to delete quote" },
      { status: 500 }
    );
  }
}