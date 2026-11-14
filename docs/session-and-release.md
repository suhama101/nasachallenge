# Astronaut release: session refresh and account recovery

The owner approved committing, pushing and deploying the verified Phase 6B/6C
changes to the existing `suhama101/nasachallenge` main branch and existing
MissionPulse Vercel project on 15 November 2026, conditional on passing checks
and no unresolved critical authentication/data-isolation issue. No production
SQL, migration edits, personal-record inspection or Vercel variable changes are
part of this release.

## Findings and fixes

- `/auth/session` previously returned 401 for all returned Auth errors, including
  rate limits and temporary provider failures. The browser interpreted this as
  sign-out. It now returns 503 for temporary errors, hides private content with
  a retry state, and preserves the session. Missing/invalid/unconfirmed sessions
  remain denied. Equivalent error handling is used by private-page access,
  health actions, profile saves and password updates.
- A restored browser-history page previously forced sign-in unconditionally.
  It now hides private content while re-verifying identity. A valid owner can
  continue; revoked or switched sessions still leave the private workspace.
- Proxy cookie writes now retain all earlier cookies and library cache headers
  when multiple SSR storage events occur within one request. Refreshed cookies
  reach both the downstream request and the browser response.
- SSR clients remain request-scoped, use the supported cookie adapter and call
  server-side `getUser`. There is no session-trust shortcut, service-role access,
  anonymous private-table access or fictional-data fallback.
- Production email links must use the existing canonical production origin.
  Email forms show a friendly unavailable state instead of silently accepting
  requests when the server email-link origin is invalid. Local and preview
  origins retain their existing configuration behavior.

These are genuine code defects found in review and reproduced by focused tests;
they do not establish the exact cause of the owner's historical refresh redirect.
An expired/revoked session, site-origin changes or browser cookie removal can
also require sign-in. Existing private records are not deleted by sign-out/reset.

## Cloud-record persistence boundary

Personal saves call a server action, verify Auth identity and resolve its owned
profile, insert through the Supabase SSR client, then read the owned record back
before reporting success. History reloads query Supabase again. Browser memory
is a temporary view, not the persistent store. Demo IndexedDB is separate and is
never imported into personal history. Owner filters, idempotent saves and stale
edit checks remain active. No owner's actual records were opened for this review.

The owner reports one fictional real-cloud save and retrieval. Automated tests
use fictional loopback services, not live user accounts. Live two-account RLS,
cross-device cloud retrieval and the 30 SQL assertions remain unverified. See
[Phase 6C gates](phase-6c-personal-health.md). Do not run the SQL fixture suite
against a live project containing user accounts.

## Environment and email configuration

The code needs `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
(legacy anon-key alternative is supported), and `APP_URL`. No privileged key is
needed. `.env.local` stays Git-ignored. Environment values/tokens must not appear
in terminal output, reports or Git.

Read-only Vercel metadata confirms all three production variables exist. Public
configuration can reach Auth and email confirmation is enabled. `APP_URL` is
marked sensitive: its value is not available through ordinary Vercel API reads.
`vercel env run` can inherit a local value for an unreadable sensitive variable;
that is not evidence of the production value. Verify the production signup and
reset forms are enabled after deployment: their server readiness check requires
the configured canonical production email-link origin, without exposing it.

The Supabase redirect allowlist and email templates cannot be fully verified
through the public Auth settings endpoint. Review these in Supabase Dashboard:

- Site URL: `https://missionpulse.vercel.app`.
- Allowed callbacks: `https://missionpulse.vercel.app/auth/callback` and
  `https://missionpulse.vercel.app/auth/callback?next=/auth/update-password`.
- Keep exact localhost callback entries too if local testing is still needed.
- If using token-hash templates, confirmation links should use
  `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email`;
  recovery links should use
  `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery`.
- Default PKCE redirects are also supported; request and open the email in the
  same browser/site used to request it. Never share or paste the link/token.

No redirect settings were changed automatically. Actual email delivery and the
owner's real password reset require the owner to complete the browser flow.

## Manual account recovery

Local: `http://localhost:3000/auth/forgot-password`.
Production after verified deployment:
`https://missionpulse.vercel.app/auth/forgot-password`.

1. Open the reset page and submit the email used for the existing test account.
   The response is deliberately generic and does not reveal account membership.
2. Open the newest recovery email in that same browser; check spam if needed.
   It should lead to `/auth/update-password` on the intended local/production site.
3. Enter and confirm a new unique password of 12–128 characters. Do not send the
   password or email link to anyone. Successful update returns to login.
4. Sign in at `/auth/login` with the same email and new password. Do not create a
   replacement account: it would have a different owner and empty history.
5. Open `/astronaut/health-history`, check the previously saved fictional record,
   then refresh. A valid session should remain signed in and reload the same
   record. Do not overwrite or delete it during verification.
6. A used/expired link should display a friendly message; request one fresh link
   rather than repeatedly opening older messages. A provider outage shows retry
   guidance, not a claim that records or the account have disappeared.

## Verification and publishing gates

Release checks include 238 passing unit tests, 28 passing mocked authenticated
desktop/mobile tests (including refresh and both recovery callback flows), and
six passing no-key desktop/tablet/mobile tests, and 33 passing demo regressions.
Lint, TypeScript and production build pass. Exact-commit production deployment
verification is required before reporting a released SHA as live. Mocked results are not a claim of live
two-account database isolation or real email delivery.

Run lint, TypeScript, production build, unit tests, the Auth/refresh/reset suite,
the no-key suite and all demo regressions. Scan the exact staged files for secrets.
Only after those pass, commit and push existing main. Let the connected project
deploy; match Ready status and production alias to the exact full Git SHA.
Check public `/`, `/demo`, `/auth/login`, `/auth/signup`, reset UI, and signed-out
personal routes in isolated browsers. Never fetch the owner's records or submit
real account forms automatically. Do not report a deployed URL as verified before
these checks have actually completed.
