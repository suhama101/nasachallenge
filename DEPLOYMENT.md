# GitHub → Vercel deployment

**Current release approval (15 November 2026):** the owner approved committing and pushing verified Phase 6B/6C plus authentication/session fixes to existing main, followed by automatic deployment to the existing MissionPulse production project. Tasks 1-3 must pass first; unresolved critical authentication or isolation issues block publication. Do not modify production variables or run production SQL. See [session/recovery findings and release gates](docs/session-and-release.md). Older approval records below are historical.

**Current Astronaut Mode foundation: local implementation only.** Do not commit, push, deploy, apply migrations or change production environment variables without fresh explicit approval. Prior Step 6A release approval does not cover this work. See [setup and release gates](docs/astronaut-mode-setup.md).

**Step 6A release approval:** The owner approved committing, pushing and automatically deploying the verified SpO₂ integrity and check-in/history usability changes to existing GitHub `main` and the existing Vercel project on 14 November 2026. Preserve https://missionpulse.vercel.app, repository visibility, browser storage and provider configuration. Verify the exact deployed SHA and Ready status, test rejected new zeros, optional missing readings and preserved legacy-zero review behavior across desktop/mobile and existing monitoring workflows. No Supabase/Groq setup or additional features are authorized.

**Phase 5 release approval:** The owner approved committing and pushing the verified demo/audit improvements to existing GitHub `main` and allowing the existing Vercel project to deploy automatically on 14 November 2026. Preserve https://missionpulse.vercel.app and repository visibility. Verify the exact deployed SHA, `/demo`, the complete Record → History → Insights → Assistant → Scenario → Research journey at all three viewport sizes, and preservation of previously saved browser-local demo records. Do not enable Groq, alter production environment variables or configure Supabase.

**Phase 4 release approval:** The owner approved committing, pushing and deploying the verified knowledge library and assistant to the existing `main` branch and Vercel project on 14 November 2026. Keep https://missionpulse.vercel.app unchanged. Use the existing Git connection; do not repeat the historical import instructions below. Live Groq remains unavailable without complete private configuration; this release does not change production environment variables. Before reporting success, match the production deployment's Git SHA to the pushed commit and test knowledge search, topic links, consented demo questions, chat persistence and existing monitoring workflows on the public URL.

**Phase 3 release approval:** The owner explicitly approved committing and deploying the verified Health Insights release to the existing `main` branch and `missionpulse` Vercel project on 14 November 2026. Production URL remains https://missionpulse.vercel.app. Verify the exact new commit and Ready state in Vercel; the deployment records below describe earlier setup.

**Phase 2 release:** The owner explicitly approved committing Phase 2 to `main` and deploying it through the existing GitHub/Vercel connection on 14 November 2026. The original deployment record below documents initial hosting setup. Use Vercel's current production deployment and commit SHA to confirm the latest release. See README.md for the check-in/history workflow and tests.

## Live deployment

Production: **https://missionpulse.vercel.app**

Deployed with user approval on 14 November 2026. Vercel reported Ready, and unauthenticated HTTPS checks returned 200 for the overview and six module routes, and 404 for an unknown route. GitHub repository visibility was not changed. No API keys were added. The dashboard source was not modified.

Vercel project `missionpulse` is connected to `suhama101/nasachallenge`, with production branch `main`, repository-root Next.js configuration, automatic Git deployments enabled, and Node.js 24.x selected to match local verification. The original source commit is `2ab9b5d4d6f2585009eedcc502eb34f5a296aa97`.

The instructions below describe initial setup and can be used to reproduce or inspect the configuration; the initial push and deployment have already been approved and completed.

The Next.js app lives in this directory. Push its contents as the repository root to `https://github.com/suhama101/nasachallenge`. The repository can remain private while the deployed website is public. No Supabase or Groq keys are required.

## Prepared and verified

- `npm.cmd run lint`: passed.
- `npm.cmd run typecheck`: passed.
- `npm.cmd run build`: passed; overview and six planned module routes generated.
- Existing `next.config.ts` uses standard Next.js defaults; no Vercel override file is required.
- `.gitignore` excludes dependency/build directories, `.vercel`, all `.env*` files except the empty `.env.example`, logs, signing keys and common credential directories.
- Application source has no environment-variable reads or Supabase/Groq requests.
- The remote repository was reachable but returned no branch references at preparation time.
- No deployment was created during initial preparation; the approved deployment is recorded above.

## Manual account actions and approval boundary

Do not push until you approve publishing this source to the selected repository. Do not select Deploy until you approve a public deployment. Repository visibility does not need to change.

1. Sign in to GitHub as the owner of `suhama101/nasachallenge`. Confirm this is the intended repository and keep its existing visibility. No new repository is necessary.
2. From this project folder, commit and push after reviewing the files:

   ```powershell
   cd "C:\Users\Suhama\Desktop\New folder\missionpulse"
   git status --short
   git add .
   git commit -m "Prepare MissionPulse Phase 1 for Vercel"
   git push -u origin main
   ```

   Complete GitHub's browser authentication if prompted. If Git requests an author identity, set your own `user.name` and `user.email` locally before committing. Do not put a token in the remote URL. If the remote has acquired commits since preparation, fetch and inspect them before integrating; do not force push.

   Git reported different sandbox/user ownership during preparation. The preparation commands used a per-command exception scoped to this project. If your terminal reports **dubious ownership**, first trust only this project directory and then retry:

   ```powershell
   git config --global --add safe.directory "C:/Users/Suhama/Desktop/New folder/missionpulse"
   ```

3. Sign in at https://vercel.com/new. Connect your GitHub account and authorize the Vercel GitHub App to access **only this repository** when selecting repositories.
4. Import `suhama101/nasachallenge` and review these settings:

   | Setting               | Value                                       |
   | --------------------- | ------------------------------------------- |
   | Framework preset      | Next.js                                     |
   | Root Directory        | `.` (repository root; package.json is here) |
   | Install command       | Default, or `npm ci`                        |
   | Build command         | `npm run build`                             |
   | Output directory      | Framework default; no override              |
   | Node.js               | 24.x, matching local verification           |
   | Environment variables | None                                        |
   | Production branch     | `main`                                      |

   If you instead place the app in a `missionpulse/` subfolder of a larger repository, set Root Directory to `missionpulse`. Do not use that setting for the repository-root layout prepared here.

5. After explicitly approving public deployment, click **Deploy**. Wait for **Ready**. Copy the assigned production URL from Vercel; do not infer a URL from the project name.
6. Check project deployment-protection settings for the production domain. To enable public review, the production URL must be accessible without Vercel login. Preview URLs may retain their separate protection policy.
7. Open the production URL in a signed-out/incognito browser. Check the overview, chart period selector, mobile navigation, six placeholder routes and an unknown route (404). Share the URL so it can also be verified from this session.

## Automatic deployments

Keep the GitHub repository connected in Vercel Project Settings → Git. The Vercel GitHub integration deploys branch pushes by default; pushes to the production branch update the production domain, while other branches receive preview deployments. Confirm `main` is the production branch. No GitHub Actions workflow or deployment token is needed for this integration.

After connection, confirm automatic deployment by pushing an approved change, then verify Vercel shows that commit SHA and reaches Ready. Automatic deployments were enabled after the first CLI deployment; this documentation update is used to verify the Git-triggered deployment.

References: [Vercel GitHub integration](https://vercel.com/docs/git/vercel-for-github), [Next.js on Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs).

## Known limitations

Phases 1–3 implement the interface, browser-persisted demo check-ins/history, and explainable prototype statistical monitoring. Supabase authentication, live database access, approved clinical protocols and AI integrations are not configured. Statistical rules are unvalidated and do not establish medical status. Optional live SQL/RLS tests require a disposable Supabase database and have not been run. The previous dependency audit found seven moderate development-only advisories in the linting dependency chain and zero production dependency vulnerabilities; a compatible automatic fix did not resolve the development advisories. A successful local build alone does not verify hosted deployment.
