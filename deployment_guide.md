# Deploying Meeting Point Finder to Cloudflare Pages

This guide explains how to deploy your application to Cloudflare Pages for free.

## Prerequisites

1. A [Cloudflare account](https://dash.cloudflare.com/sign-up).
2. Your code pushed to a GitHub repository.

## Steps

1. **Log in to Cloudflare Dashboard**:
    - Go to [dash.cloudflare.com](https://dash.cloudflare.com) and log in.

2. **Create a New Application**:
    - Navigate to **Workers & Pages** in the sidebar.
    - Click the **Create application** button.
    - Select the **Pages** tab.
    - Click **Connect to Git**.

3. **Connect GitHub**:
    - Select your GitHub account.
    - Select the repository `meeting-point-finder` (or whatever you named it).
    - Click **Begin setup**.

4. **Configure Build Settings**:
    - **Project name**: (Leave as is or change if you like).
    - **Production branch**: `main` (or your working branch).
    - **Framework preset**: Select **Next.js (Static HTML Export)**.
    - **Build command**: `npm run build` (should be default).
    - **Build output directory**: `out` (should be default).

5. **Add Environment Variables**:
    - Scroll down to **Environment variables (advanced)**.
    - Click **Add variable**.
    - **Variable name**: `NEXT_PUBLIC_MAPBOX_TOKEN`
    - **Value**: Paste your Mapbox token (starts with `pk.`).
    - *Note: You can find this in your local `.env.local` file.*

6. **Deploy**:
    - Click **Save and Deploy**.

Cloudflare will now clone your repo, build the project, and deploy it. Once finished, you will get a unique URL (e.g., `meeting-point-finder.pages.dev`) to share with your friends!

## Updating

To update the site, simply `git push` your changes to GitHub. Cloudflare will automatically trigger a new build and deployment.
