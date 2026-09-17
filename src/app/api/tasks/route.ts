import { NextResponse } from "next/server";
import { db } from "@/db";
import { tasks, task_completions, users } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { ensureSeedData } from "@/lib/seed";
import { getTodayString, getTomorrowString } from "@/lib/date-utils";

function isTaskActiveOnDate(task: typeof tasks.$inferSelect, dateStr: string): boolean {
  if (task.recurrence === "daily") return true;
  if (task.recurrence === "one-time") {
    return task.target_date === dateStr;
  }
  const [y, m, d] = dateStr.split("-").map(Number);
  const dayOfWeek = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0-6

  if (task.recurrence === "weekly") {
    // default to target_date day of week or Sunday if not set
    if (task.target_date) {
      const [ty, tm, td] = task.target_date.split("-").map(Number);
      const targetDow = new Date(Date.UTC(ty, tm - 1, td)).getUTCDay();
      return dayOfWeek === targetDow;
    }
    return true;
  }

  if (task.recurrence === "custom" && task.recurrence_days) {
    try {
      const days = JSON.parse(task.recurrence_days) as number[];
      return days.includes(dayOfWeek);
    } catch {
      return true;
    }
  }

  return true;
}

export async function GET(request: Request) {
  try {
    let [user] = await db.select().from(users).limit(1);
    if (!user) {
      user = await ensureSeedData();
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date") || getTodayString(user.timezone || undefined);
    const scope = searchParams.get("scope"); // "today" | "all" | "tomorrow"

    const allTasks = await db.select().from(tasks).orderBy(tasks.target_time, tasks.created_at);

    // Fetch completions for the requested date
    const completionsForDate = await db
      .select()
      .from(task_completions)
      .where(eq(task_completions.date, dateParam));

    const completionMap = new Map<number, typeof task_completions.$inferSelect>();
    for (const comp of completionsForDate) {
      completionMap.set(comp.task_id, comp);
    }

    // Filter tasks active today
    const todaysTasks = allTasks
      .filter((t) => isTaskActiveOnDate(t, dateParam))
      .map((t) => {
        const comp = completionMap.get(t.id);
        return {
          ...t,
          is_completed: !!comp,
          completion_id: comp?.id ?? null,
          completion_image_url: comp?.image_url ?? null,
          completion_notes: comp?.notes ?? null,
          completed_at: comp?.completed_at ?? null,
        };
      });

    // Determine if all today's tasks are completed
    const pendingCount = todaysTasks.filter((t) => !t.is_completed).length;
    const completedCount = todaysTasks.filter((t) => t.is_completed).length;
    const allCompleted = todaysTasks.length > 0 && pendingCount === 0;

    // Tomorrow's date and tasks
    const tomorrowDate = getTomorrowString(user.timezone || undefined);
    const tomorrowCompletions = await db
      .select()
      .from(task_completions)
      .where(eq(task_completions.date, tomorrowDate));
    const tomorrowCompMap = new Map<number, typeof task_completions.$inferSelect>();
    for (const comp of tomorrowCompletions) {
      tomorrowCompMap.set(comp.task_id, comp);
    }

    const tomorrowTasks = allTasks
      .filter((t) => isTaskActiveOnDate(t, tomorrowDate))
      .map((t) => {
        const comp = tomorrowCompMap.get(t.id);
        return {
          ...t,
          is_completed: !!comp,
          completion_id: comp?.id ?? null,
          completion_image_url: comp?.image_url ?? null,
        };
      });

    // Also get all tasks with completion count
    const allTasksWithStats = await Promise.all(
      allTasks.map(async (t) => {
        const taskComps = await db
          .select()
          .from(task_completions)
          .where(eq(task_completions.task_id, t.id));
        return {
          ...t,
          total_completions: taskComps.length,
          latest_completion: taskComps[taskComps.length - 1] ?? null,
        };
      })
    );

    return NextResponse.json({
      date: dateParam,
      tomorrowDate,
      todaysTasks,
      tomorrowTasks,
      allCompleted,
      stats: {
        pendingCount,
        completedCount,
        totalCount: todaysTasks.length,
      },
      allTasks: allTasksWithStats,
    });
  } catch (error) {
    console.error("GET /api/tasks error:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    let [user] = await db.select().from(users).limit(1);
    if (!user) {
      user = await ensureSeedData();
    }

    const body = await request.json();
    const { title, description, target_date, target_time, recurrence, recurrence_days, requires_photo } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const [newTask] = await db
      .insert(tasks)
      .values({
        user_id: user.id,
        title: title.trim(),
        description: description?.trim() || "",
        target_date: target_date || getTodayString(user.timezone || undefined),
        target_time: target_time || "09:00",
        recurrence: recurrence || "daily",
        recurrence_days: recurrence_days ? JSON.stringify(recurrence_days) : null,
        requires_photo: !!requires_photo,
      })
      .returning();

    return NextResponse.json({ task: newTask }, { status: 201 });
  } catch (error) {
    console.error("POST /api/tasks error:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
