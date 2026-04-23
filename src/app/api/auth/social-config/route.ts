import { NextResponse } from "next/server";

export function GET() {
  const google =
    Boolean(process.env.GOOGLE_CLIENT_ID?.trim()) &&
    Boolean(process.env.GOOGLE_CLIENT_SECRET?.trim());
  return NextResponse.json({ google });
}
