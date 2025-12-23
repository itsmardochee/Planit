# Deployment → Frontend (Vercel)

This document explains how to deploy the Planit frontend (Vite) to Vercel, configure environment variables, and common troubleshooting steps.

## 1. Vercel project setup

- Sign in to https://vercel.com with your GitHub account.
- Click **New Project** → **Import Git Repository** and select `itsmardochee/Planit`.
- Choose the **main** branch as the Production Branch.
- Build & Output settings:
  - **Framework Preset**: `Vite` (or "Other")
  - **Build Command**: `npm run build`
  - **Output Directory**: `dist`

## 2. Configure environment variables

- In the Vercel Project Dashboard, go to **Settings → Environment Variables**.
- Add the production variable:
  - `VITE_API_URL` = `https://api.example.com/api` (replace with your backend URL)
- Add the variable for **Production**. Optionally add for **Preview** if preview builds need it.

## 3. Confirm Vite production build

From the `client/` folder locally:

```bash
cd client
npm install
npm run build
# build output should appear in client/dist/
```

Vercel will run `npm run build` during deployment and serve files from `dist/`.

## 4. CI / Preview Deploys

- Vercel automatically creates Preview Deployments for pull requests and deploys to Production when changes are merged to `main`.
- Ensure Preview env vars are configured if previews must access a staging API.

## 5. CORS considerations

- Backend must allow the Vercel origin (e.g. `https://your-project.vercel.app`) in its CORS allowlist.
- Prefer validating allowed origins in production rather than using `*`.

## 6. Troubleshooting (common Vite + Vercel issues)

- `npm run build` missing: ensure `client/package.json` has a `build` script that runs `vite build`.
- Env vars not present in client: only `VITE_` prefixed variables are available in browser code.
- 404 on assets: check `base` in `vite.config.js` if site is served from a sub-path.
- Preview deploys cannot reach the backend: provide Preview env vars or a publicly accessible staging API.
- Mixed content: use `https://` for `VITE_API_URL` in production.

## 7. Example `.env.production` (frontend)

Create `client/.env.production` with content like:

```
# Production environment variables for the Vite frontend
VITE_API_URL=https://api.example.com/api
```

## 8. Useful links

- Vercel docs: https://vercel.com/docs
- Vite envs: https://vitejs.dev/guide/env-and-mode.html
- Repo environment conventions: `./.github/copilot-instructions.md`

Follow the steps above to enable automatic previews on PRs and production deployments on `main`.
