import { assistantRequestSchema } from "./types";
import { respond, type ProviderDependencies } from "./service";
export function json(value: unknown, status = 200) {
  return Response.json(value, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
export async function handleAssistant(
  request: Request,
  deps: ProviderDependencies,
) {
  if (
    request.headers.get("origin") !== new URL(request.url).origin ||
    ![null, "same-origin"].includes(request.headers.get("sec-fetch-site"))
  )
    return json(
      { error: "This request must come from the MissionPulse website." },
      403,
    );
  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  )
    return json({ error: "A JSON message is required." }, 415);
  const max = 32768;
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    const reader = request.body?.getReader();
    if (!reader) return json({ error: "A message is required." }, 400);
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > max) {
        await reader.cancel();
        return json({ error: "Message exceeds the request limit." }, 413);
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    const parsed = assistantRequestSchema.safeParse(
      JSON.parse(new TextDecoder().decode(bytes)),
    );
    if (!parsed.success)
      return json(
        { error: "Invalid message or unapproved health context." },
        400,
      );
    return json(await respond(parsed.data, deps));
  } catch {
    return json(
      {
        error:
          "The message could not be processed. No provider details are exposed.",
      },
      400,
    );
  }
}
