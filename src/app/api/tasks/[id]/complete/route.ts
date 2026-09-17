import { NextResponse } from "next/server";
import { db } from "@/db";
import { tasks, task_completions, users, notifications } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getTodayString } from "@/lib/date-utils";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const taskId = parseInt(id, 10);
    if (isNaN(taskId)) {
      return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
    }

    const [user] = await db.select().from(users).limit(1);
    const body = await request.json().catch(() => ({}));
    const date = body.date || getTodayString(user?.timezone || undefined);
    const action = body.action || "toggle"; // "complete", "uncomplete", "toggle"
    const imageUrl = body.image_url || null;
    const notes = body.notes || null;

    const [existingCompletion] = await db
      .select()
      .from(task_completions)
      .where(and(eq(task_completions.task_id, taskId), eq(task_completions.date, date)));

    let completed = false;
    let completionRecord = null;

    if (action === "uncomplete" || (action === "toggle" && existingCompletion)) {
      if (existingCompletion) {
        await db.delete(task_completions).where(eq(task_completions.id, existingCompletion.id));
      }
      completed = false;
    } else {
      // Complete or update completion
      if (existingCompletion) {
        const [updated] = await db
          .update(task_completions)
          .set({
            image_url: imageUrl !== undefined ? imageUrl : existingCompletion.image_url,
            notes: notes !== undefined ? notes : existingCompletion.notes,
            completed_at: new Date(),
          })
          .where(eq(task_completions.id, existingCompletion.id))
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
    console.error("POST /api/tasks/[id]/complete error:", error);
    return NextResponse.json({ error: "Failed to toggle task completion" }, { status: 500 });
  }
}
