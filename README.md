# Paperly — Free PDF Tools

Paperly is a premium, bilingual Bangla-English PDF toolkit for everyday file work. The public workspace is mobile-first and processes the core PDF actions in the browser so a user's PDF does not need to be permanently stored on the server.

## Included now

The first production-ready workspace includes JPG/PNG to PDF, PDF merge, split/extract one page, PDF compression, file validation, drag-and-drop upload, mobile file picking, dark mode, bilingual labels, responsive layout, privacy messaging, and a protected `/admin` control room. The admin area uses Manus OAuth and the database-backed admin role, with Tool Manager toggles, SEO/content fields, ad slot settings, site settings, access information, and visible audit history.

PDF-to-Word, OCR, translation, and AI summarization are intentionally marked as limited/future capabilities because complex scanned or layout-heavy documents cannot be converted reliably in a browser-only flow without heavier processing infrastructure.

## Run locally

```bash
pnpm install
pnpm dev
```

Useful checks:

```bash
pnpm check
pnpm test
pnpm build
```

## Render Web Service settings

This repository uses the full-stack Manus template because `/admin` and its protected controls require authentication and a database. In Render, use a Web Service rather than a Static Site if you want the admin/database routes to work:

| Setting | Value |
|---|---|
| Build command | `pnpm install --frozen-lockfile && pnpm build` |
| Start command | `pnpm start` |
| Environment | Node |
| Node version | 22 or newer |

Use the environment variables supplied by the Manus project for authentication and database access. Do not commit `.env` files or credentials. If you deploy only the browser tools as a static site, the public UI can work, but the protected admin panel and server procedures will not.

## Admin access

Open `/admin`. Unauthenticated visitors see a secure login gate. Authenticated non-admin users see an access-denied screen. The project owner is promoted to admin by the built-in auth upsert flow; additional access should be granted only by changing the user's database role with care.

## Domain and SEO

Before submitting to Google Search Console, replace `https://your-domain.com` in `client/public/robots.txt` and `client/public/sitemap.xml` with the final production domain. Keep the canonical URL consistent between Render, the domain provider, and the page metadata.

## Privacy note

Do not add permanent PDF storage without an explicit product decision. If future server-side OCR or document conversion is added, uploads should be temporary, access-controlled, and automatically deleted.

## Render custom domain for the Web Service

After the Web Service is live, open **Render Dashboard → your service → Settings → Custom Domains → Add Custom Domain** and enter both the root domain and `www` version if you want both to work. Render will show the exact DNS target for your service; use that value as the source of truth.

At your domain provider, create the records Render requests. A typical setup is `@` as an A record pointing to `216.24.57.1` and `www` as a CNAME pointing to your Render service hostname, such as `free-pdf-tools.onrender.com`. Remove conflicting old A/CNAME/forwarding records for the same host, but keep email-related MX, SPF, DKIM, and TXT records. Do not add an AAAA record unless Render explicitly instructs you to do so.

Return to Render and select **Verify**. DNS changes can take minutes or, depending on the provider, up to 24–48 hours. Render provisions and renews HTTPS automatically after verification. Test the final `https://` root and `www` URLs, then replace `https://your-domain.com` in `client/public/robots.txt` and `client/public/sitemap.xml` before submitting the domain to Google Search Console.
