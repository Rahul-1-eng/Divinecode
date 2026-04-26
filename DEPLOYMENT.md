# DivineCode Deployment Guide

Live URLs:

- Frontend: `https://divinecode-web.vercel.app`
- Backend: `https://divinecode.onrender.com`

This repo is a monorepo with:

- `apps/web` — Next.js frontend for Vercel
- `apps/api` — Express + Socket.IO backend for Render

## Current remaining setup

Google OAuth client ID is ready. Add secrets only in Vercel/Render dashboards, not in GitHub.

## 1. Render backend settings

Render service URL:

```txt
https://divinecode.onrender.com
```

Settings:

- Root directory: `apps/api`
- Build command: `npm install && npm run build`
- Start command: `npm run start`
- Runtime: Node

Set `CLIENT_ORIGIN` to:

```txt
https://divinecode-web.vercel.app
```

## 2. Vercel frontend settings

Vercel URL:

```txt
https://divinecode-web.vercel.app
```

Settings:

- Framework: Next.js
- Root directory: `apps/web`
- Build command: `npm run build`

## 3. Google OAuth redirect URLs

In Google Cloud Console, add:

```txt
https://divinecode-web.vercel.app/api/auth/callback/google
```

Optional local callback:

```txt
http://localhost:3000/api/auth/callback/google
```

## 4. MongoDB Atlas setup

Create a MongoDB Atlas M0 free cluster and database named:

```txt
divinecode
```

Allow network access from Render. For quick setup, allow access from anywhere:

```txt
0.0.0.0/0
```

Create a database user and copy the MongoDB connection string.

## 5. Judge0

Use a public reachable Judge0 endpoint for production. Local Judge0 only works locally.

## Final env values

### Render backend

```env
PORT=4000
CLIENT_ORIGIN=https://divinecode-web.vercel.app
MONGODB_URI=mongodb+srv://Rahul_Kumar_Sahoo:REPLACE_WITH_YOUR_MONGODB_PASSWORD@cluster0.ktysgyz.mongodb.net/divinecode?retryWrites=true&w=majority&appName=Cluster0
MONGODB_DB=divinecode
JUDGE0_URL=https://YOUR_JUDGE0_URL
```

### Vercel frontend

```env
NEXT_PUBLIC_API_BASE_URL=https://divinecode.onrender.com
NEXT_PUBLIC_SOCKET_URL=https://divinecode.onrender.com
NEXTAUTH_URL=https://divinecode-web.vercel.app
NEXTAUTH_SECRET=generate-a-strong-random-secret
GOOGLE_CLIENT_ID=897519233396-vftvn746e5ev146j9uinpng47ka225i4.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## Local run

```bash
npm install
npm run dev
```
