import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "Seed/reset endpoint is disabled",
    },
    { status: 404 }
  );
}