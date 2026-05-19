# 🚀 FixMyCity v2 — Deployment Guide

## Project Structure
```
fixmycity_v2/
├── backend/              → Deploy on Render
├── citizen-frontend/     → Deploy on Netlify (Site 1)
└── municipal-frontend/   → Deploy on Netlify (Site 2)
```

---

## STEP 1: Push to GitHub

```bash
cd fixmycity_v2
git init
git add .
git commit -m "Initial FixMyCity v2 setup"
git remote add origin https://github.com/YOUR_USERNAME/fixmycity.git
git push -u origin main
```

---

## STEP 2: Deploy Backend on Render (free)

1. Go to https://render.com → Sign up
2. Click **New** → **Web Service**
3. Connect your GitHub repo
4. Settings:
   - **Name**: fixmycity-backend
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: Free
5. Add all environment variables from your `.env` file in the **Environment** tab:
   ```
   MONGODB_URI=your_atlas_uri
   JWT_SECRET=your_secret
   FIREBASE_PROJECT_ID=...
   FIREBASE_PRIVATE_KEY=...
   FIREBASE_CLIENT_EMAIL=...
   CLOUDINARY_CLOUD_NAME=...
   CLOUDINARY_API_KEY=...
   CLOUDINARY_API_SECRET=...
   CITIZEN_URL=https://fixmycity-citizen.netlify.app
   MUNICIPAL_URL=https://fixmycity-municipal.netlify.app
   NODE_ENV=production
   ```
6. Click **Create Web Service**
7. Copy your Render URL (e.g. `https://fixmycity-backend.onrender.com`)

---

## STEP 3: Update API_BASE in both frontends

After deploying backend, update the API_BASE in:

**citizen-frontend/js/app.js** line 5:
```js
: 'https://fixmycity-backend.onrender.com/api';
```

**municipal-frontend/js/app.js** line 5:
```js
: 'https://fixmycity-backend.onrender.com/api';
```

Then commit and push again:
```bash
git add .
git commit -m "Update API URL to Render backend"
git push
```

---

## STEP 4: Deploy Citizen Frontend on Netlify

1. Go to https://netlify.com → Sign up / Login
2. Click **Add new site** → **Import an existing project**
3. Connect GitHub → Select your repo
4. Settings:
   - **Base directory**: `citizen-frontend`
   - **Build command**: (leave empty — it's plain HTML)
   - **Publish directory**: `citizen-frontend`
5. Click **Deploy site**
6. Rename site to `fixmycity-citizen` (in Site Settings → General)
7. Your citizen app: `https://fixmycity-citizen.netlify.app`

---

## STEP 5: Deploy Municipal Frontend on Netlify

1. Click **Add new site** again
2. Connect same GitHub repo
3. Settings:
   - **Base directory**: `municipal-frontend`
   - **Build command**: (leave empty)
   - **Publish directory**: `municipal-frontend`
4. Click **Deploy site**
5. Rename to `fixmycity-municipal`
6. Your municipal portal: `https://fixmycity-municipal.netlify.app`

---

## STEP 6: Update Firebase Authorized Domains

1. Go to Firebase Console → Authentication → Settings → Authorized Domains
2. Add:
   - `fixmycity-citizen.netlify.app`
   - `fixmycity-municipal.netlify.app`

---

## STEP 7: Update Firebase Config in HTML files

In `citizen-frontend/pages/login.html` and `register.html`:
Replace `REPLACE_WITH_YOUR_FIREBASE_*` with your actual Firebase values.

---

## Local Development

**Backend:**
```bash
cd backend
npm install
npm run dev
# Running at http://localhost:5000
```

**Citizen Frontend:**
```bash
# Option 1: VS Code Live Server (recommended)
# Right-click index.html → Open with Live Server

# Option 2: Simple HTTP server
cd citizen-frontend
python3 -m http.server 3000
# Open http://localhost:3000
```

**Municipal Frontend:**
```bash
cd municipal-frontend
python3 -m http.server 5001
# Open http://localhost:5001
```

---

## URL Summary

| Service | Local | Production |
|---------|-------|------------|
| Backend API | http://localhost:5000 | https://fixmycity-backend.onrender.com |
| Citizen App | http://localhost:3000 | https://fixmycity-citizen.netlify.app |
| Municipal Portal | http://localhost:5001 | https://fixmycity-municipal.netlify.app |

---

## Git Daily Workflow

```bash
# Check what changed
git status

# Stage all changes
git add .

# Save with a message
git commit -m "What you changed"

# Push to GitHub (also auto-redeploys on Netlify & Render!)
git push
```

Netlify and Render auto-deploy whenever you push to GitHub! 🎉
