import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/requireUser";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    // Limit image size to 4MB.
    if (file.size > 4 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image size must be under 4MB" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const base64 = buffer.toString("base64");

    const dataUrl = `data:${file.type};base64,${base64}`;

    return NextResponse.json({
      url: dataUrl,
    });
  } catch (error) {
    console.error(
      "POST /api/upload error:",
      error
    );

    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}