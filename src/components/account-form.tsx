"use client";
import { useActionState, useEffect, useState } from "react";
import { accountAction } from "@/app/auth/actions";
import type { AuthOperation } from "@/lib/auth/service";
import type { FormState } from "@/lib/auth/validation";
import { Button } from "./ui/button";
import { notifyAccountTransition } from "@/lib/auth/transitions";

export function useAccountResult(state: FormState, notifySession = false) {
  useEffect(() => {
    if (!state.redirectTo) return;
    if (notifySession) notifyAccountTransition();
    // Hard navigation discards private component and router caches.
    window.location.replace(state.redirectTo);
  }, [state.redirectTo, notifySession]);
}
const labels: Record<AuthOperation, string> = {
  login: "Sign In",
  signup: "Create Account",
  "forgot-password": "Send reset link",
  "update-password": "Save new password",
  resend: "Send verification email",
  logout: "Sign Out",
};
export function AccountForm({
  operation,
  configured,
}: {
  operation: AuthOperation;
  configured: boolean;
}) {
  const [state, action, pending] = useActionState(
    accountAction.bind(null, operation),
    {} as FormState,
  );
  useAccountResult(state, true);
  const [values, setValues] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const needsEmail = !["update-password", "logout"].includes(operation);
  const needsPassword = ["login", "signup", "update-password"].includes(
    operation,
  );
  const confirmation = ["signup", "update-password"].includes(operation);
  // A native POST ensures logout fully replaces the private document and does
  // not re-render a protected Server Component after its cookie is removed.
  if (operation === "logout")
    return (
      <form
        action="/auth/logout"
        method="post"
        className="account-form"
        onSubmit={notifyAccountTransition}
      >
        <Button type="submit">Sign Out</Button>
      </form>
    );
  return (
    <form
      action={action}
      onReset={(event) => event.preventDefault()}
      className="account-form"
      noValidate
      aria-label={`${labels[operation]} form`}
    >
      {state.message && (
        <div
          className={state.ok ? "account-success" : "account-error"}
          role={state.ok ? "status" : "alert"}
        >
          {state.message}
        </div>
      )}
      {needsEmail && (
        <div className="account-field">
          <label htmlFor={`${operation}-email`}>Email address</label>
          <input
            id={`${operation}-email`}
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            value={values.email}
            onChange={(event) =>
              setValues({ ...values, email: event.target.value })
            }
            aria-invalid={!!state.errors?.email}
            aria-describedby={
              state.errors?.email ? `${operation}-email-error` : undefined
            }
          />
          <FieldError
            id={`${operation}-email-error`}
            error={state.errors?.email}
          />
        </div>
      )}
      {needsPassword && (
        <div className="account-field">
          <label htmlFor={`${operation}-password`}>
            {operation === "update-password" ? "New password" : "Password"}
          </label>
          <input
            id={`${operation}-password`}
            name="password"
            type="password"
            autoComplete={
              operation === "login" ? "current-password" : "new-password"
            }
            required
            maxLength={128}
            value={values.password}
            onChange={(event) =>
              setValues({ ...values, password: event.target.value })
            }
            aria-invalid={!!state.errors?.password}
            aria-describedby={`${operation}-password-help ${state.errors?.password ? `${operation}-password-error` : ""}`}
          />
          <small id={`${operation}-password-help`}>
            {operation === "login"
              ? "Enter the password you chose when creating your account."
              : "Use 12–128 characters. A long, unique passphrase works well."}
          </small>
          <FieldError
            id={`${operation}-password-error`}
            error={state.errors?.password}
          />
        </div>
      )}
      {confirmation && (
        <div className="account-field">
          <label htmlFor={`${operation}-confirm`}>Confirm password</label>
          <input
            id={`${operation}-confirm`}
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            maxLength={128}
            value={values.confirmPassword}
            onChange={(event) =>
              setValues({ ...values, confirmPassword: event.target.value })
            }
            aria-invalid={!!state.errors?.confirmPassword}
            aria-describedby={
              state.errors?.confirmPassword
                ? `${operation}-confirm-error`
                : undefined
            }
          />
          <FieldError
            id={`${operation}-confirm-error`}
            error={state.errors?.confirmPassword}
          />
        </div>
      )}
      <Button disabled={pending || !configured} type="submit">
        {pending ? "Please wait…" : labels[operation]}
      </Button>
    </form>
  );
}
export function FieldError({ id, error }: { id: string; error?: string }) {
  return error ? (
    <small id={id} className="field-error">
      {error}
    </small>
  ) : null;
}
