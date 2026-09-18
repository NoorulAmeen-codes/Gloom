import { NextResponse } from "next/server";
import { db } from "@/db";
import { tasks, task_completions } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/requireUser";
import { getTodayString } from "@/lib/date-utils";

function isTaskActiveOnDate(
  task: typeof tasks.$inferSelect,
  dateStr: string
): boolean {
  if (task.recurrence === "daily") return true;

  if (task.recurrence === "one-time") {
    return task.target_date === dateStr;
  }

  const [y, m, d] = dateStr.split("-").map(Number);
  const dayOfWeek = new Date(
    Date.UTC(y, m - 1, d)
  ).getUTCDay();

  if (task.recurrence === "weekly") {
    if (task.target_date) {
      const [ty, tm, td] = task.target_date
        .split("-")
        .map(Number);

      const targetDow = new Date(
        Date.UTC(ty, tm - 1, td)
      ).getUTCDay();

      return dayOfWeek === targetDow;
    }

    return true;
  }

  if (
    task.recurrence === "custom" &&
    task.recurrence_days
  ) {
    try {
      const days = JSON.parse(
        task.recurrence_days
      ) as number[];

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

    const todayStr = getTodayString(
      user.timezone || undefined
    );

    // Only load tasks belonging to the logged-in user.
    const allTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.user_id, user.id));

    // Completions are linked to tasks, so only load
    // completions belonging to this user's tasks.
    const allCompletions = await db
      .select({
        id: task_completions.id,
        task_id: task_completions.task_id,
        date: task_completions.date,
        completed_at: task_completions.completed_at,
        image_url: task_completions.image_url,
        notes: task_completions.notes,
      })
      .from(task_completions)
      .innerJoin(
        tasks,
        eq(task_completions.task_id, tasks.id)
      )
      .where(eq(tasks.user_id, user.id))
      .orderBy(desc(task_completions.date));

    // Map completions by date -> completions array
    const completionByDate = new Map<
      string,
      typeof allCompletions
    >();

    for (const comp of allCompletions) {
      const list =
        completionByDate.get(comp.date) || [];

      list.push(comp);
      completionByDate.set(comp.date, list);
    }

    // Build day map for the past 90 days
    const [tY, tM, tD] = todayStr
      .split("-")
      .map(Number);

    const daysData: Array<{
      date: string;
      totalScheduled: number;
      completedCount: number;
      percentage: number;
      isAllCompleted: boolean;
      items: Array<{
        taskId: number;
        title: string;
        description: string;
        requiresPhoto: boolean;
        isCompleted: boolean;
        imageUrl: string | null;
        notes: string | null;
      }>;
    }> = [];

    // 90 days lookback
    for (let i = 0; i < 90; i++) {
      const d = new Date(
        Date.UTC(tY, tM - 1, tD - i)
      );

      const dateStr = d
        .toISOString()
        .split("T")[0];

      const scheduledForDay = allTasks.filter(
        (t) => isTaskActiveOnDate(t, dateStr)
      );

      const dayCompletions =
        completionByDate.get(dateStr) || [];

      const compMap = new Map(
        dayCompletions.map((c) => [c.task_id, c])
      );

      let completedCount = 0;

      const items = scheduledForDay.map((t) => {
        const comp = compMap.get(t.id);
        const isCompleted = !!comp;

        if (isCompleted) {
          completedCount++;
        }

        return {
          taskId: t.id,
          title: t.title,
          description: t.description || "",
          requiresPhoto: t.requires_photo,
          isCompleted,
          imageUrl: comp?.image_url ?? null,
          notes: comp?.notes ?? null,
        };
      });

      const totalScheduled =
        scheduledForDay.length;

      const percentage =
        totalScheduled > 0
          ? Math.round(
              (completedCount /
                totalScheduled) *
                100
            )
          : 0;

      const isAllCompleted =
        totalScheduled > 0 &&
        completedCount === totalScheduled;

      daysData.push({
        date: dateStr,
        totalScheduled,
        completedCount,
        percentage,
        isAllCompleted,
        items,
      });
    }

    // Current streak
    let currentStreak = 0;

    const todayData = daysData[0];

    const startIndex =
      todayData && todayData.isAllCompleted
        ? 0
        : 1;

    for (
      let i = startIndex;
      i < daysData.length;
      i++
    ) {
      const day = daysData[i];

      if (
        day.totalScheduled > 0 &&
        day.isAllCompleted
      ) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Longest streak
    let longestStreak = 0;
    let tempStreak = 0;

    for (
      let i = daysData.length - 1;
      i >= 0;
      i--
    ) {
      const day = daysData[i];

      if (
        day.totalScheduled > 0 &&
        day.isAllCompleted
      ) {
        tempStreak++;

        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
      } else {
        tempStreak = 0;
      }
    }

    // 30-day consistency
    const last30 = daysData.slice(0, 30);

    const sum30Scheduled = last30.reduce(
      (acc, d) => acc + d.totalScheduled,
      0
    );

    const sum30Completed = last30.reduce(
      (acc, d) => acc + d.completedCount,
      0
    );

    const consistencyRate30 =
      sum30Scheduled > 0
        ? Math.round(
            (sum30Completed /
              sum30Scheduled) *
              100
          )
        : 0;

    // 90-day consistency
    const sum90Scheduled = daysData.reduce(
      (acc, d) => acc + d.totalScheduled,
      0
    );

    const sum90Completed = daysData.reduce(
      (acc, d) => acc + d.completedCount,
      0
    );

    const consistencyRate90 =
      sum90Scheduled > 0
        ? Math.round(
            (sum90Completed /
              sum90Scheduled) *
              100
          )
        : 0;

    // Daily progress chart
    const dailyChart = [
      ...daysData.slice(0, 14),
    ]
      .reverse()
      .map((d) => ({
        date: d.date,
        label: d.date.slice(5),
        percentage: d.percentage,
        completed: d.completedCount,
        total: d.totalScheduled,
      }));

    // Monthly progress chart
    const monthMap = new Map<
      string,
      { completed: number; total: number }
    >();

    for (const d of daysData) {
      const monthKey = d.date.slice(0, 7);

      const curr =
        monthMap.get(monthKey) || {
          completed: 0,
          total: 0,
        };

      curr.completed += d.completedCount;
      curr.total += d.totalScheduled;

      monthMap.set(monthKey, curr);
    }

    const monthlyChart = Array.from(
      monthMap.entries()
    )
      .map(([monthKey, val]) => {
        const [y, m] = monthKey.split("-");

        const dateObj = new Date(
          parseInt(y),
          parseInt(m) - 1,
          1
        );

        const label =
          dateObj.toLocaleDateString(
            "en-US",
            { month: "short" }
          );

        const percentage =
          val.total > 0
            ? Math.round(
                (val.completed /
                  val.total) *
                  100
              )
            : 0;

        return {
          monthKey,
          label,
          percentage,
          completed: val.completed,
          total: val.total,
        };
      })
      .reverse();

    // Yearly chart
    const yearMap = new Map<
      string,
      { completed: number; total: number }
    >();

    for (const d of daysData) {
      const yearKey = d.date.slice(0, 4);

      const curr =
        yearMap.get(yearKey) || {
          completed: 0,
          total: 0,
        };

      curr.completed += d.completedCount;
      curr.total += d.totalScheduled;

      yearMap.set(yearKey, curr);
    }

    const yearlyChart = Array.from(
      yearMap.entries()
    ).map(([yearKey, val]) => {
      const percentage =
        val.total > 0
          ? Math.round(
              (val.completed /
                val.total) *
                100
            )
          : 0;

      return {
        label: yearKey,
        percentage,
        completed: val.completed,
        total: val.total,
      };
    });

    // Heatmap
    const heatmapDays = [
      ...daysData.slice(0, 84),
    ]
      .reverse()
      .map((d) => ({
        date: d.date,
        percentage: d.percentage,
        totalScheduled: d.totalScheduled,
        completedCount: d.completedCount,
        isAllCompleted: d.isAllCompleted,
        photoCount: d.items.filter(
          (item) => item.imageUrl
        ).length,
      }));

    return NextResponse.json({
      streaks: {
        currentStreak,
        longestStreak: Math.max(
          longestStreak,
          currentStreak
        ),
      },

      consistency: {
        rate30: consistencyRate30,
        rate90: consistencyRate90,
      },

      dailyChart,
      monthlyChart,
      yearlyChart,
      heatmapDays,

      historyLog: daysData.slice(0, 30),
    });
  } catch (error) {
    console.error(
      "GET /api/reports error:",
      error
    );

    return NextResponse.json(
      { error: "Failed to generate reports" },
      { status: 500 }
    );
  }
}