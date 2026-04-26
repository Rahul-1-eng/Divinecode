# DivineCode Deployment Guide

This repo is a monorepo with:

- `apps/web` — Next.js frontend for Vercel
- `apps/api` — Express + Socket.IO backend for Render

## 1. Backend deploy on Render

Create a new **Web Service** on Render.

Settings:

- Root directory: `apps/api`
- Build command: `npm install && npm run build`
- Start command: `npm run start`
- Runtime: Node

Add backend environment variables from the final env section below.

After deploy, copy the Render backend URL. Example:

```txt
https://divinecode-api.onrender.com
```

## 2. Frontend deploy on Vercel

Import this GitHub repository in Vercel.

Settings:

- Framework: Next.js
- Root directory: `apps/web`
- Build command: `npm run build`
- Output: default Next.js output

Add frontend environment variables from the final env section below.

After deploy, copy the Vercel frontend URL. Example:

```txt
https://divinecode.vercel.app
```

Then update Render `CLIENT_ORIGIN` to the Vercel URL.

## 3. Google OAuth redirect URLs

In Google Cloud Console, add these authorized redirect URIs:

Local:

```txt
http://localhost:3000/api/auth/callback/google
```

Production:

```txt
https://YOUR_VERCEL_APP.vercel.app/api/auth/callback/google
```

## 4. Judge0

If using a hosted Judge0 service, set `JUDGE0_URL` to that base URL.

If running local Judge0, set:

```txt
JUDGE0_URL=http://localhost:2358
```

For Render production, use a reachable public Judge0 URL.

## Final env values

### apps/api on Render

```env
PORT=4000
CLIENT_ORIGIN=https://YOUR_VERCEL_APP.vercel.app
MONGODB_URI=mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/divinecode
MONGODB_DB=divinecode
JUDGE0_URL=https://YOUR_JUDGE0_URL
```

### apps/web on Vercel

```env
NEXT_PUBLIC_API_BASE_URL=https://YOUR_RENDER_API.onrender.com
NEXT_PUBLIC_SOCKET_URL=https://YOUR_RENDER_API.onrender.com
NEXTAUTH_URL=https://YOUR_VERCEL_APP.vercel.app
NEXTAUTH_SECRET=generate-a-strong-random-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Local frontend: apps/web/.env.local

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=local-dev-secret-change-this
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Local backend: apps/api/.env

```env
PORT=4000
CLIENT_ORIGIN=http://localhost:3000
MONGODB_URI=mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/divinecode
MONGODB_DB=divinecode
JUDGE0_URL=http://localhost:2358
```

## Local run

```bash
npm install
npm run dev
```

Open:

```txt
http://localhost:3000
```
