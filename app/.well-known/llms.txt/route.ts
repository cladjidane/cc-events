import { NextResponse } from "next/server";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://eventlite.context-collective.org";

  // Redirect to the main llms.txt file
  return NextResponse.redirect(`${baseUrl}/llms.txt`, { status: 301 });
}
