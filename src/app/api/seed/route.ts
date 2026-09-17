import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, tasks, task_completions, quotes, notifications } from "@/db/schema";
import { ensureSeedData } from "@/lib/seed";

export async function POST() {
  try {
    // Delete all existing data
    await db.delete(task_completions);
    await db.delete(tasks);
    await db.delete(quotes);
    await db.delete(notifications);
    await db.delete(users);

    const user = await ensureSeedData();

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("POST /api/seed error:", error);
    return NextResponse.json({ error: "Failed to reset sample data" }, { status: 500 });
  }
}
