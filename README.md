# FixMyCity — Complete Local Setup Guide

## Project Overview

FixMyCity is a civic issue reporting platform with:

* Citizen frontend
* Municipal frontend
* Node.js + Express backend
* MongoDB database
* Firebase authentication
* Google Apps Script + Google Drive file uploads
* Optional Cloudinary integration

This guide explains how to make the full project work locally when you already have the source code.

---

# Project Structure

```bash
FixMyCity/
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── package.json
│   └── server.js
│
├── citizen-frontend/
│   ├── pages/
│   ├── js/
│   ├── css/
│   └── index.html
│
├── municipal-frontend/
│   ├── pages/
│   ├── js/
│   ├── css/
│   └── index.html
│
└── README.md
```

---

# Requirements

Install the following:

## 1. Node.js

Install:

* Node.js v18 or newer

Check:

```bash
node -v
npm -v
```

---

## 2. MongoDB Atlas Account

Create account:

* [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)

---

## 3. Firebase Account

Create account:

* [https://console.firebase.google.com](https://console.firebase.google.com)

---

## 4. Google Account

Needed for:

* Google Drive
* Google Apps Script

---

# STEP 1 — MongoDB Setup

## Create Cluster

1. Open MongoDB Atlas
2. Create a free cluster
3. Create database user
4. Add IP:

```text
0.0.0.0/0
```

5. Click:

```text
Connect → Drivers
```

6. Copy connection string:

```text
mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/fixmycity
```

---

## Add MongoDB URI to backend/.env

Create:

```bash
backend/.env
```

Add:

```env
MONGODB_URI=your_mongodb_connection_string
```

---

# STEP 2 — Firebase Setup

Firebase is used for:

* Google Login
* Authentication
* Token verification

---

## Create Firebase Project

1. Open Firebase Console
2. Click:

```text
Create Project
```

3. Enable:

```text
Authentication → Sign-in Method → Google → Enable
```

---

## Create Web App

1. Go to:

```text
Project Settings → Your Apps
```

2. Add Web App

3. Copy Firebase Web Config

Example:

```javascript
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

---

## Add Firebase Web Config to backend/.env

```env
FIREBASE_WEB_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=xxxxxxxx
FIREBASE_APP_ID=xxxxxxxx
```

---

## Generate Firebase Admin SDK Key

Backend uses Firebase Admin SDK.

Go to:

```text
Firebase Console → Project Settings → Service Accounts
```

Click:

```text
Generate New Private Key
```

Download JSON file.

---

## Add Firebase Admin Values to backend/.env

Copy values from downloaded JSON:

```env
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=
FIREBASE_CLIENT_ID=
FIREBASE_CLIENT_CERT_URL=
```

IMPORTANT:

Private key must stay in one line with \n characters.

Correct:

```env
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nABC123\nXYZ456\n-----END PRIVATE KEY-----\n"
```

---

# STEP 3 — Google Drive Setup

Google Drive stores uploaded:

* Images
* Videos

---

## Create Drive Folder

1. Open Google Drive
2. Create folder:

```text
FixMyCityUploads
```

3. Open folder
4. Copy folder ID from URL

Example:

```text
https://drive.google.com/drive/folders/1ABCXYZ
```

Folder ID:

```text
1ABCXYZ
```

---

# STEP 4 — Google Apps Script Setup

Apps Script acts as upload middleware.

Backend sends:

* base64 file

Apps Script:

* uploads file to Google Drive
* makes file public
* returns fileId

---

## Create Apps Script Project

1. Open:

* [https://script.google.com](https://script.google.com)

2. Click:

```text
New Project
```

3. Rename project:

```text
FixMyCityDriveMiddleware
```

4. Replace entire Code.gs with:

```javascript
// ============================================
// FixMyCity — Google Apps Script (Middleware)
// ============================================

const FOLDER_ID = 'YOUR_FOLDER_ID_HERE';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    if (data.action === 'delete' && data.fileId) {
      try {
        DriveApp.getFileById(data.fileId).setTrashed(true);
      } catch (err) {}

      return jsonResponse({ success: true });
    }

    const { fileName, mimeType, base64Data } = data;

    if (!fileName || !mimeType || !base64Data) {
      return jsonResponse({
        success: false,
        error: 'Missing fields'
      });
    }

    const bytes = Utilities.base64Decode(base64Data);
    const blob = Utilities.newBlob(bytes, mimeType, fileName);

    const folder = DriveApp.getFolderById(FOLDER_ID);
    const file = folder.createFile(blob);

    file.setSharing(
      DriveApp.Access.ANYONE_WITH_LINK,
      DriveApp.Permission.VIEW
    );

    return jsonResponse({
      success: true,
      fileId: file.getId()
    });

  } catch (err) {
    return jsonResponse({
      success: false,
      error: err.message
    });
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
```

---

## Add Your Folder ID

Replace:

```javascript
const FOLDER_ID = 'YOUR_FOLDER_ID_HERE';
```

with:

```javascript
const FOLDER_ID = 'YOUR_REAL_FOLDER_ID';
```

---

## Deploy Apps Script

1. Click:

```text
Deploy → New Deployment
```

2. Select:

```text
Web App
```

3. Configure:

```text
Execute as: Me
Who has access: Anyone
```

4. Click:

```text
Deploy
```

5. Authorize permissions

6. Copy Web App URL

Example:

```text
https://script.google.com/macros/s/AKfycbxxxxxx/exec
```

---

## Add Apps Script URL to backend/.env

```env
DRIVE_UPLOAD_URL=https://script.google.com/macros/s/AKfycbxxxxxx/exec
```

---

# STEP 5 — Cloudinary Setup (Optional)

Project includes Cloudinary config.

If your project currently uses Google Drive uploads only, this section can be skipped.

---

## Create Cloudinary Account

* [https://cloudinary.com](https://cloudinary.com)

---

## Copy Credentials

Dashboard gives:

* Cloud Name
* API Key
* API Secret

---

## Add to backend/.env

```env
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

---

# STEP 6 — Configure Environment Variables

Create:

```bash
backend/.env
```

Full Example:

```env
PORT=5000
NODE_ENV=development

MONGODB_URI=your_mongodb_uri

JWT_SECRET=your_long_random_secret
JWT_EXPIRE=30d

DRIVE_UPLOAD_URL=your_google_apps_script_url

FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=
FIREBASE_CLIENT_ID=
FIREBASE_CLIENT_CERT_URL=

FIREBASE_WEB_API_KEY=
FIREBASE_AUTH_DOMAIN=
FIREBASE_STORAGE_BUCKET=
FIREBASE_MESSAGING_SENDER_ID=
FIREBASE_APP_ID=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

FRONTEND_URL=http://localhost:3000
```

---

# STEP 7 — Install Backend Dependencies

Open terminal:

```bash
cd backend
```

Install packages:

```bash
npm install
```

---

# STEP 8 — Open 3 Separate Terminals

You must run:

* backend
* citizen frontend
* municipal frontend

in 3 different terminals.

---

# Terminal 1 — Backend

Open terminal:

```bash
cd backend
```

Install packages:

```bash
npm install
```

Run backend:

```bash
npm run dev
```

Expected:

```text
MongoDB connected
Server running on port 5000
```

Backend URL:

```text
http://localhost:5000
```

---

# Terminal 2 — Citizen Frontend

Open another terminal:

```bash
cd citizen-frontend
```

Run:

```bash
python -m http.server 3000
```

Citizen frontend URL:

```text
http://localhost:3000
```

---

# Terminal 3 — Municipal Frontend

Open another terminal:

```bash
cd municipal-frontend
```

Run:

```bash
python -m http.server 3001
```

Municipal frontend URL:

```text
http://localhost:3001
```

---

# STEP 9 — Configure API Base URL

You can use VS Code Live Server.

---

## Citizen Frontend

Open:

```text
citizen-frontend/
```

Run Live Server.

Example:

```text
http://127.0.0.1:5500
```

---

## Municipal Frontend

Open:

```text
municipal-frontend/
```

Run Live Server.

---

# STEP 10 — Configure API Base URL

Find frontend API URL configuration.

Usually inside:

```text
frontend/js/app.js
```

Set:

```javascript
const API_BASE_URL = 'http://localhost:5000/api';
```

---

# STEP 11 — Test Entire Flow

## Test User Registration

* Register account
* Login
* Verify JWT creation

---

## Test Google Login

* Click Google Sign In
* Verify Firebase popup works

---

## Test Issue Upload

Upload:

* image
* video

Verify:

* file uploads to Google Drive
* issue saves in MongoDB
* image/video preview works

---

# Upload Architecture

```text
Frontend
   ↓
Backend (Express)
   ↓
Google Apps Script
   ↓
Google Drive
```

---

# Image URLs

Images:

```text
https://lh3.googleusercontent.com/d/FILE_ID
```

Videos:

```text
https://drive.google.com/file/d/FILE_ID/preview
```

---

# Common Errors

## 403 Forbidden on Images

Cause:

```text
Drive file is not public
```

Fix:

```javascript
file.setSharing(
  DriveApp.Access.ANYONE_WITH_LINK,
  DriveApp.Permission.VIEW
);
```

---

## MongoDB Connection Error

Cause:

* wrong URI
* IP not whitelisted

Fix:

```text
MongoDB Atlas → Network Access → Allow 0.0.0.0/0
```

---

## Firebase Admin Error

Cause:

```text
Private key formatting incorrect
```

Fix:

Use:

```env
\n
```

inside private key.

---

## CORS Error

Fix backend CORS config.

Allow:

```text
http://127.0.0.1:5500
```

and:

```text
http://localhost:5500
```

---

# Production Deployment

Recommended:

| Service  | Recommended Platform |
| -------- | -------------------- |
| Frontend | Netlify              |
| Backend  | Render / Railway     |
| Database | MongoDB Atlas        |
| Uploads  | Google Drive         |
| Auth     | Firebase             |

---

# Security Warning

NEVER commit:

* .env
* Firebase private keys
* MongoDB passwords
* Cloudinary secrets

Add to .gitignore:

```text
.env
node_modules
```

---

# IMPORTANT

If your current repository already contains real:

* Firebase keys
* MongoDB passwords
* Cloudinary secrets

REVOKE and regenerate them immediately before deploying publicly.

---

# Local Development Commands

## Backend

```bash
cd backend
npm install
npm run dev
```

---

## Frontend

Use VS Code Live Server.

---

# Final Local URLs

Citizen Frontend:

```text
http://127.0.0.1:5500
```

Municipal Frontend:

```text
http://127.0.0.1:5501
```

Backend API:

```text
http://localhost:5000
```

---

# System Flow Summary

```text
Citizen uploads issue
        ↓
Backend receives request
        ↓
Backend sends file to Apps Script
        ↓
Apps Script uploads to Drive
        ↓
Drive returns fileId
        ↓
Backend stores issue in MongoDB
        ↓
Frontend displays issue
```

---

# DONE

Your full FixMyCity stack should now work locally with:

* MongoDB Atlas
* Firebase Authentication
* Google Drive uploads
* Google Apps Script middleware
* Node.js backend
* Citizen frontend
* Municipal frontend
