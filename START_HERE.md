# StockSync 2.01 — Final Full-Stack Setup

This package separates the React frontend from the Express API and uses Firebase Cloud Firestore for persistent inventory storage.

## 1. Open the project

Open the folder `stocksync 2.01` in VS Code.

## 2. Install dependencies

Open a terminal in the project root (the folder that contains `package.json`):

```powershell
npm install
```

If npm reports an `ECONNRESET` network error, retry on a stable connection or a phone hotspot and run `npm install` again.

## 3. Configure Firebase

Firebase is used as the real database. For local development, the Express server authenticates to Firestore with a service-account JSON file.

1. Create a Firebase project and create a Firestore database.
2. Create a service account and download its JSON private key.
3. Copy the JSON key into the project root as `firebase-service-account.json`.
4. Copy `.env.example` to `.env`.
5. Put your Firebase project ID into `FIREBASE_PROJECT_ID` (or leave it blank if the service-account file contains it).

Do NOT share the service-account JSON or `.env` publicly.

## 4. Start the backend

Terminal 1:

```powershell
npm run server
```

Expected output:

```text
Firebase Firestore connected: project=...
StockSync API running on http://localhost:3000
Database mode: firebase-firestore
```

If Firebase is not configured yet, the server starts in local-memory demo mode so the UI can still be tested. In that mode data is not persistent after the server stops.

## 5. Start the frontend

Terminal 2:

```powershell
npm run dev
```

Open:

```text
http://localhost:5173/
```

Do not use `http://localhost:3000/` for the development UI. Port 3000 is the API.

## 6. Verify the database

Open:

```text
http://localhost:3000/api/health
```

When Firebase is connected, the JSON contains:

```json
"database": "firebase-firestore"
```

Then open:

```text
http://localhost:3000/api/inventory
```

On the first Firebase-backed run, the 15 demo dishes are automatically copied to the Firestore `inventory` collection if it is empty.

## 7. What is stored where?

### Firebase Firestore

- Dish name
- Category
- SKU
- Total stock
- Platform A stock
- Platform B stock
- Platform C stock
- Status
- Image URL
- Add/update/delete operations

### Browser LocalStorage

Only UI state is kept locally:

- Master item enable/disable toggles
- Channel delist/re-list toggles

This keeps database data persistent while avoiding unnecessary database writes for UI preferences.

## 8. Development architecture

```text
React + Vite (5173)
      |
      | /api/*
      v
Vite proxy
      |
      v
Express API (3000)
      |
      v
Firebase Firestore
      |
      v
inventory collection
```

## 9. Production-style local run

Build the React app:

```powershell
npm run build
```

Then run:

```powershell
$env:NODE_ENV="production"
npm start
```

Open:

```text
http://localhost:3000
```

## 10. Common errors

### EADDRINUSE: port 3000 already in use

You have another StockSync backend process running. Stop the old terminal with `Ctrl+C`, or find the process with:

```powershell
netstat -ano | findstr :3000
```

### node/npm not recognized

Restart VS Code after installing Node.js. `node -v` and `npm -v` should work before running the project.

### Cannot find package.json

Run `npm install` from the project root, not inside another folder.

### Could not load inventory from backend

Make sure both terminals are running and that `http://localhost:3000/api/health` returns JSON. The frontend uses the Vite proxy to forward `/api/*` requests to port 3000.
