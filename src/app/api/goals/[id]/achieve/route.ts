import { NextResponse } from "next/server";
import { db } from "@/db";
import { goals, goal_categories } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/requireUser";

export async function POST(
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
    const goalId = Number(id);

    if (!Number.isInteger(goalId)) {
      return NextResponse.json(
        { error: "Invalid goal ID" },
        { status: 400 }
      );
    }

    const [goal] = await db
      .select({
        id: goals.id,
        is_achieved: goals.is_achieved,
      })
      .from(goals)
      .innerJoin(
        goal_categories,
        eq(goals.category_id, goal_categories.id)
      )
      .where(
        and(
          eq(goals.id, goalId),
          eq(goal_categories.user_id, user.id)
        )
      )
      .limit(1);

    if (!goal) {
      return NextResponse.json(
        { error: "Goal not found" },
        { status: 404 }
      );
    }

    if (goal.is_achieved) {
      return NextResponse.json(
        { error: "This goal has already been achieved and cannot be undone" },
        { status: 409 }
      );
    }

    const [updatedGoal] = await db
      .update(goals)
      .set({
        is_achieved: true,
        achieved_at: new Date(),
      })
      .where(eq(goals.id, goalId))
      .returning();

    return NextResponse.json({
      goal: updatedGoal,
    });
  } catch (error) {
    console.error(
      "POST /api/goals/[id]/achieve error:",
      error
    );

    return NextResponse.json(
      { error: "Failed to achieve goal" },
      { status: 500 }
    );
  }
}