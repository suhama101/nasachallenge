import type { CheckInInput, HealthCheckIn } from "./validation";
export interface HealthRepository {
  list(): Promise<HealthCheckIn[]>;
  // The same submission UUID is idempotent; a retry cannot add a second row.
  save(input: CheckInInput, submissionId: string): Promise<HealthCheckIn>;
}
export interface DemoRepository extends HealthRepository {
  reset(): Promise<void>;
  close(): Promise<void>;
}
export interface PersonalHealthRepository extends HealthRepository {
  update(
    id: string,
    input: CheckInInput,
    expectedUpdatedAt: string,
  ): Promise<HealthCheckIn>;
  remove(id: string, expectedUpdatedAt: string): Promise<void>;
}
export const DEMO_PROFILE_ID = "00000000-0000-4000-8000-000000000042";
