import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "./database.types";
import { DEMO_PROFILE_ID, type PersonalHealthRepository } from "./repository";
import {
  checkInInputSchema,
  type CheckInInput,
  type HealthCheckIn,
} from "./validation";
import { fromDatabase, toDatabase } from "./supabase-mapping";
import { loadProfile } from "../auth/profiles";
import { isTemporaryAuthError } from "../auth/errors";

export class PersonalHealthError extends Error {
  constructor(
    public readonly code: "session" | "onboarding" | "connection" | "conflict",
    message: string,
  ) {
    super(message);
  }
}
const unavailable = () =>
  new PersonalHealthError(
    "conflict",
    "This check-in is unavailable or has changed. Reload your history before trying again.",
  );
function sameInput(record: HealthCheckIn, input: CheckInInput) {
  return (Object.keys(input) as (keyof CheckInInput)[]).every(
    (key) => JSON.stringify(record[key]) === JSON.stringify(input[key]),
  );
}
// Only constructed after verified Auth and owned profile lookup; no service role.
export class SupabaseHealthRepository implements PersonalHealthRepository {
  constructor(
    private readonly client: SupabaseClient<Database>,
    private readonly profileId: string,
  ) {
    z.uuid().parse(profileId);
    if (profileId === DEMO_PROFILE_ID) throw unavailable();
  }
  async list() {
    const records: HealthCheckIn[] = [];
    const pageSize = 200;
    for (let start = 0; ; start += pageSize) {
      const { data, error } = await this.client
        .from("health_check_ins")
        .select("*")
        .eq("astronaut_profile_id", this.profileId)
        .order("recorded_at", { ascending: false })
        .order("id", { ascending: false })
        .range(start, start + pageSize - 1);
      if (error || !data)
        throw new PersonalHealthError(
          "connection",
          "Your health history could not be loaded. Please try again.",
        );
      records.push(...data.map((row) => fromDatabase(row, this.profileId)));
      if (data.length < pageSize) return records;
    }
  }
  private async get(id: string) {
    z.uuid().parse(id);
    const { data, error } = await this.client
      .from("health_check_ins")
      .select("*")
      .eq("id", id)
      .eq("astronaut_profile_id", this.profileId)
      .maybeSingle();
    if (error)
      throw new PersonalHealthError(
        "connection",
        "This check-in could not be loaded. Please try again.",
      );
    return data ? fromDatabase(data, this.profileId) : null;
  }
  async save(input: CheckInInput, submissionId: string) {
    z.uuid().parse(submissionId);
    const parsed = checkInInputSchema.parse(input);
    const candidate = toDatabase(
      parsed,
      submissionId,
      this.profileId,
      new Date().toISOString(),
    );
    const { error } = await this.client
      .from("health_check_ins")
      .insert(candidate);
    if (error && error.code !== "23505")
      throw new PersonalHealthError(
        "connection",
        "Your check-in could not be saved. Your entries are still here; please retry.",
      );
    const record = await this.get(submissionId);
    if (!record || !sameInput(record, parsed)) throw unavailable();
    return record;
  }
  async update(id: string, input: CheckInInput, expectedUpdatedAt: string) {
    const parsed = checkInInputSchema.parse(input);
    z.iso.datetime({ offset: true }).parse(expectedUpdatedAt);
    const original = await this.get(id);
    if (!original) throw unavailable();
    // Retrying after a lost successful response is safe and read-only.
    if (sameInput(original, parsed)) return original;
    if (original.updatedAt !== expectedUpdatedAt) throw unavailable();
    const candidate = toDatabase(
      parsed,
      id,
      this.profileId,
      original.recordedAt,
    );
    const fields = {
      mission_local_date: candidate.mission_local_date,
      heart_rate: candidate.heart_rate,
      systolic: candidate.systolic,
      diastolic: candidate.diastolic,
      temperature: candidate.temperature,
      spo2: candidate.spo2,
      glucose: candidate.glucose,
      sleep: candidate.sleep,
      mood: candidate.mood,
      fatigue: candidate.fatigue,
      exercise: candidate.exercise,
      water: candidate.water,
      symptoms: candidate.symptoms,
      notes: candidate.notes,
      urgent_symptom_reported: candidate.urgent_symptom_reported,
    };
    const { data, error } = await this.client
      .from("health_check_ins")
      .update(fields)
      .eq("id", id)
      .eq("astronaut_profile_id", this.profileId)
      .eq("updated_at", expectedUpdatedAt)
      .select("*")
      .maybeSingle();
    if (error)
      throw new PersonalHealthError(
        "connection",
        "Your changes could not be saved. Your entries are still here; please retry.",
      );
    if (!data) throw unavailable();
    return fromDatabase(data, this.profileId);
  }
  async remove(id: string, expectedUpdatedAt: string) {
    z.uuid().parse(id);
    z.iso.datetime({ offset: true }).parse(expectedUpdatedAt);
    const { data, error } = await this.client
      .from("health_check_ins")
      .delete()
      .eq("id", id)
      .eq("astronaut_profile_id", this.profileId)
      .eq("updated_at", expectedUpdatedAt)
      .select("id");
    if (error)
      throw new PersonalHealthError(
        "connection",
        "This check-in could not be deleted. Please try again.",
      );
    if (!data || data.length !== 1) throw unavailable();
  }
}
export async function verifiedHealthContext(client: SupabaseClient<Database>) {
  const { data, error } = await client.auth.getUser();
  if (isTemporaryAuthError(error))
    throw new PersonalHealthError(
      "connection",
      "Your account connection is temporarily unavailable. Please retry; your session has not been treated as signed out.",
    );
  if (error || !data.user?.email_confirmed_at)
    throw new PersonalHealthError(
      "session",
      "Please sign in again to continue.",
    );
  const profile = await loadProfile(client, data.user.id);
  if (!profile)
    throw new PersonalHealthError(
      "onboarding",
      "Complete your mission profile before recording a check-in.",
    );
  return {
    repository: new SupabaseHealthRepository(client, profile.id),
    userId: data.user.id,
    profileId: profile.id,
  };
}
