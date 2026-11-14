import { z } from "zod";
const email = z
  .string()
  .trim()
  .email("Enter a valid email address.")
  .max(254, "Use an email address under 255 characters.");
const password = z
  .string()
  .min(12, "Use at least 12 characters for your password.")
  .max(128, "Use no more than 128 characters.");
export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password.").max(128),
});
export const emailSchema = z.object({ email });
export const newPasswordSchema = z
  .object({ password, confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Your passwords do not match.",
  });
export const signupSchema = loginSchema
  .extend({ password, confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Your passwords do not match.",
  });
const text = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `Enter your ${label}.`)
    .max(max, `Keep ${label} to ${max} characters.`);
export const environments = [
  "space-station",
  "spacecraft",
  "lunar-base",
  "mars-base",
  "other",
] as const;
export const environmentLabels: Record<(typeof environments)[number], string> =
  {
    "space-station": "Space station",
    spacecraft: "Spacecraft",
    "lunar-base": "Lunar base",
    "mars-base": "Mars base",
    other: "Other",
  };
export const profileSchema = z.object({
  displayName: text("display name", 120),
  crewId: text("crew ID", 80),
  missionName: text("mission name", 160),
  environment: z.enum(environments, {
    error: "Choose your mission environment.",
  }),
  startDate: z
    .string()
    .refine(
      (value) =>
        !value ||
        (/^\d{4}-\d{2}-\d{2}$/.test(value) &&
          value >= "0001-01-01" &&
          value <= "9999-12-31" &&
          Number.isFinite(Date.parse(value)) &&
          new Date(value).toISOString().slice(0, 10) === value),
      "Enter a valid mission start date, or leave it blank.",
    ),
  role: z.string().trim().max(120, "Keep your role to 120 characters."),
});
export type ProfileInput = z.infer<typeof profileSchema>;
export type FormState = {
  message?: string;
  errors?: Record<string, string>;
  redirectTo?: string;
  ok?: boolean;
};
export const safeDestination = (path: string | null) =>
  [
    "/astronaut",
    "/astronaut/onboarding",
    "/astronaut/profile",
    "/astronaut/daily-health-check",
    "/astronaut/health-history",
    "/astronaut/health-insights",
    "/auth/update-password",
  ].includes(path ?? "")
    ? path!
    : "/astronaut";
