import { NextResponse } from "next/server";
import { db } from "@/db";
import { goals, goal_categories } from "@/db/schema";
import { eq, asc, and } from "drizzle-orm";
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

    const rows = await db
      .select({
        id: goals.id,
        category_id: goals.category_id,
        category_name: goal_categories.name,
        category_icon: goal_categories.icon,
        title: goals.title,
        description: goals.description,
        is_achieved: goals.is_achieved,
        achieved_at: goals.achieved_at,
        created_at: goals.created_at,
      })
      .from(goals)
      .innerJoin(
        goal_categories,
        eq(goals.category_id, goal_categories.id)
      )
      .where(eq(goal_categories.user_id, user.id))
      .orderBy(
        asc(goal_categories.id),
        asc(goals.id)
      );

    return NextResponse.json({
      goals: rows,
    });
  } catch (error) {
    console.error("GET /api/goals error:", error);

    return NextResponse.json(
      { error: "Failed to load goals" },
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

    const categoryId = Number(body.category_id);

    const title =
      typeof body.title === "string"
        ? body.title.trim()
        : "";

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : "";

    if (!Number.isInteger(categoryId)) {
      return NextResponse.json(
        { error: "Valid category is required" },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json(
        { error: "Goal title is required" },
        { status: 400 }
      );
    }

    const [category] = await db
  .select({
    id: goal_categories.id,
  })
  .from(goal_categories)
  .where(
    and(
      eq(goal_categories.id, categoryId),
      eq(goal_categories.user_id, user.id)
    )
  )
  .limit(1);

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    const [goal] = await db
      .insert(goals)
      .values({
        category_id: categoryId,
        title,
        description,
        is_achieved: false,
      })
      .returning();

    return NextResponse.json(
      { goal },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/goals error:", error);

    return NextResponse.json(
      { error: "Failed to create goal" },
      { status: 500 }
    );
  }
}