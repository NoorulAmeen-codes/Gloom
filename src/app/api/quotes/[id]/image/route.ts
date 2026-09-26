import { NextResponse } from "next/server";
import { db } from "@/db";
import { quotes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/requireUser";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return new NextResponse("Unauthorized", {
        status: 401,
      });
    }

    const { id } = await params;
    const quoteId = Number(id);

    if (!Number.isInteger(quoteId)) {
      return new NextResponse("Invalid quote ID", {
        status: 400,
      });
    }

    const [quote] = await db
      .select({
        background_image_url: quotes.background_image_url,
      })
      .from(quotes)
      .where(
        and(
          eq(quotes.id, quoteId),
          eq(quotes.user_id, user.id)
        )
      )
      .limit(1);

    if (!quote?.background_image_url) {
      return new NextResponse("Image not found", {
        status: 404,
      });
    }

    const dataUrl = quote.background_image_url;

        const match = dataUrl.match(
      /^data:([^;]+);base64,([\s\S]+)$/
    );

    if (!match) {
      return new NextResponse("Invalid image data", {
        status: 500,
      });
    }

    const contentType = match[1];
    const base64Data = match[2];

    const imageBuffer = Buffer.from(base64Data, "base64");

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control":
          "private, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error(
      "GET /api/quotes/[id]/image error:",
      error
    );

    return new NextResponse("Failed to load image", {
      status: 500,
    });
  }
}