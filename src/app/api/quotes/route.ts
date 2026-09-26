import { NextResponse } from "next/server";
import { db } from "@/db";
import { quotes } from "@/db/schema";
import { eq, asc, desc } from "drizzle-orm";
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

    const allQuotes = await db
      .select({
        id: quotes.id,
        text: quotes.text,
        author: quotes.author,
        sort_order: quotes.sort_order,
        created_at: quotes.created_at,
      })
      .from(quotes)
      .where(eq(quotes.user_id, user.id))
      .orderBy(
        asc(quotes.sort_order),
        asc(quotes.created_at)
      );

    const quotesWithImageUrls = allQuotes.map((quote) => ({
      ...quote,
      background_image_url: `/api/quotes/${quote.id}/image`,
    }));

    return NextResponse.json({
      quotes: quotesWithImageUrls,
    });
  } catch (error) {
    console.error("GET /api/quotes error:", error);

    return NextResponse.json(
      { error: "Failed to fetch quotes" },
      { status: 500 }
    );
  }
}

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

    const {
      text,
      author,
      background_image_url,
    } = body;

    if (
      !text ||
      typeof text !== "string" ||
      !text.trim()
    ) {
      return NextResponse.json(
        { error: "Quote text is required" },
        { status: 400 }
      );
    }

    const fallbackBg =
      "https://images.pexels.com/photos/28253371/pexels-photo-28253371.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800";

      const [lastQuote] = await db
  .select({
    sort_order: quotes.sort_order,
  })
  .from(quotes)
  .where(eq(quotes.user_id, user.id))
  .orderBy(desc(quotes.sort_order))
  .limit(1);

const nextSortOrder = (lastQuote?.sort_order ?? -1) + 1;

    const [newQuote] = await db
      .insert(quotes)
      .values({
  user_id: user.id,
  text: text.trim(),
  sort_order: nextSortOrder,
        author:
          typeof author === "string"
            ? author.trim() || null
            : null,
        background_image_url:
          typeof background_image_url === "string" &&
          background_image_url.trim()
            ? background_image_url.trim()
            : fallbackBg,
      })
      .returning();

    return NextResponse.json(
      { quote: newQuote },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/quotes error:", error);

    return NextResponse.json(
      { error: "Failed to create quote" },
      { status: 500 }
    );
  }
}