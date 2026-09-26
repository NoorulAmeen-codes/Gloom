import { NextResponse } from "next/server";
import { db } from "@/db";
import { goal_categories } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
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

    const categories = await db
      .select()
      .from(goal_categories)
      .where(eq(goal_categories.user_id, user.id))
      .orderBy(asc(goal_categories.id));

    return NextResponse.json({
      categories,
    });
  } catch (error) {
    console.error("GET /api/goal-categories error:", error);

    return NextResponse.json(
      { error: "Failed to load goal categories" },
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

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const icon =
      typeof body.icon === "string" && body.icon.trim()
        ? body.icon.trim()
        : "🎯";

    if (!name) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }

    const [category] = await db
      .insert(goal_categories)
      .values({
        user_id: user.id,
        name,
        icon,
      })
      .returning();

    return NextResponse.json(
      { category },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/goal-categories error:", error);

    return NextResponse.json(
      { error: "Failed to create goal category" },
      { status: 500 }
    );
  }
}