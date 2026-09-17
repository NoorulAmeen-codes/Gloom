import { NextResponse } from "next/server";
import { and, asc, eq, gte, ilike, lte } from "drizzle-orm";
import { db } from "@/db";
import { expenses, users } from "@/db/schema";
import { ensureSeedData } from "@/lib/seed";
import { EXPENSE_CATEGORIES, PAYMENT_METHODS, isValidDate, isValidTime } from "@/lib/expenses";

async function currentUser() {
  let [user] = await db.select().from(users).limit(1);
  if (!user) user = await ensureSeedData();
  return user;
}

function monthBounds(month: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return null;
  const [year, monthNumber] = month.split("-").map(Number);
  const start = `${month}-01`;
  const end = new Date(Date.UTC(year, monthNumber, 0)).toISOString().slice(0, 10);
  return { start, end };
}

function validAmount(value: unknown): string | null {
  const normalized = typeof value === "number" ? String(value) : value;
  if (typeof normalized !== "string" || !/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const [whole] = normalized.split(".");
  if (whole.length > 10 || Number(normalized) <= 0) return null;
  return normalized;
}

function validate(body: Record<string, unknown>) {
  const amount = validAmount(body.amount);
  if (!amount) return { error: "Amount must be a positive value with at most two decimal places." };
  if (!EXPENSE_CATEGORIES.includes(body.category as typeof EXPENSE_CATEGORIES[number])) return { error: "Choose a valid category." };
  if (!PAYMENT_METHODS.includes(body.payment_method as typeof PAYMENT_METHODS[number])) return { error: "Choose a valid payment method." };
  if (!isValidDate(body.expense_date)) return { error: "Enter a valid expense date." };
  if (!isValidTime(body.expense_time)) return { error: "Enter a valid expense time." };
  if (body.description !== undefined && typeof body.description !== "string") return { error: "Description must be text." };
  return { value: { amount, category: body.category as string, payment_method: body.payment_method as string, expense_date: body.expense_date, expense_time: body.expense_time, description: (body.description as string | undefined)?.trim() || null } };
}

export async function GET(request: Request) {
  try {
    const user = await currentUser();
    const params = new URL(request.url).searchParams;
    const filters = [eq(expenses.user_id, user.id)];
    const date = params.get("date");
    const month = params.get("month");
    if (date) {
      if (!isValidDate(date)) return NextResponse.json({ error: "Invalid date." }, { status: 400 });
      filters.push(eq(expenses.expense_date, date));
    } else if (month) {
      const bounds = monthBounds(month);
      if (!bounds) return NextResponse.json({ error: "Invalid month." }, { status: 400 });
      filters.push(gte(expenses.expense_date, bounds.start), lte(expenses.expense_date, bounds.end));
    }
    const category = params.get("category");
    if (category) {
      if (!EXPENSE_CATEGORIES.includes(category as typeof EXPENSE_CATEGORIES[number])) return NextResponse.json({ error: "Invalid category." }, { status: 400 });
      filters.push(eq(expenses.category, category));
    }
    const payment = params.get("payment_method");
    if (payment) {
      if (!PAYMENT_METHODS.includes(payment as typeof PAYMENT_METHODS[number])) return NextResponse.json({ error: "Invalid payment method." }, { status: 400 });
      filters.push(eq(expenses.payment_method, payment));
    }
    const search = params.get("search")?.trim();
    if (search) filters.push(ilike(expenses.description, `%${search.slice(0, 100)}%`));
    const rows = await db.select().from(expenses).where(and(...filters)).orderBy(asc(expenses.expense_date), asc(expenses.expense_time), asc(expenses.id));
    return NextResponse.json({ expenses: rows.reverse() });
  } catch (error) {
    console.error("GET /api/expenses error:", error);
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    const checked = validate(await request.json());
    if ("error" in checked) return NextResponse.json({ error: checked.error }, { status: 400 });
    const [expense] = await db.insert(expenses).values({ ...checked.value, user_id: user.id }).returning();
    return NextResponse.json({ expense }, { status: 201 });
  } catch (error) {
    console.error("POST /api/expenses error:", error);
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}
