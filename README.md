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

The **Build and deploy portfolio** workflow runs on pushes to `redesign-minimal` and `main`. Each successful build produces two artifacts, retained for 30 days:

- **portfolio-static**: contains `portfolio-static.zip`, with `index.html` and all assets at the archive root. Download from the workflow run’s **Artifacts** section and unzip it to use on a static host.
- **github-pages**: the Pages-specific package consumed directly by `actions/deploy-pages`.

### Publishing the redesign

The repository already has Pages set to **GitHub Actions**. The workflow publishes only from `main`.

1. Replace the contents of `main` with this branch’s complete tree when ready. Do not retain the old site files or old deployment workflows.
2. Push that replacement commit to `main`.
3. The workflow builds and deploys to https://anantjamuar.me automatically. Its deployment job reports the live URL.

Keep the `github-pages` environment’s deployment rule set to allow `main`. Once this workflow exists on `main`, **Actions → Build and deploy portfolio → Run workflow → main** can also rebuild and redeploy manually.

Pushing `redesign-minimal` produces the artifacts and leaves the current live site in place. There are no deploy tokens or additional secrets to configure.

Implementation follows [GitHub’s custom Pages workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Editing

- `components/intro-copy.tsx` and `contact-copy.tsx`: page copy.
- `components/elsewhere.tsx`: profile links shared by both sections.
- `components/particle-artwork.tsx`: finalized particle settings.
- `components/soft-spotlight-background.tsx`: finalized background settings.
- `app/globals.css`: layout, colors, and annotations.
- `design/`: retained artwork and branding explorations.

Third-party component and font notices are in `THIRD_PARTY_NOTICES.md`.
