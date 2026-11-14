import { NextResponse, type NextRequest } from "next/server";
import { authClient } from "@/lib/auth/server";
import { performAuth } from "@/lib/auth/service";
export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin)
    return new NextResponse("Please sign out from MissionPulse.", {
      status: 403,
      headers: { "Cache-Control": "private, no-store" },
    });
  const result = await performAuth(await authClient(), "logout", {}, null);
  const target = result.redirectTo || "/auth/login?reason=sign-out-failed";
  return NextResponse.redirect(new URL(target, request.nextUrl.origin), 303);
}
