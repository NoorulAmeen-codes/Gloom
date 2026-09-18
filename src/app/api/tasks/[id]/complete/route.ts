import { NextResponse } from "next/server";
import { db } from "@/db";
import { tasks, task_completions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/requireUser";
import { getTodayString } from "@/lib/date-utils";

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
    const taskId = parseInt(id, 10);

    if (isNaN(taskId)) {
      return NextResponse.json(
        { error: "Invalid task ID" },
        { status: 400 }
      );
    }

    // Make sure the task belongs to the logged-in user.
    const [task] = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.id, taskId),
          eq(tasks.user_id, user.id)
        )
      );

    if (!task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => ({}));

    const date =
      body.date ||
      getTodayString(user.timezone || undefined);

    const action = body.action || "toggle";

    const imageUrl =
      body.image_url !== undefined
        ? body.image_url
        : null;

    const notes =
      body.notes !== undefined
        ? body.notes
        : null;

    const [existingCompletion] = await db
      .select()
      .from(task_completions)
      .where(
        and(
          eq(task_completions.task_id, taskId),
          eq(task_completions.date, date)
        )
      );

    let completed = false;
    let completionRecord = null;

    if (
      action === "uncomplete" ||
      (action === "toggle" && existingCompletion)
    ) {
      if (existingCompletion) {
        await db
          .delete(task_completions)
          .where(
            eq(
              task_completions.id,
              existingCompletion.id
            )
          );
      }

      completed = false;
    } else {
      // Complete or update completion.
      if (existingCompletion) {
        const [updated] = await db
          .update(task_completions)
          .set({
            image_url:
              imageUrl !== null
                ? imageUrl
                : existingCompletion.image_url,

            notes:
              notes !== null
                ? notes
                : existingCompletion.notes,

            completed_at: new Date(),
          })
          .where(
            eq(
              task_completions.id,
              existingCompletion.id
            )
          )
          .returning();

        completionRecord = updated;
      } else {
        const [inserted] = await db
          .insert(task_completions)
          .values({
            task_id: taskId,
            date,
            image_url: imageUrl,
            notes,
          })
          .returning();

        completionRecord = inserted;
      }

      completed = true;
    }

    return NextResponse.json({
      success: true,
      completed,
      completion: completionRecord,
    });
  } catch (error) {
    console.error(
      "POST /api/tasks/[id]/complete error:",
      error
    );

    return NextResponse.json(
      { error: "Failed to toggle task completion" },
      { status: 500 }
    );
  }
}