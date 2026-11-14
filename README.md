# MissionPulse

An astronaut health monitoring and decision-support frontend prepared for NASA Space Apps Challenge 2026. Phase 1 explores clear presentation of health records, trends and mission context. This is an independent research demonstration, not a NASA-endorsed product or certified medical diagnostic system.

All crew identities and measurements are fictional. No clinical assessment, diagnosis or treatment recommendation is generated. The overview is a fixed synthetic snapshot dated 14 November 2026, not live telemetry. Example observations are authored copy, not a medical algorithm.

## Local setup

Requirements: Node.js 20.9 or newer (Node 24 recommended), npm, and a modern browser.

```powershell
cd "C:\Users\Suhama\Desktop\New folder\missionpulse"
npm.cmd install
npm.cmd run dev
```

Open http://localhost:3000. On macOS/Linux, use `npm` instead of `npm.cmd`. Subsequent reproducible installs can use `npm ci` with the included lockfile. No API keys or environment file are needed.

## Development commands

| Command             | Purpose                                                     |
| ------------------- | ----------------------------------------------------------- |
| `npm run dev`       | Local Next.js development server                            |
| `npm run lint`      | ESLint including Next.js accessibility and TypeScript rules |
| `npm run typecheck` | Strict TypeScript check                                     |
| `npm run build`     | Production build and route generation                       |
| `npm start`         | Serve the production build                                  |

## Stack and structure

Next.js App Router, strict TypeScript, React, Tailwind CSS v4, shadcn/ui Button composition with Radix Slot, Lucide icons, and Recharts. Inter Variable is bundled locally through Fontsource, avoiding a font-service request at runtime or build time. `components.json` configures future shadcn/ui additions.

```text
src/app/                 App shell, overview, route/error/loading boundaries, styles
src/app/[section]/       Six statically generated planned-module pages
src/components/          Sidebar/header shell, page layout, metrics, charts, observations, states
src/components/ui/       Reusable shadcn/ui-style primitives
src/lib/mock-data.ts     Central typed synthetic dataset, mission, observations and module plans
src/lib/utils.ts         Class-name utility
```

## Implemented in Phase 1

- Responsive aerospace interface with desktop sidebar and mobile menu, Escape handling and focus containment.
- Seven working navigation destinations, active-route indicators, skip link, visible keyboard focus and reduced-motion support.
- Mission overview with fictional crew, mission progress, four latest measurements, source labels and UTC timestamps.
- Recharts heart-rate and sleep charts with working 7/14-day selection, computed descriptive averages and an accessible exact-value table.
- Fixed synthetic check-in status, carefully qualified example observations and a brief sleep-in-orbit explainer linked to NASA research.
- Reusable loading, empty and recoverable error states, plus a 404 page.
- Six clearly labeled planned-module pages; no simulated save, chat, authentication or notification controls.

## Future phases (not implemented)

Daily recording, persisted health history, reviewed educational sources, explainable insights, authenticated profiles, Supabase storage/authentication, and a Groq-powered assistant. No Supabase/Groq SDK, database schema, login, medical decision algorithm or offline AI is present.

## Deployment and integration boundaries

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the prepared GitHub remote, exact Vercel import settings, manual account actions, approval boundary and verification procedure.

Import this directory into Vercel as a **Next.js** project. If importing its parent workspace, set **Root Directory** to `missionpulse`. Use the default `npm run build` build command and Next.js output settings; no custom `vercel.json` or export configuration is needed. Use a supported Node.js runtime (24 recommended). Deployment has not been performed in this phase.

The application needs no writable runtime filesystem. The mock dataset is compiled into the frontend and contains no private information. `.env.example` reserves server-only variables for future integrations; copying it is optional. Keep secret keys out of client modules and never prefix secret keys with `NEXT_PUBLIC_`. Introduce future data access and AI requests through server-only modules/route handlers with authentication and validation. Do not replace mock data with sensitive records inside client bundles.

## Verification

Run `npm run lint`, `npm run typecheck`, and `npm run build`. Linting is a separate required command because the production build does not run ESLint. Browser-level visual/accessibility testing should accompany future feature work; automated lint checks alone do not certify accessibility or medical suitability.

Completed verification on 14 November 2026:

| Check | Result |
| --- | --- |
| `npm.cmd run lint` | Passed, no warnings or errors |
| `npm.cmd run typecheck` | Passed, strict TypeScript |
| `npm.cmd run build` | Passed, overview and six module routes prerendered |
| Production HTTP smoke check | All seven routes returned 200; unknown route returned 404 |
| `npm.cmd audit --omit=dev` | Zero production dependency vulnerabilities |
| `npm.cmd audit` / `npm.cmd audit fix` | Seven moderate development-only advisories remain in the TypeScript ESLint dependency chain (transitive minimatch); compatible automatic fix did not resolve them |

No browser automation was available in the session. Responsive styling, chart interaction and focus behavior still need manual browser review. No deployment was performed. The temporary production server used for route checks was stopped.
