"use client";
import { useActionState, useState } from "react";
import { profileAction } from "@/app/auth/actions";
import {
  environmentLabels,
  environments,
  type FormState,
} from "@/lib/auth/validation";
import type { AstronautProfileRow } from "@/lib/health/database.types";
import { FieldError, useAccountResult } from "./account-form";
import { Button } from "./ui/button";
export function ProfileForm({
  profile,
}: {
  profile: AstronautProfileRow | null;
}) {
  const [state, action, pending] = useActionState(
    profileAction,
    {} as FormState,
  );
  useAccountResult(state);
  const fields = [
    {
      name: "displayName",
      label: "Display name",
      value: profile?.display_name ?? "",
      help: "The name you would like to see in your workspace.",
      max: 120,
    },
    {
      name: "crewId",
      label: "Crew ID",
      value: profile?.crew_identifier ?? "",
      help: "Choose a simulation or mission identifier. This is not an identity check.",
      max: 80,
    },
    {
      name: "missionName",
      label: "Mission name",
      value: profile?.mission_name ?? "",
      help: "The mission or research simulation you are following.",
      max: 160,
    },
    {
      name: "role",
      label: "Role (optional)",
      value: profile?.role ?? "",
      help: "For example, mission specialist. Leave blank if not needed.",
      max: 120,
    },
    {
      name: "startDate",
      label: "Mission start date (optional)",
      value: profile?.mission_start_date ?? "",
      help: "Leave blank if your mission has no start date yet.",
      max: undefined,
    },
  ];
  const [values, setValues] = useState<Record<string, string>>(() => ({
    ...Object.fromEntries(fields.map((field) => [field.name, field.value])),
    environment: profile?.mission_environment ?? "",
  }));
  return (
    <form
      className="account-form"
      action={action}
      onReset={(event) => event.preventDefault()}
      noValidate
      aria-label="Mission profile form"
    >
      {state.message && (
        <p role="alert" className="account-error">
          {state.message}
        </p>
      )}
      {fields.map((field) => (
        <div className="account-field" key={field.name}>
          <label htmlFor={`profile-${field.name}`}>
            {field.label}
            {["displayName", "crewId", "missionName"].includes(field.name) &&
              " (required)"}
          </label>
          <input
            id={`profile-${field.name}`}
            name={field.name}
            type={field.name === "startDate" ? "date" : "text"}
            value={values[field.name]}
            onChange={(event) =>
              setValues({ ...values, [field.name]: event.target.value })
            }
            maxLength={field.max}
            autoComplete={field.name === "displayName" ? "nickname" : "off"}
            required={["displayName", "crewId", "missionName"].includes(
              field.name,
            )}
            aria-invalid={!!state.errors?.[field.name]}
            aria-describedby={`profile-${field.name}-help ${state.errors?.[field.name] ? `profile-${field.name}-error` : ""}`}
          />
          <small id={`profile-${field.name}-help`}>{field.help}</small>
          <FieldError
            id={`profile-${field.name}-error`}
            error={state.errors?.[field.name]}
          />
        </div>
      ))}
      <div className="account-field">
        <label htmlFor="profile-environment">
          Mission environment (required)
        </label>
        <select
          id="profile-environment"
          name="environment"
          value={values.environment}
          onChange={(event) =>
            setValues({ ...values, environment: event.target.value })
          }
          required
          aria-invalid={!!state.errors?.environment}
          aria-describedby={
            state.errors?.environment ? "profile-environment-error" : undefined
          }
        >
          <option value="" disabled>
            Choose an environment
          </option>
          {environments.map((value) => (
            <option key={value} value={value}>
              {environmentLabels[value]}
            </option>
          ))}
        </select>
        <FieldError
          id="profile-environment-error"
          error={state.errors?.environment}
        />
      </div>
      <p className="account-fine">
        This is a self-described profile, not a verified professional identity.
        Do not include medical details in these fields.
      </p>
      <Button type="submit" disabled={pending}>
        {pending
          ? "Saving your profile…"
          : profile
            ? "Save profile changes"
            : "Save profile and continue"}
      </Button>
    </form>
  );
}
