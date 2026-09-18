import { NextResponse } from "next/server";
import { db } from "@/db";
import { quotes } from "@/db/schema";
import { eq, asc, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/requireUser";

export async function GET() {
  const totalStart = Date.now();

  try {
    const userStart = Date.now();

    const user = await getCurrentUser();

    console.log(
      `[QUOTES] getCurrentUser: ${Date.now() - userStart}ms`
    );

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const quotesStart = Date.now();

    const allQuotes = await db
      .select()
      .from(quotes)
      .where(eq(quotes.user_id, user.id))
      .orderBy(asc(quotes.sort_order), asc(quotes.created_at));

    console.log(
      `[QUOTES] database query: ${Date.now() - quotesStart}ms`
    );

    console.log(
      `[QUOTES] total: ${Date.now() - totalStart}ms`
    );

    return NextResponse.json({
      quotes: allQuotes,
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