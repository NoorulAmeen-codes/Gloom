import { NextResponse } from "next/server";
import { db } from "@/db";
import { quotes, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { ensureSeedData } from "@/lib/seed";

export async function GET() {
  try {
    let [user] = await db.select().from(users).limit(1);
    if (!user) {
      user = await ensureSeedData();
    }

    const allQuotes = await db.select().from(quotes).orderBy(desc(quotes.created_at));
    return NextResponse.json({ quotes: allQuotes });
  } catch (error) {
    console.error("GET /api/quotes error:", error);
    return NextResponse.json({ error: "Failed to fetch quotes" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    let [user] = await db.select().from(users).limit(1);
    if (!user) {
      user = await ensureSeedData();
    }

    const body = await request.json();
    const { text, author, background_image_url } = body;

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ error: "Quote text is required" }, { status: 400 });
    }

    const fallbackBg = "https://images.pexels.com/photos/28253371/pexels-photo-28253371.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800";

    const [newQuote] = await db
      .insert(quotes)
      .values({
        user_id: user.id,
        text: text.trim(),
        author: author?.trim() || null,
        background_image_url: background_image_url?.trim() || fallbackBg,
      })
      .returning();

    return NextResponse.json({ quote: newQuote }, { status: 201 });
  } catch (error) {
    console.error("POST /api/quotes error:", error);
    return NextResponse.json({ error: "Failed to create quote" }, { status: 500 });
  }
}
