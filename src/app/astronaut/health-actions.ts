"use server";
import { authClient } from "@/lib/auth/server";
import {
  verifiedHealthContext,
  PersonalHealthError,
} from "@/lib/health/supabase-repository.server";
import {
  checkInInputSchema,
  type HealthCheckIn,
} from "@/lib/health/validation";
import type {
  PersonalMutation,
  PersonalResult,
} from "@/lib/health/personal-types";
import { ZodError } from "zod";

async function withOwner<T>(
  run: (
    context: Awaited<ReturnType<typeof verifiedHealthContext>>,
  ) => Promise<T>,
): Promise<PersonalResult<T>> {
  try {
    const client = await authClient();
    if (!client)
      return {
        ok: false,
        code: "connection",
        message:
          "Your account connection is unavailable. Your health records have not been replaced with demo data.",
      };
    const context = await verifiedHealthContext(client);
    return {
      ok: true,
      value: await run(context),
      userId: context.userId,
      profileId: context.profileId,
    };
  } catch (error) {
    if (error instanceof PersonalHealthError)
      return { ok: false, code: error.code, message: error.message };
    if (error instanceof ZodError)
      return {
        ok: false,
        code: "validation",
        message:
          "Check your measurements and the check-in you selected, then try again.",
      };
    return {
      ok: false,
      code: "connection",
      message:
        "We could not complete this request. Please check your connection and try again. No demo data has been used.",
    };
  }
}
export async function listPersonalHealth(): Promise<
  PersonalResult<HealthCheckIn[]>
> {
  return withOwner((context) => context.repository.list());
}
export async function mutatePersonalHealth(
  request: PersonalMutation,
): Promise<PersonalResult<HealthCheckIn | null>> {
  return withOwner(async ({ repository }) => {
    if (!request || typeof request !== "object") throw new ZodError([]);
    if (request.operation === "delete") {
      if (request.confirmed !== true)
        throw new PersonalHealthError(
          "conflict",
          "Confirm deletion before removing this check-in.",
        );
      await repository.remove(request.id, request.expectedUpdatedAt);
      return null;
    }
    const input = checkInInputSchema.parse(request.input);
    if (request.operation === "create")
      return repository.save(input, request.id);
    if (
      request.operation === "update" &&
      request.confirmed === true &&
      request.expectedUpdatedAt
    )
      return repository.update(request.id, input, request.expectedUpdatedAt);
    throw new PersonalHealthError(
      "conflict",
      "Review and confirm your changes before saving this check-in.",
    );
  });
}
