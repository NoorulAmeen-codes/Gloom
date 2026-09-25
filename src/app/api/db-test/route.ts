import { NextResponse } from "next/server";
import { pool } from "@/db";

export async function GET() {
  const start = Date.now();

  try {
    const clientStart = Date.now();
    const client = await pool.connect();
    const connectTime = Date.now() - clientStart;

    const queryStart = Date.now();
    await client.query("SELECT 1");
    const queryTime = Date.now() - queryStart;

    client.release();

    return NextResponse.json({
      connectTime,
      queryTime,
      totalTime: Date.now() - start,
    });
  } catch (error) {
    console.error("[DB TEST]", error);

    return NextResponse.json(
      { error: "Database test failed" },
      { status: 500 }
    );
  }
}