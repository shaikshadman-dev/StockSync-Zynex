# StockSync

### One Update. Every Channel. Zero Ghost Orders.

**StockSync** is a restaurant inventory synchronization platform designed to keep menu availability consistent across multiple ordering channels.

It provides a centralized operational dashboard where restaurant staff can monitor inventory, adjust portions, control item availability, view channel status, and maintain an audit trail of synchronization events.

> **Built by Team ZyNex for the NN-AI Solutions Hackathon**

---

## 📌 The Problem

Restaurants increasingly receive orders through multiple channels — delivery platforms, direct ordering systems, and other sales channels.

The operational problem is simple:

A dish can become unavailable in the kitchen while remaining available on one or more ordering channels.

For example:

```text
Kitchen Inventory
Chicken Biryani → 0 portions

        ↓

Restaurant staff knows it is unavailable

        ↓

Ordering Channel A → AVAILABLE
Ordering Channel B → AVAILABLE
Direct Channel     → AVAILABLE

        ↓

Customer places an order

        ↓

Ghost Order
```

The problem isn't the order itself.

**The problem is the information gap between the kitchen and the channels.**

StockSync introduces a centralized control layer to reduce this mismatch.

---

# 💡 The Solution

StockSync establishes a **central inventory state** that acts as the operational source of truth.

Instead of repeatedly updating each channel manually:

```text
                ┌──────────────────┐
                │ Kitchen / Staff  │
                └────────┬─────────┘
                         │
                         ▼
                ┌──────────────────┐
                │    StockSync     │
                │ Central Inventory │
                └────────┬─────────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
   ┌────────────┐ ┌────────────┐ ┌────────────┐
   │ Platform A │ │ Platform B │ │ Direct     │
   │  Swiggy    │ │  Zomato    │ │ Channel    │
   └────────────┘ └────────────┘ └────────────┘
```

The current hackathon build represents these external channels through simulated channel views.

---

# ✨ Core Features

## 1. Central Inventory Dashboard

Monitor restaurant inventory from a single interface.

The dashboard provides visibility into:

* Total inventory
* Item availability
* Low-stock items
* Out-of-stock items
* Channel synchronization status
* Operational activity

---

## 2. Kitchen Inventory Management

Staff can manage individual menu items and adjust their available portions.

Each item contains information such as:

* Dish name
* Category
* SKU
* Quantity
* Price
* Channel allocation
* Stock status
* Availability
* Image

---

## 3. Real-Time Firestore Synchronization

StockSync uses **Cloud Firestore** to maintain inventory state and provide real-time updates to the frontend.

The frontend subscribes to the `menuItems` collection using Firestore's real-time snapshot listener.

This allows inventory changes to propagate to connected views without requiring a traditional page refresh.

---

## 4. Automatic Stock Status

StockSync calculates inventory state from the available quantity.

### Current logic

| Quantity | Status         |
| -------: | -------------- |
|      `0` | `OUT_OF_STOCK` |
|    `1–5` | `LOW_STOCK`    |
|     `>5` | `AVAILABLE`    |

The application also uses operational thresholds for certain UI states and synchronization behavior.

---

## 5. Channel-Level Inventory

Inventory can be represented across three channel views:

* **Platform A — Swiggy**
* **Platform B — Zomato**
* **Platform C — Direct**

Each channel maintains its own portion count.

For example:

```text
Chicken Biryani

Total Stock: 30

Swiggy  → 12
Zomato  → 10
Direct  → 8
```

---

## 6. Ghost Order Protection

When channel inventory reaches a critical level, StockSync can identify channels requiring protection.

The current implementation supports automatic delisting behavior when a channel reaches zero available portions.

When inventory is replenished beyond the restoration threshold, the channel can be restored.

Conceptually:

```text
Stock decreases
      ↓
Critical quantity
      ↓
Alert / Protection
      ↓
0 portions
      ↓
Channel delisted
```

When stock is restored:

```text
Inventory replenished
      ↓
Quantity > restoration threshold
      ↓
Channel restored
```

---

# 🚨 Emergency "86" Workflow

StockSync includes an emergency workflow for taking an item out of stock everywhere.

### MARK OUT OF STOCK EVERYWHERE

A single operation updates:

```text
Menu Item
   ↓
Quantity = 0
   ↓
Platform A = 0
Platform B = 0
Platform C = 0
   ↓
OUT_OF_STOCK
   ↓
All simulated channels updated
   ↓
Audit log created
```

This is designed for situations where a restaurant needs to immediately prevent additional orders for an unavailable item.

---

# 🔄 Restore Availability

StockSync also provides a corresponding availability restoration workflow.

When an item is restored:

```text
MARK AVAILABLE EVERYWHERE
          ↓
Restore inventory
          ↓
Restore channel quantities
          ↓
Update platform statuses
          ↓
Record synchronization event
```

The current implementation restores a configurable portion quantity across the three simulated channels.

---

# 📋 Audit Log

Every major synchronization operation can generate an entry in the `syncLogs` collection.

The audit system records information including:

* Menu item
* Platform
* Action
* Initiator
* Previous status
* New status
* Synchronization status
* Event type
* Latency
* Timestamp

Example:

```text
Item:
Hyderabadi Chicken Dum Biryani

Action:
MARK OUT OF STOCK EVERYWHERE

Old Status:
AVAILABLE

New Status:
OUT_OF_STOCK

Sync Status:
SUCCESS
```

This provides traceability for operational changes and debugging.

---

# 🔐 Authentication

The backend includes authentication functionality based on:

* User registration
* User login
* Password hashing
* JWT authentication
* JWT session verification
* Manager/staff roles

The authentication implementation uses PBKDF2-based password hashing with salts and signed JWT tokens.

### Available authentication endpoints

```http
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

---

# 🏗️ Architecture

StockSync follows a lightweight full-stack architecture.

```text
┌───────────────────────────────────────────────┐
│                 React Frontend                │
│                                               │
│ Dashboard │ Inventory │ Customer │ Audit Log │
│           │           │          │            │
└──────────────────────┬────────────────────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ Firebase Client │
              │   Firestore     │
              └────────┬────────┘
                       │
                       ▼
             ┌───────────────────┐
             │ Cloud Firestore   │
             │                   │
             │ menuItems         │
             │ platformStatuses  │
             │ syncLogs          │
             │ users             │
             └───────────────────┘


┌───────────────────────────────────────────────┐
│              Express Backend                 │
│                                               │
│ Authentication │ Health │ Inventory API       │
└───────────────────────────────────────────────┘
```

---

# 🧰 Tech Stack

## Frontend

* React 19
* React Router
* Vite
* Bootstrap
* Tailwind CSS
* Lucide React
* Motion

## Backend

* Node.js
* Express.js
* JWT
* Node Crypto

## Database

* Firebase
* Cloud Firestore

## Development

* Vite
* TypeScript tooling
* npm/Bun lockfile support
* Git

---

# 📁 Project Structure

```text
SAAS/
│
├── backend/
│   ├── auth.js
│   └── server.js
│
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── AddDishModal/
│       │   ├── AuditLogView/
│       │   ├── AuthModal/
│       │   ├── AuthView/
│       │   ├── CustomerView/
│       │   ├── DashboardHero/
│       │   ├── Header/
│       │   ├── InventoryTable/
│       │   ├── RoiView/
│       │   └── RulesView/
│       │
│       ├── context/
│       │   └── AuthContext.jsx
│       │
│       ├── services/
│       │   └── inventoryService.js
│       │
│       ├── utils/
│       │   └── foodImages.js
│       │
│       ├── App.jsx
│       ├── App.css
│       ├── firebase.js
│       ├── index.css
│       └── main.jsx
│
├── firebase-applet-config.json
├── firebase-blueprint.json
├── firestore.rules
├── .env.example
├── index.html
├── package.json
└── bun.lock
```

---

# 🗄️ Firestore Data Model

StockSync currently works with several Firestore collections.

## `menuItems`

Stores restaurant menu and inventory state.

Representative fields:

```javascript
{
  name: "Chicken Biryani",
  category: "Biryani",
  sku: "BIR-CHK-001",
  quantity: 50,
  totalStock: 50,
  platformA: 20,
  platformB: 20,
  platformC: 10,
  stockStatus: "AVAILABLE",
  isAvailable: true,
  status: "synced"
}
```

---

## `platformStatuses`

Stores channel-specific availability state.

```javascript
{
  menuItemId,
  itemName,
  platformKey,
  platform,
  isAvailable,
  syncStatus,
  updatedAt
}
```

---

## `syncLogs`

Stores synchronization and operational events.

```javascript
{
  menuItemId,
  itemName,
  platform,
  action,
  initiator,
  oldStatus,
  newStatus,
  syncStatus,
  type,
  latency,
  timestamp
}
```

---

## `users`

Stores registered user profile information.

---

## `user`

A parallel user collection is also maintained by the current authentication implementation for compatibility with the existing application structure.

---

# 🔌 Backend API

The Express server exposes the following API endpoints.

## Health Check

```http
GET /api/health
```

Example response:

```json
{
  "status": "ok",
  "message": "StockSync Backend is running",
  "timestamp": "..."
}
```

---

## Get Inventory

```http
GET /api/inventory
```

Returns the current backend inventory dataset.

---

## Add Inventory Item

```http
POST /api/inventory
```

Example request:

```json
{
  "name": "Chicken Biryani",
  "category": "Biryani",
  "totalStock": 30,
  "platformA": 12,
  "platformB": 10,
  "platformC": 8
}
```

---

## Register User

```http
POST /api/auth/register
```

Example:

```json
{
  "name": "Kitchen Staff",
  "email": "staff@example.com",
  "password": "your-password",
  "role": "staff"
}
```

---

## Login

```http
POST /api/auth/login
```

Example:

```json
{
  "email": "staff@example.com",
  "password": "your-password"
}
```

---

## Verify Session

```http
GET /api/auth/me
Authorization: Bearer <JWT_TOKEN>
```

---

# ⚙️ Installation

## Prerequisites

Make sure you have installed:

* Node.js
* npm
* A Firebase project
* Git

---

## 1. Clone the Repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd SAAS
```

---

## 2. Install Dependencies

```bash
npm install
```

---

## 3. Configure Environment Variables

Create your environment configuration from the example:

```bash
cp .env.example .env
```

Configure the required values.

```env
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
APP_URL="YOUR_APP_URL"
```

> Configure Firebase according to the Firebase project associated with the application.

---

# ▶️ Running the Application

## Development

Start the Express + Vite development server:

```bash
npm run dev
```

The backend runs on:

```text
http://localhost:3000
```

The Express server integrates Vite middleware during development.

---

# 🏭 Production Build

Build the React application:

```bash
npm run build
```

Then start the production server:

```bash
npm start
```

The Express server serves the generated Vite `dist` directory in production mode.

---

# 🧪 Development Commands

| Command           | Purpose                       |
| ----------------- | ----------------------------- |
| `npm run dev`     | Start development server      |
| `npm run build`   | Build frontend                |
| `npm start`       | Start production server       |
| `npm run preview` | Preview Vite production build |
| `npm run clean`   | Remove build output           |
| `npm run lint`    | Run TypeScript checking       |

---

# 🔁 Core Inventory Flow

The primary StockSync workflow can be summarized as:

```text
1. Kitchen inventory changes
          ↓
2. Staff updates StockSync
          ↓
3. Firestore inventory state changes
          ↓
4. Stock status recalculated
          ↓
5. Channel states updated
          ↓
6. Customer-facing channel view reflects state
          ↓
7. Synchronization event recorded
```

The architecture is designed around the principle:

> **One change → One state → One controlled outcome.**

---

# 🧠 Stock Decision Logic

The current inventory service implements the following basic state calculation:

```javascript
if (quantity <= 0) {
  return "OUT_OF_STOCK";
}

if (quantity <= 5) {
  return "LOW_STOCK";
}

return "AVAILABLE";
```

This provides a deterministic mechanism for converting raw inventory quantities into operational states.

---

# 🛡️ Firestore Security

The repository includes Firestore security rules in:

```text
firestore.rules
```

The current hackathon configuration intentionally allows broad read/write access for several collections to simplify real-time demonstration and prototyping.

### Important

**These rules should not be considered production-ready.**

Before deploying StockSync to a real restaurant environment, access should be restricted based on:

* Firebase Authentication
* User identity
* Restaurant/tenant ID
* Staff role
* Manager permissions
* Collection-level authorization
* Ownership checks

---

# ⚠️ Current Prototype Limitations

StockSync is currently a **hackathon build / functional prototype**.

The simulated channel architecture means the application does **not yet represent direct production integrations with Swiggy, Zomato, or other external ordering APIs**.

Current limitations include:

* Simulated ordering channels
* Prototype authentication architecture
* Broad Firestore permissions
* No production-grade multi-tenant isolation
* No external partner API integration
* No complete reconciliation engine
* No production retry infrastructure
* Limited monitoring and observability
* Backend fallback inventory is in-memory
* Demo credentials exist in the current authentication implementation

These limitations are intentional boundaries of the current hackathon implementation.

---

# 🚀 Future Roadmap

The next stage of StockSync can evolve from a prototype into a production SaaS platform.

## Phase 1 — Real Integrations

Integrate real restaurant ordering platforms through official partner APIs.

```text
StockSync
   │
   ├── Swiggy API
   ├── Zomato API
   ├── Direct Ordering API
   └── POS / ERP
```

---

## Phase 2 — Reliable Synchronization

Introduce:

* Retry queues
* Reconciliation
* Idempotent operations
* Conflict resolution
* Webhooks
* Failure recovery
* Sync status monitoring

---

## Phase 3 — Production Security

Implement:

* Firebase Authentication
* Role-based access control
* Restaurant-level tenancy
* Secure secrets management
* API authentication
* Rate limiting
* Input validation
* Server-side authorization

---

## Phase 4 — Multi-Location SaaS

Support restaurant groups with multiple locations.

```text
Organization
│
├── Restaurant A
│   ├── Kitchen
│   └── Channels
│
├── Restaurant B
│   ├── Kitchen
│   └── Channels
│
└── Restaurant C
    ├── Kitchen
    └── Channels
```

---

# 📊 Target Users

StockSync is designed around operations where inventory must remain aligned across multiple sales channels.

Potential users include:

* Restaurants
* Cloud kitchens
* Multi-channel food businesses
* Multi-location restaurant chains
* Restaurant operations managers
* Kitchen managers

---

# 🎯 Product Philosophy

StockSync does not attempt to become another food-ordering platform.

Its purpose is to provide the **synchronization layer between operational inventory and customer-facing availability**.

The product principle is simple:

```text
Kitchen Reality
      ↓
Central Inventory State
      ↓
Channel Availability
      ↓
Customer Sees the Truth
```

---

# 🏆 Hackathon Context

StockSync was developed by **Team ZyNex** for the **NN-AI Solutions Hackathon**.

The product originated from a real operational scenario: a restaurant item becoming unavailable in the kitchen while remaining available on ordering channels.

The team focused on turning that operational friction into a simple software control layer.

> **We didn't start with an idea. We started with a problem.**

---

# 👥 Team

### Team ZyNex

**Smart Solutions for a Smarter Tomorrow.**

---

# 📄 License

No explicit open-source license is currently defined in the repository.

If this project is intended for public distribution, add an appropriate license file such as:

```text
LICENSE
```

before presenting the repository as an open-source project.

---

# ⭐ Final Note

StockSync's core idea can be summarized in one sentence:

> **Keep restaurant inventory synchronized across every sales channel from one operational control layer.**

**One Update. Every Channel. Zero Ghost Orders.**

---

Built with React, Express, Firebase, and a lot of debugging. 🚀

**Team ZyNex**
