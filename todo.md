# Complete PDF Platform Delivery Checklist

## Confirmation before implementation

- [x] Confirm whether the existing CutBG project should be replaced entirely or retained as a separate tool — replace entirely with the new PDF platform.
- [x] Confirm the public brand name and preferred GitHub repository name — use `free-pdf-tools`.
- [x] Confirm the GitHub owner/account and whether the user authorizes creating a public or private repository — create a public repository under the connected account.
- [x] Confirm whether the user wants an MVP with the highest-value tools first or every advanced tool in the first release — include common tools now; mark advanced/OCR tools safely where browser limits apply.
- [x] Confirm the admin login approach and whether the user can complete any required GitHub or Render login step in the browser — use a separate protected admin access path with authentication.

## Design requirements

- [x] Use a premium, polished visual theme without sacrificing clarity or speed.
- [x] Make Bangla the primary explanatory language and pair familiar English labels with important tools.
- [x] Keep upload, process, preview, edit, and download flows obvious for non-technical mobile users.
- [x] Apply the same clear bilingual hierarchy, accessible contrast, spacing, and interaction feedback inside the admin panel.

## Public platform

- [x] Implement bilingual premium PDF tools homepage and navigation.
- [x] Implement the reliable first-release browser workflows: image-to-PDF, merge, split/extract one page, and PDF compression; add clear entry points for the broader catalog.
- [x] Add clear limitations for PDF-to-Word, PDF-to-Excel, PDF-to-PPT, OCR, translation, and summarization instead of silently promising perfect conversion.
- [x] Add file validation, 25 MB guidance, mobile upload states, file removal, dark mode, and responsive interaction feedback.
- [x] Add visible progress, cancellation, and retry handling for the current core workflows; multi-output download remains future work because current core runs produce one result.
- [x] Add Bengali-English metadata, FAQ, privacy messaging, sitemap, robots, manifest, and structured public navigation.
- [x] Add crawlable bilingual landing pages for the core tool routes; additional advanced tool pages remain future work.

## Admin-ready backend

- [x] Upgrade the project to a backend/database/auth-enabled stack before implementing a real admin panel.
- [x] Implement protected admin login gate, session-aware access, owner admin role check, and admin route protection.
- [x] Keep Manus OAuth as the current admin authentication; password reset and optional two-factor authentication are deferred because passwords are not managed by this app.
- [x] Restore visible database-backed audit-log history controls in the current admin panel.
- [x] Implement admin dashboard, tool manager, bilingual SEO/content form, site settings, AdSense slot controls, access screen, and system status presentation.
- [x] Explicitly defer feedback inbox, aggregate analytics ingestion, and configuration backup/export; the current release avoids collecting user PDF data or centralized usage data.
- [x] Keep the browser-first product free of permanent user PDF storage by default; document the privacy boundary.
- [x] Add role authorization for admin procedures and client-side file-type validation.
- [x] No server-side PDF conversion or permanent upload route exists in the current release; rate limiting and temporary-file deletion are documented requirements for a future backend conversion feature.

## GitHub and Render

- [x] Use the user-created public GitHub repository `juyel0708/free-pdf-tools`.
- [x] Add README, Render build settings, environment-variable documentation, and deployment instructions.
- [x] Push the complete tested Paperly project to GitHub.
- [x] Verify the production build succeeds and document the correct Render Web Service settings.
- [x] Verify the repository exists publicly on `juyel0708/free-pdf-tools` and is ready to be selected by Render; final service creation remains a user action.
- [x] Provide exact Render settings and custom-domain DNS steps.

## Quality and delivery

- [x] Validate the release with TypeScript, unit tests, production build, invalid-file handling, and desktop/mobile visual QA; physical-device file matrix remains a recommended post-deploy check.
- [x] Visually verify desktop public and admin routes; complete physical-device browser matrix after deployment.
- [x] Run TypeScript check, unit tests, and production build; continue deeper accessibility/security checks before public launch.
- [x] Create a final checkpoint and deliver the repository URL plus Render deployment values.

## Gap fixes before checkpoint

- [x] Link `client/public/manifest.json` from `client/index.html` and re-verify install metadata.
- [x] Replace hardcoded admin dashboard metrics/activity with privacy-safe database-backed aggregate counters or clearly label unavailable data.
- [x] Add updated full-stack Render Web Service deployment and custom-domain instructions for the new architecture.

## Final QA gaps

- [x] Verify the linked manifest and metadata files are included in the production bundle.
- [x] Replace the remaining Indexed pages placeholder with an unavailable state.
- [x] Re-run final visual and QA checks after the dashboard cleanup.

## Metadata verification follow-up

- [x] Verify built sitemap.xml, robots.txt, manifest.json, title, description, and manifest link in `dist/public`.
- [x] Record the post-build metadata verification result in the QA notes before the checkpoint.

## User-provided GitHub repository

- [x] Connect the local project to `https://github.com/juyel0708/free-pdf-tools.git`.
- [x] Push the tested Paperly project to the provided public repository.
- [x] Verify the remote `main` branch and repository contents after push.

## Post-rollback restoration

- [x] Restore visible database-backed audit history in the current rolled-back admin panel.
- [x] Re-run TypeScript, unit tests, and production build after the restoration.
- [x] Push the restored admin panel to the user-provided GitHub repository.

## Post-rollback feature restoration

- [ ] Re-implement and verify progress, cancellation, and retry in the current rolled-back public workspace.
- [ ] Restore and verify the core crawlable tool landing routes and sitemap in the current rolled-back codebase.
- [ ] Verify the pushed GitHub main branch contains the restored files after the final push.
