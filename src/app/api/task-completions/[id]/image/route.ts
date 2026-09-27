import { NextResponse } from "next/server";
import { db } from "@/db";
import { tasks, task_completions } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/requireUser";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return new NextResponse("Unauthorized", {
        status: 401,
      });
    }

    const { id } = await params;
    const completionId = Number(id);

    if (!Number.isInteger(completionId)) {
      return new NextResponse("Invalid completion ID", {
        status: 400,
      });
    }

    const [completion] = await db
      .select({
        image_url: task_completions.image_url,
      })
      .from(task_completions)
      .innerJoin(
        tasks,
        eq(task_completions.task_id, tasks.id)
      )
      .where(
        and(
          eq(task_completions.id, completionId),
          eq(tasks.user_id, user.id)
        )
      )
      .limit(1);

    if (!completion?.image_url) {
      return new NextResponse("Image not found", {
        status: 404,
      });
    }

    const dataUrl = completion.image_url;

    const match = dataUrl.match(
      /^data:([^;]+);base64,([\s\S]+)$/
    );

    if (!match) {
      return new NextResponse("Invalid image data", {
        status: 500,
      });
    }

    const contentType = match[1];
    const base64Data = match[2];

    const imageBuffer = Buffer.from(
      base64Data,
      "base64"
    );

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control":
          "private, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error(
      "GET /api/task-completions/[id]/image error:",
      error
    );

    return new NextResponse(
      "Failed to load image",
      {
        status: 500,
      }
    );
  }
}