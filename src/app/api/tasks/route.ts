import { NextResponse } from "next/server";
import { db } from "@/db";
import { tasks, task_completions } from "@/db/schema";
import { eq, desc, and, inArray } from "drizzle-orm";
import { getCurrentUser } from "@/lib/requireUser";
import { getTodayString, getTomorrowString } from "@/lib/date-utils";

function isTaskActiveOnDate(
  task: typeof tasks.$inferSelect,
  dateStr: string
): boolean {
  if (task.recurrence === "daily") return true;

  if (task.recurrence === "one-time") {
    return task.target_date === dateStr;
  }

  const [y, m, d] = dateStr.split("-").map(Number);
  const dayOfWeek = new Date(Date.UTC(y, m - 1, d)).getUTCDay();

  if (task.recurrence === "weekly") {
    if (task.target_date) {
      const [ty, tm, td] = task.target_date.split("-").map(Number);
      const targetDow = new Date(
        Date.UTC(ty, tm - 1, td)
      ).getUTCDay();

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
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    const dateParam =
      searchParams.get("date") ||
      getTodayString(user.timezone || undefined);

    const scope = searchParams.get("scope");

    // Only load tasks belonging to the logged-in user.
    const tasksQueryStart = Date.now();
    const allTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.user_id, user.id))
      .orderBy(tasks.target_time, desc(tasks.created_at));
      console.log(
  "[TASKS] allTasks query:",
  Date.now() - tasksQueryStart,
  "ms"
);

    const taskIds = allTasks.map((task) => task.id);

    // Fetch completions only for this user's tasks.
    const todayCompletionsStart = Date.now();
  const completionsForDate =
      taskIds.length > 0
        ? await db
            .select({
  id: task_completions.id,
  task_id: task_completions.task_id,
  date: task_completions.date,
  image_url: task_completions.image_url,
  notes: task_completions.notes,
  completed_at: task_completions.completed_at,
})

            .from(task_completions)
            .where(
              and(
                eq(task_completions.date, dateParam),
                inArray(task_completions.task_id, taskIds)
              )
            )
        : [];
        console.log(
  "[TASKS] today completions query:",
  Date.now() - todayCompletionsStart,
  "ms"
);

    const completionMap = new Map<
  number,
  (typeof completionsForDate)[number]
>();

    for (const comp of completionsForDate) {
      completionMap.set(comp.task_id, comp);
    }

    const todaysTasks = allTasks
      .filter((task) => isTaskActiveOnDate(task, dateParam))
      .map((task) => {
        const comp = completionMap.get(task.id);

        return {
          ...task,
          is_completed: !!comp,
          completion_id: comp?.id ?? null,
          completion_image_url: null,
          completion_notes: comp?.notes ?? null,
          completed_at: comp?.completed_at ?? null,
        };
      });

    const pendingCount = todaysTasks.filter(
      (task) => !task.is_completed
    ).length;

    const completedCount = todaysTasks.filter(
      (task) => task.is_completed
    ).length;

    const allCompleted =
      todaysTasks.length > 0 && pendingCount === 0;

    const tomorrowDate = getTomorrowString(
      user.timezone || undefined
    );
    const tomorrowCompletionsStart = Date.now();
    const tomorrowCompletions =
      taskIds.length > 0
        ? await db
           .select({
  id: task_completions.id,
  task_id: task_completions.task_id,
  date: task_completions.date,
  image_url: task_completions.image_url,
  completed_at: task_completions.completed_at,
})
.from(task_completions)
            .where(
              and(
                eq(task_completions.date, tomorrowDate),
                inArray(task_completions.task_id, taskIds)
              )
            )
        : [];
        console.log(
  "[TASKS] tomorrow completions query:",
  Date.now() - tomorrowCompletionsStart,
  "ms"
);

    const tomorrowCompMap = new Map<
  number,
  (typeof tomorrowCompletions)[number]
>();

    for (const comp of tomorrowCompletions) {
      tomorrowCompMap.set(comp.task_id, comp);
    }

    const tomorrowTasks = allTasks
      .filter((task) =>
        isTaskActiveOnDate(task, tomorrowDate)
      )
      .map((task) => {
        const comp = tomorrowCompMap.get(task.id);

        return {
          ...task,
          is_completed: !!comp,
          completion_id: comp?.id ?? null,
          completion_image_url: null,
        };
      });

   let allTasksWithStats: Array<
  (typeof allTasks)[number] & {
    total_completions: number;
    latest_completion: {
      id: number;
      date: string;
      completed_at: Date | null;
      notes: string | null;
    } | null;
  }
> = allTasks.map((task) => ({
  ...task,
  total_completions: 0,
  latest_completion: null,
}));
if (scope !== "today" && taskIds.length > 0) {
  const completionStats = await db
    .select({
      task_id: task_completions.task_id,
      id: task_completions.id,
      date: task_completions.date,
      completed_at: task_completions.completed_at,
      notes: task_completions.notes,
    })
    .from(task_completions)
    .where(inArray(task_completions.task_id, taskIds))
    .orderBy(desc(task_completions.completed_at));

  const statsMap = new Map<
    number,
    {
      total_completions: number;
      latest_completion: {
        id: number;
        date: string;
        completed_at: Date | null;
        notes: string | null;
      } | null;
    }
  >();

  for (const completion of completionStats) {
    const existing = statsMap.get(completion.task_id);

    if (!existing) {
      statsMap.set(completion.task_id, {
        total_completions: 1,
        latest_completion: {
          id: completion.id,
          date: completion.date,
          completed_at: completion.completed_at,
          notes: completion.notes,
        },
      });
    } else {
      existing.total_completions += 1;
    }
  }

  allTasksWithStats = allTasks.map((task) => {
    const stats = statsMap.get(task.id);

    return {
      ...task,
      total_completions: stats?.total_completions ?? 0,
      latest_completion: stats?.latest_completion ?? null,
    };
  });
}

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
      scope,
    });
  } catch (error) {
    console.error("GET /api/tasks error:", error);

    return NextResponse.json(
      { error: "Failed to fetch tasks" },
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
      title,
      description,
      target_date,
      target_time,
      recurrence,
      recurrence_days,
      requires_photo,
    } = body;

    if (
      !title ||
      typeof title !== "string" ||
      !title.trim()
    ) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const [newTask] = await db
      .insert(tasks)
      .values({
        user_id: user.id,
        title: title.trim(),
        description: description?.trim() || "",
        target_date:
          target_date ||
          getTodayString(user.timezone || undefined),
        target_time: target_time || "09:00",
        recurrence: recurrence || "daily",
        recurrence_days: recurrence_days
          ? JSON.stringify(recurrence_days)
          : null,
        requires_photo: !!requires_photo,
      })
      .returning();

    return NextResponse.json(
      { task: newTask },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/tasks error:", error);

    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}