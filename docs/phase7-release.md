# Phase 7 release preparation

The owner explicitly approved committing, merging and releasing Phase 7 to the existing GitHub repository and Vercel production project. The earlier review documents describe the pre-approval state and are retained as audit records.

## Approved change

- `/` and `/welcome` share the beginner-friendly welcome experience.
- `/demo` preserves the guided demonstration; `/demo/overview` preserves the demo Mission Overview.
- The reviewed visual styling, action cards, form/history/insight readability and five-source research guidance are included.
- Personal account authentication, Supabase clients/actions, ownership rules, calculations, validation, APIs, database schema/migrations and environment settings are unchanged.
- The only change to the previously protected presentation frame is the reviewed `/` shell condition; the other 60 protected-file hashes are identical. Personal-overview changes are one presentation import and one action-card element.
- `.env.local` and all private environment files remain ignored. Credential-pattern and changed-file reviews found no sensitive credentials, personal record exports or database files in the release.

## Release checks rerun before committing

- ESLint: passed.
- TypeScript: passed.
- Production build: passed, 34 generated pages.
- Unit tests: 238 passed, 10 files.
- Homepage/demo/presentation browser tests: 51 passed.
- Mock Auth, session refresh/recovery and personal-record browser tests: 30 passed.
- No-key browser tests: 6 passed.
- Additional read-only checks against the fresh local production build: 30 passed across desktop and mobile, including six public entry routes, actual CTA navigation, and four anonymous protected-route redirects.
- All tests passed; no failing critical regression was found. Existing test-server canceled-navigation and color-environment diagnostics remain documented in the earlier review.

The source passed these checks before the feature branch is committed and fast-forwarded into main. Existing regression assertions are retained; dashboard-specific tests use its approved `/demo/overview` location. The release changes no dependencies or production configuration.

## Production verification gate

After pushing main, check the existing Vercel project's automatic deployment reaches Ready, its `githubCommitSha` equals the pushed main SHA, and the production alias resolves to that deployment. Recheck the public homepage, welcome, demo, overview, login/signup, actual navigation and anonymous protected routes. Do not describe deployment as successful until those checks finish.

The release never signs into a real personal account, inserts cloud health records, changes production environment variables, or runs SQL. Mocked account-isolation coverage is not live two-account RLS verification. Actual email delivery, live authenticated cloud behavior, physical devices and a full assistive-technology audit remain unverified in this release.

## Preserved rollback reference

- Baseline commit: `d55fc2fb55366da927718be95eb461024645b71e`.
- Baseline Vercel deployment: `dpl_EdVucvdPGoqADbZw4zCWsqQ5ZLut`.
- Baseline deployment URL: `https://missionpulse-3retvrpew-suhamas-projects.vercel.app`.
- Existing production alias: `https://missionpulse.vercel.app`.
- Local rollback tag: `missionpulse-pre-phase7` (created at the baseline for this release).

If an approved rollback is needed, pause further main pushes, sign in to the same Vercel scope and promote the existing baseline deployment:

```powershell
npx vercel promote https://missionpulse-3retvrpew-suhamas-projects.vercel.app --scope suhamas-projects
npx vercel inspect https://missionpulse.vercel.app --scope suhamas-projects
```

Confirm the alias points to `dpl_EdVucvdPGoqADbZw4zCWsqQ5ZLut`, the deployment is Ready and its Git SHA is the baseline, then check the public site. This restores the prior application deployment without SQL or environment edits. GitHub main will still contain Phase 7; review a separate Git revert and its tests before later pushes if a lasting source rollback is required. Do not reset or force-push main. No rollback is executed during a successful release.
