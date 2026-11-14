import { NextResponse } from "next/server";
import { authClient } from "@/lib/auth/server";
import { isTemporaryAuthError } from "@/lib/auth/errors";
export async function GET() {
  try {
    const client = await authClient();
    if (client) {
      const { data, error } = await client.auth.getUser();
      if (isTemporaryAuthError(error))
        return NextResponse.json(
          { message: "Connection unavailable. Please retry." },
          { status: 503, headers: { "Cache-Control": "private, no-store" } },
        );
      if (!error && data.user?.email_confirmed_at)
        return NextResponse.json(
          { userId: data.user.id },
          { headers: { "Cache-Control": "private, no-store" } },
        );
    } else
      return NextResponse.json(
        { message: "Account connection unavailable" },
        { status: 503, headers: { "Cache-Control": "private, no-store" } },
      );
  } catch {
    return NextResponse.json(
      { message: "Connection unavailable" },
      { status: 503, headers: { "Cache-Control": "private, no-store" } },
    );
  }
  return NextResponse.json(
    { message: "Please sign in" },
    { status: 401, headers: { "Cache-Control": "private, no-store" } },
  );
}
