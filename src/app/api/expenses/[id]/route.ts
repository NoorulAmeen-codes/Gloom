import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { expenses } from "@/db/schema";
import { getCurrentUser } from "@/lib/requireUser";
import {
  EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
  isValidDate,
  isValidTime,
} from "@/lib/expenses";

function parseId(value: string) {
  const id = Number(value);

  return Number.isSafeInteger(id) && id > 0
    ? id
    : null;
}

function amount(value: unknown) {
  const valueAsString =
    typeof value === "number"
      ? String(value)
      : value;

  return (
    typeof valueAsString === "string" &&
    /^\d+(\.\d{1,2})?$/.test(valueAsString) &&
    Number(valueAsString) > 0 &&
    valueAsString.split(".")[0].length <= 10
  )
    ? valueAsString
    : null;
}

export async function PATCH(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const id = parseId((await params).id);

    if (!id) {
      return NextResponse.json(
        { error: "Invalid expense ID." },
        { status: 400 }
      );
    }

    const body = await request.json();

    const update: Partial<
      typeof expenses.$inferInsert
    > = {};

    if (body.amount !== undefined) {
      const valid = amount(body.amount);

      if (!valid) {
        return NextResponse.json(
          { error: "Amount must be positive." },
          { status: 400 }
        );
      }

      update.amount = valid;
    }

    if (body.category !== undefined) {
      if (
        !EXPENSE_CATEGORIES.includes(
          body.category
        )
      ) {
        return NextResponse.json(
          { error: "Invalid category." },
          { status: 400 }
        );
      }

      update.category = body.category;
    }

    if (body.payment_method !== undefined) {
      if (
        !PAYMENT_METHODS.includes(
          body.payment_method
        )
      ) {
        return NextResponse.json(
          { error: "Invalid payment method." },
          { status: 400 }
        );
      }

      update.payment_method =
        body.payment_method;
    }

    if (body.expense_date !== undefined) {
      if (!isValidDate(body.expense_date)) {
        return NextResponse.json(
          { error: "Invalid date." },
          { status: 400 }
        );
      }

      update.expense_date =
        body.expense_date;
    }

    if (body.expense_time !== undefined) {
      if (!isValidTime(body.expense_time)) {
        return NextResponse.json(
          { error: "Invalid time." },
          { status: 400 }
        );
      }

      update.expense_time =
        body.expense_time;
    }

    if (body.description !== undefined) {
      if (
        typeof body.description !== "string"
      ) {
        return NextResponse.json(
          { error: "Description must be text." },
          { status: 400 }
        );
      }

      update.description =
        body.description.trim() || null;
    }

    if (!Object.keys(update).length) {
      return NextResponse.json(
        { error: "No changes supplied." },
        { status: 400 }
      );
    }

    const [expense] = await db
      .update(expenses)
      .set(update)
      .where(
        and(
          eq(expenses.id, id),
          eq(expenses.user_id, user.id)
        )
      )
      .returning();

    if (!expense) {
      return NextResponse.json(
        { error: "Expense not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      expense,
    });
  } catch (error) {
    console.error(
      "PATCH /api/expenses/[id] error:",
      error
    );

    return NextResponse.json(
      { error: "Failed to update expense" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const id = parseId((await params).id);

    if (!id) {
      return NextResponse.json(
        { error: "Invalid expense ID." },
        { status: 400 }
      );
    }

    const [expense] = await db
      .delete(expenses)
      .where(
        and(
          eq(expenses.id, id),
          eq(expenses.user_id, user.id)
        )
      )
      .returning();

    if (!expense) {
      return NextResponse.json(
        { error: "Expense not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "DELETE /api/expenses/[id] error:",
      error
    );

    return NextResponse.json(
      { error: "Failed to delete expense" },
      { status: 500 }
    );
  }
}