import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AstronautProfileRow,
  Database,
} from "@/lib/health/database.types";
import { profileSchema, type ProfileInput } from "./validation";
import { DEMO_PROFILE_ID } from "@/lib/health/repository";

export function ownedProfile(row: AstronautProfileRow, userId: string) {
  if (row.user_id !== userId || row.id === DEMO_PROFILE_ID)
    throw new Error("Profile ownership could not be verified.");
  return row;
}
export async function loadProfile(
  client: SupabaseClient<Database>,
  userId: string,
) {
  const { data, error } = await client
    .from("astronaut_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error)
    throw new Error(
      "Your profile could not be loaded. Please try again shortly.",
    );
  return data ? ownedProfile(data, userId) : null;
}
export async function storeProfile(
  client: SupabaseClient<Database>,
  userId: string,
  input: ProfileInput,
) {
  const value = profileSchema.parse(input);
  const existing = await loadProfile(client, userId);
  const fields = {
    display_name: value.displayName,
    crew_identifier: value.crewId,
    mission_name: value.missionName,
    mission_environment: value.environment,
    mission_start_date: value.startDate || null,
    role: value.role || null,
  };
  const table = client.from("astronaut_profiles");
  const query = existing
    ? table.update(fields).eq("user_id", userId).eq("id", existing.id)
    : table.insert({ ...fields, user_id: userId });
  const { data, error } = await query.select("*").single();
  if (error || !data)
    throw new Error(
      "Your profile could not be saved. Your entries are still here; please try again.",
    );
  return ownedProfile(data, userId);
}
