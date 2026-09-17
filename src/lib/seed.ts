import { db } from "@/db";
import { users, tasks, task_completions, quotes, notifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getTodayString } from "./date-utils";

export async function ensureSeedData() {
  const existingUsers = await db.select().from(users).limit(1);
  if (existingUsers.length > 0) {
    return existingUsers[0];
  }

  // Create default user Alex
  const [user] = await db
    .insert(users)
    .values({
      name: "Alex",
      avatar: "https://images.pexels.com/photos/15035577/pexels-photo-15035577.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
      timezone: "America/New_York",
      date_format: "MM/DD/YYYY",
      theme: JSON.stringify({
        "--color-primary": "#5046e5",
        "--color-primary-light": "#eeedfd",
        "--color-secondary": "#6366f1",
        "--color-bg": "#f8fafc",
        "--color-surface": "#ffffff",
        "--color-surface-alt": "#f1f5f9",
        "--color-text": "#0f172a",
        "--color-text-muted": "#64748b",
        "--color-border": "#e2e8f0",
        "--color-success": "#10b981",
        "--color-danger": "#ef4444",
        "--color-warning": "#f59e0b",
      }),
    })
    .returning();

  const today = getTodayString("America/New_York");
  const [year, month, day] = today.split("-").map(Number);

  // Insert standard tasks matching the wireframes
  const [t1] = await db
    .insert(tasks)
    .values({
      user_id: user.id,
      title: "Morning jog",
      description: "30 minutes around the park",
      target_date: today,
      target_time: "07:30",
      recurrence: "daily",
      requires_photo: true,
    })
    .returning();

  const [t2] = await db
    .insert(tasks)
    .values({
      user_id: user.id,
      title: "Read 20 pages",
      description: "Continue the current book",
      target_date: today,
      target_time: "14:00",
      recurrence: "daily",
      requires_photo: false,
    })
    .returning();

  const [t3] = await db
    .insert(tasks)
    .values({
      user_id: user.id,
      title: "Water plants",
      description: "Kitchen herbs and living room fiddle leaf fig",
      target_date: today,
      target_time: "18:00",
      recurrence: "daily",
      requires_photo: true,
    })
    .returning();

  // Tomorrow preview tasks (which only appear when all today's tasks are done!)
  const tomorrowDate = new Date(Date.UTC(year, month - 1, day + 1)).toISOString().split("T")[0];
  await db.insert(tasks).values([
    {
      user_id: user.id,
      title: "Morning stretch & yoga",
      description: "20 minutes gentle hip opener and mobility flow",
      target_date: tomorrowDate,
      target_time: "08:00",
      recurrence: "daily",
      requires_photo: false,
    },
    {
      user_id: user.id,
      title: "Healthy meal prep",
      description: "Quinoa salad with roasted sweet potatoes & veggies",
      target_date: tomorrowDate,
      target_time: "12:30",
      recurrence: "daily",
      requires_photo: true,
    },
    {
      user_id: user.id,
      title: "Review weekly goals",
      description: "Check sprint progress and clean inbox",
      target_date: tomorrowDate,
      target_time: "17:00",
      recurrence: "weekly",
      requires_photo: false,
    },
  ]);

  // Mark Morning jog done for today with photo proof!
  await db.insert(task_completions).values({
    task_id: t1.id,
    date: today,
    image_url: "https://images.pexels.com/photos/15035577/pexels-photo-15035577.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    notes: "Felt great, brisk 3.2 miles!",
  });

  // Add historical completions for past 14 days to populate streak & heatmap
  for (let i = 1; i <= 14; i++) {
    const pastDate = new Date(Date.UTC(year, month - 1, day - i)).toISOString().split("T")[0];
    // Complete t1, t2, and occasionally t3
    await db.insert(task_completions).values({
      task_id: t1.id,
      date: pastDate,
      image_url: i % 2 === 0 ? "https://images.pexels.com/photos/24913608/pexels-photo-24913608.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940" : null,
      notes: "Completed morning jog",
    });

    await db.insert(task_completions).values({
      task_id: t2.id,
      date: pastDate,
      notes: "Read chapter",
    });

    if (i !== 3 && i !== 8) {
      // 3 and 8 had incomplete days for realistic variance
      await db.insert(task_completions).values({
        task_id: t3.id,
        date: pastDate,
        image_url: "https://images.pexels.com/photos/5965907/pexels-photo-5965907.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
      });
    }
  }

  // Insert quotes matching Image 1
  await db.insert(quotes).values([
    {
      user_id: user.id,
      text: "The only way to do great work is to love what you do.",
      author: "Steve Jobs",
      background_image_url: "https://images.pexels.com/photos/28253371/pexels-photo-28253371.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
    },
    {
      user_id: user.id,
      text: "It does not matter how slowly you go as long as you do not stop.",
      author: "Confucius",
      background_image_url: "https://images.pexels.com/photos/17077984/pexels-photo-17077984.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
    },
    {
      user_id: user.id,
      text: "Action is the foundational key to all success.",
      author: "Pablo Picasso",
      background_image_url: "https://images.pexels.com/photos/28210215/pexels-photo-28210215.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
    },
    {
      user_id: user.id,
      text: "Discipline is choosing between what you want now and what you want most.",
      author: "Abraham Lincoln",
      background_image_url: "https://images.pexels.com/photos/14546363/pexels-photo-14546363.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
    },
    {
      user_id: user.id,
      text: "Small daily improvements over time lead to stunning results.",
      author: "Robin Sharma",
      background_image_url: "https://images.pexels.com/photos/28210209/pexels-photo-28210209.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
    },
  ]);

  // Insert notifications
  await db.insert(notifications).values([
    {
      user_id: user.id,
      title: "Daily Habit Reminder",
      message: "Don't forget to water the kitchen herbs and indoor plants!",
      read: false,
    },
    {
      user_id: user.id,
      title: "Streak Milestone 🔥",
      message: "You're on a solid 4-day streak! Complete today to reach 5 days.",
      read: false,
    },
    {
      user_id: user.id,
      title: "New Quote Ready",
      message: "Check your daily inspiration in Motivation Notes.",
      read: true,
    },
  ]);

  return user;
}
