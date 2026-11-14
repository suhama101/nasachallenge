import { handleAssistant, json } from "@/lib/assistant/http";
import { providerDependencies } from "@/lib/assistant/provider.server";
export const runtime = "nodejs";
export const maxDuration = 20;
export async function GET() {
  return json({ liveAvailable: providerDependencies().configured });
}
export async function POST(request: Request) {
  return handleAssistant(request, providerDependencies());
}
