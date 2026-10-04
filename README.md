# anant jamuar

A minimal portfolio built with Next.js, React, and TypeScript. Instrument Sans, a mist blue background, interactive particles, and smooth Index/Contact navigation.

## Local development

Use Node.js 22 or newer (`.nvmrc` selects 22).

```sh
npm ci
npm run dev
```

Open http://localhost:3000. No environment variables or API keys are required.

## Build for deployment

```sh
npm run typecheck
npm run build
```

The complete static website is generated in `out/`. Upload the contents to any static host; no Node server is needed. `next start` is not used for a static export.

To preview the export locally with Python installed:

```sh
python3 -m http.server 3001 --directory out
```

Open http://localhost:3001.

## Deploy

### Static hosting or a branch preview

Connect `redesign-minimal` to your hosting provider with these settings:

| Setting | Value |
| --- | --- |
| Install | `npm ci` |
| Build | `npm run build` |
| Publish directory | `out` |
| Node.js | 22 |
| Environment variables | None |

Alternatively, upload `out/` directly to a static host. The archived design explorations are not exported.

### GitHub Pages

This repository already uses GitHub Actions for Pages and the custom domain `anantjamuar.me`. `public/CNAME` preserves that domain.

The **Build and deploy portfolio** workflow builds this branch on push and uploads a `github-pages` artifact. Publishing runs only when you manually dispatch the workflow.

For the new manual workflow to appear in GitHub's **Run workflow** menu, `.github/workflows/deploy.yml` must also exist on the repository's default branch. When ready to publish, either make `redesign-minimal` the default branch or add this workflow file to the existing default branch. Then:

1. Keep **Settings → Pages → Source** set to **GitHub Actions**.
2. Ensure the `github-pages` environment allows deployments from `redesign-minimal`.
3. Open **Actions → Build and deploy portfolio → Run workflow** and select `redesign-minimal`.

A manual deployment replaces the website at the existing custom domain. Pushing this branch only builds the export.

## Editing

- `components/intro-copy.tsx` and `contact-copy.tsx`: page copy.
- `components/elsewhere.tsx`: profile links shared by both sections.
- `components/particle-artwork.tsx`: finalized particle settings.
- `components/soft-spotlight-background.tsx`: finalized background settings.
- `app/globals.css`: layout, colors, and annotations.
- `design/`: retained artwork and branding explorations.

Third-party component and font notices are in `THIRD_PARTY_NOTICES.md`.
