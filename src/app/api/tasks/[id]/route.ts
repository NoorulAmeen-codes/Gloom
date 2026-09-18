import { NextResponse } from "next/server";
import { db } from "@/db";
import { tasks, task_completions } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/requireUser";

export async function GET(
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

    const history = await db
      .select()
      .from(task_completions)
      .where(eq(task_completions.task_id, taskId))
      .orderBy(desc(task_completions.date));

    return NextResponse.json({
      task,
      history,
    });
  } catch (error) {
    console.error("GET /api/tasks/[id] error:", error);

    return NextResponse.json(
      { error: "Failed to fetch task" },
      { status: 500 }
    );
  }
}

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
    const taskId = parseInt(id, 10);

    if (isNaN(taskId)) {
      return NextResponse.json(
        { error: "Invalid task ID" },
        { status: 400 }
      );
    }

    // Make sure this task belongs to the logged-in user.
    const [existingTask] = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.id, taskId),
          eq(tasks.user_id, user.id)
        )
      );

    if (!existingTask) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    const body = await request.json();

    const updateData: Partial<typeof tasks.$inferInsert> = {};

    if (typeof body.title === "string") {
      updateData.title = body.title.trim();
    }

    if (typeof body.description === "string") {
      updateData.description = body.description.trim();
    }

    if (typeof body.target_date === "string") {
      updateData.target_date = body.target_date;
    }

    if (typeof body.target_time === "string") {
      updateData.target_time = body.target_time;
    }

    if (typeof body.recurrence === "string") {
      updateData.recurrence = body.recurrence;
    }

    if (body.recurrence_days !== undefined) {
      updateData.recurrence_days = body.recurrence_days
        ? JSON.stringify(body.recurrence_days)
        : null;
    }

    if (typeof body.requires_photo === "boolean") {
      updateData.requires_photo = body.requires_photo;
    }

    const [updated] = await db
      .update(tasks)
      .set(updateData)
      .where(
        and(
          eq(tasks.id, taskId),
          eq(tasks.user_id, user.id)
        )
      )
      .returning();

    return NextResponse.json({
      task: updated,
    });
  } catch (error) {
    console.error("PATCH /api/tasks/[id] error:", error);

    return NextResponse.json(
      { error: "Failed to update task" },
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
    const taskId = parseInt(id, 10);

    if (isNaN(taskId)) {
      return NextResponse.json(
        { error: "Invalid task ID" },
        { status: 400 }
      );
    }

    // Only delete a task belonging to the logged-in user.
    const [deleted] = await db
      .delete(tasks)
      .where(
        and(
          eq(tasks.id, taskId),
          eq(tasks.user_id, user.id)
        )
      )
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("DELETE /api/tasks/[id] error:", error);

    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}