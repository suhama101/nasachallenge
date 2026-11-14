// Matches supabase/migrations/202611140001_health_records.sql.
// Regenerate with the Supabase CLI after applying the migration to a real project.
export type AstronautProfileRow = {
  id: string;
  user_id: string;
  display_name: string;
  crew_identifier: string;
  mission_name: string;
  created_at: string;
};
export type HealthCheckInRow = {
  id: string;
  astronaut_profile_id: string;
  recorded_at: string;
  mission_local_date: string;
  heart_rate: number | null;
  systolic: number | null;
  diastolic: number | null;
  temperature: number | null;
  spo2: number | null;
  glucose: number | null;
  sleep: number | null;
  mood: string | null;
  fatigue: number | null;
  exercise: number | null;
  water: number | null;
  symptoms: string[];
  notes: string;
  urgent_symptom_reported: boolean;
  data_source: string;
  created_at: string;
  updated_at: string;
};
export type Database = {
  public: {
    Tables: {
      astronaut_profiles: {
        Row: AstronautProfileRow;
        Insert: Omit<AstronautProfileRow, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<AstronautProfileRow>;
        Relationships: [];
      };
      health_check_ins: {
        Row: HealthCheckInRow;
        Insert: Omit<HealthCheckInRow, "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<HealthCheckInRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
