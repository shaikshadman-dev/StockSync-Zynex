# StockSync 2.01 — Firebase Firestore Setup

## What changed
StockSync now uses **Firebase Cloud Firestore** for persistent inventory data through the Express backend. React/Vite remains the frontend.

Development architecture:

```text
Browser (React/Vite :5173)
        |
        | /api/*
        v
Vite proxy
        |
        v
Express API (:3000)
        |
        v
Firebase Cloud Firestore
        |
        v
inventory collection
```

The app also keeps small UI-only preferences (master toggles/channel delist toggles) in browser LocalStorage. Inventory records are persisted in Firestore.

## One-time Firebase setup

1. Create/open a Firebase project in the Firebase Console.
2. Open **Firestore Database** and create a database.
3. In Google Cloud/Firebase, create a service account and generate a private key JSON file. Keep this file private.
4. Put that JSON file in the StockSync project root and name it:
   `firebase-service-account.json`
5. Copy `.env.example` to `.env`.
6. Set `FIREBASE_PROJECT_ID` to the `project_id` value from the service-account JSON. You may leave it blank if the JSON already contains `project_id`.
7. Keep `FIREBASE_SERVICE_ACCOUNT_FILE="./firebase-service-account.json"`.
8. Make sure the Firestore API is enabled for the project.

The backend uses authenticated Google/Firestore REST calls from the server side. The service-account key is never sent to React.

## Run in development

Open two terminals in the project root:

### Terminal 1 — API

```powershell
npm run server
```

Expected:

```text
Firebase Firestore connected: project=YOUR_PROJECT_ID, collection=inventory
StockSync API running on http://localhost:3000
Database mode: firebase-firestore
```

### Terminal 2 — React/Vite

```powershell
npm run dev
```

Open:

```text
http://localhost:5173/
```

## Verify Firebase

Open:

```text
http://localhost:3000/api/health
```

The response should include:

```json
"database": "firebase-firestore"
```

Then open:

```text
http://localhost:3000/api/inventory
```

On the first Firebase-backed startup, StockSync automatically seeds the 15 demo dishes into the `inventory` collection if that collection is empty.

## Local fallback

If Firebase credentials are not configured, the project still starts in:

```text
local-memory-demo-mode
```

This is only a convenience for UI development. Changes made in fallback mode are lost when the server stops. Once Firebase is configured, inventory changes persist in Firestore.

## Important security rule

Never commit `firebase-service-account.json` or `.env` to Git. They are ignored by `.gitignore` in this project.
