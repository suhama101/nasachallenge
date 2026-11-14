import type { HealthCheckIn } from "./validation";
export type PersonalResult<T> =
  | { ok: true; value: T; userId: string; profileId: string }
  | {
      ok: false;
      code: "session" | "onboarding" | "connection" | "conflict" | "validation";
      message: string;
    };
export type PersonalMutation =
  | {
      operation: "create" | "update";
      id: string;
      input: unknown;
      expectedUpdatedAt?: string;
      confirmed?: boolean;
    }
  | {
      operation: "delete";
      id: string;
      expectedUpdatedAt: string;
      confirmed: boolean;
    };
export type PersonalRecordResult = PersonalResult<HealthCheckIn | null>;
