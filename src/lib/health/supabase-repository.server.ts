import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import type { HealthRepository } from "./repository";
import { checkInInputSchema, type CheckInInput } from "./validation";
import { fromDatabase, toDatabase } from "./supabase-mapping";

class SupabaseHealthRepository implements HealthRepository {
  constructor(
    private readonly client: SupabaseClient<Database>,
    private readonly profileId: string,
  ) {}
  async list() {
    const { data, error } = await this.client
      .from("health_check_ins")
      .select("*")
      .eq("astronaut_profile_id", this.profileId)
      .order("recorded_at", { ascending: false })
      .order("id", { ascending: false });
    if (error) throw new Error("Authenticated records could not be loaded.");
    return data.map((row) => fromDatabase(row, this.profileId));
  }
  async save(input: CheckInInput, submissionId: string) {
    const parsed = checkInInputSchema.parse(input);
    const candidate = toDatabase(
      parsed,
      submissionId,
      this.profileId,
      new Date().toISOString(),
    );
    // A primary-key conflict is an idempotent retry only when its owner and inputs match.
    const { error } = await this.client
      .from("health_check_ins")
      .insert(candidate);
    if (error && error.code !== "23505")
      throw new Error("Authenticated check-in could not be saved.");
    const { data, error: readError } = await this.client
      .from("health_check_ins")
      .select("*")
      .eq("id", submissionId)
      .eq("astronaut_profile_id", this.profileId)
      .single();
    if (readError || !data)
      throw new Error("Could not confirm the authenticated check-in.");
    const record = fromDatabase(data, this.profileId);
    if (
      (Object.keys(parsed) as (keyof CheckInInput)[]).some(
        (key) => JSON.stringify(record[key]) !== JSON.stringify(parsed[key]),
      )
    )
      throw new Error("Submission ID already belongs to different values.");
    return record;
  }
}

// Not used by Phase 2 demo UI. Future authenticated server handlers must pass a
// Supabase user access token; publishable/anon key + verified JWT keeps RLS active.
export async function createAuthenticatedHealthRepository(
  accessToken: string,
): Promise<HealthRepository> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key)
    throw new Error(
      "Supabase is not configured. Local demo mode remains available.",
    );
  if (!accessToken) throw new Error("Authentication is required.");
  const client = createClient<Database>(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
  const {
    data: { user },
    error,
  } = await client.auth.getUser(accessToken);
  if (error || !user) throw new Error("A verified Supabase user is required.");
  const { data: profile, error: profileError } = await client
    .from("astronaut_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (profileError || !profile)
    throw new Error("An owned astronaut profile is required.");
  return new SupabaseHealthRepository(client, profile.id);
}
