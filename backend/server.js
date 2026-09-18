import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { FirebaseInventoryStore } from './firebaseStore.js';
import 'dotenv/config';

const app = express();
const PORT = Number(process.env.PORT || 3000);

// Middleware to understand JSON sent in requests
app.use(express.json());

// 15 Food dishes with live portion counts and food item images
const foodInventory = [
  // Biryanis
  {
    id: 1,
    name: 'Hyderabadi Chicken Dum Biryani',
    category: 'Biryani',
    sku: 'BIR-CHK-001',
    totalStock: 50,
    platformA: 20, // Swiggy
    platformB: 20, // Zomato
    platformC: 10, // Direct
    status: 'synced',
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 2,
    name: 'Special Mutton Dum Biryani',
    category: 'Biryani',
    sku: 'BIR-MUT-002',
    totalStock: 35,
    platformA: 15,
    platformB: 12,
    platformC: 8,
    status: 'synced',
    image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 3,
    name: 'Chicken 65 Biryani',
    category: 'Biryani',
    sku: 'BIR-65-003',
    totalStock: 25,
    platformA: 10,
    platformB: 10,
    platformC: 5,
    status: 'synced',
    image: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 4,
    name: 'Egg Dum Biryani',
    category: 'Biryani',
    sku: 'BIR-EGG-004',
    totalStock: 5,
    platformA: 2, // Low stock: trigger safety delist
    platformB: 2, // Low stock: trigger safety delist
    platformC: 1, // Critical stock: trigger safety delist
    status: 'low',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=80'
  },

  // Starters
  {
    id: 5,
    name: 'Chicken 65 (Crispy & Spicy)',
    category: 'Starter',
    sku: 'STR-C65-005',
    totalStock: 40,
    platformA: 18,
    platformB: 14,
    platformC: 8,
    status: 'synced',
    image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 6,
    name: 'Chilli Chicken Dry',
    category: 'Starter',
    sku: 'STR-CCD-006',
    totalStock: 30,
    platformA: 12,
    platformB: 12,
    platformC: 6,
    status: 'synced',
    image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 7,
    name: 'Chicken Majestic',
    category: 'Starter',
    sku: 'STR-MAJ-007',
    totalStock: 22,
    platformA: 10,
    platformB: 8,
    platformC: 4,
    status: 'synced',
    image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 8,
    name: 'Tandoori Chicken (Full)',
    category: 'Starter',
    sku: 'STR-TAN-008',
    totalStock: 5,
    platformA: 2, // triggers ghost protection
    platformB: 2, // triggers ghost protection
    platformC: 1, // triggers ghost protection
    status: 'low',
    image: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 9,
    name: 'Mutton Seekh Kebab',
    category: 'Starter',
    sku: 'STR-MSK-009',
    totalStock: 18,
    platformA: 8,
    platformB: 6,
    platformC: 4,
    status: 'synced',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 10,
    name: 'Mutton Boti Kebab',
    category: 'Starter',
    sku: 'STR-MBK-010',
    totalStock: 4,
    platformA: 2, // triggers ghost protection
    platformB: 1, // triggers ghost protection
    platformC: 1, // triggers ghost protection
    status: 'low',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=80'
  },

  // Chicken Curries
  {
    id: 11,
    name: 'Butter Chicken Masala',
    category: 'Chicken Curry',
    sku: 'CUR-BCM-011',
    totalStock: 28,
    platformA: 12,
    platformB: 10,
    platformC: 6,
    status: 'synced',
    image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 12,
    name: 'Andhra Chicken Curry',
    category: 'Chicken Curry',
    sku: 'CUR-ACC-012',
    totalStock: 32,
    platformA: 14,
    platformB: 12,
    platformC: 6,
    status: 'synced',
    image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 13,
    name: 'Kadai Chicken Gravy',
    category: 'Chicken Curry',
    sku: 'CUR-KCG-013',
    totalStock: 20,
    platformA: 8,
    platformB: 8,
    platformC: 4,
    status: 'synced',
    image: 'https://images.unsplash.com/photo-1546833998-877b37c2e5c6?w=500&auto=format&fit=crop&q=80'
  },

  // Mutton Curries
  {
    id: 14,
    name: 'Mutton Rogan Josh',
    category: 'Mutton Curry',
    sku: 'CUR-MRJ-014',
    totalStock: 15,
    platformA: 6,
    platformB: 6,
    platformC: 3,
    status: 'synced',
    image: 'https://images.unsplash.com/photo-1545247181-516773cae7be?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 15,
    name: 'Hyderabadi Mutton Korma',
    category: 'Mutton Curry',
    sku: 'CUR-HMK-015',
    totalStock: 3,
    platformA: 1, // triggers ghost protection
    platformB: 1, // triggers ghost protection
    platformC: 1, // triggers ghost protection
    status: 'low',
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=80'
  }
];

const store = new FirebaseInventoryStore();
let localInventory = [...foodInventory];

function getInventory() {
  return store.enabled ? store.list() : Promise.resolve(localInventory);
}

function normalizeDish(input, existing = {}) {
  const platformA = Math.max(0, Number(input.platformA ?? existing.platformA ?? 0) || 0);
  const platformB = Math.max(0, Number(input.platformB ?? existing.platformB ?? 0) || 0);
  const platformC = Math.max(0, Number(input.platformC ?? existing.platformC ?? 0) || 0);
  const totalStock = platformA + platformB + platformC;
  return {
    id: input.id ?? existing.id ?? Date.now(),
    name: String(input.name ?? existing.name ?? '').trim(),
    category: String(input.category ?? existing.category ?? 'Biryani'),
    sku: String(input.sku ?? existing.sku ?? `DSH-${Math.floor(100 + Math.random() * 900)}`),
    totalStock,
    platformA,
    platformB,
    platformC,
    status: totalStock === 0 ? 'out_of_stock' : totalStock <= 10 ? 'low' : 'synced',
    image: String(input.image ?? existing.image ?? '')
  };
}

function upsertLocal(dish) {
  const index = localInventory.findIndex((item) => String(item.id) === String(dish.id));
  if (index >= 0) localInventory[index] = dish;
  else localInventory.unshift(dish);
  return dish;
}

// Health check
app.get('/api/health', async (req, res) => {
  let firebaseStatus = store.mode();
  try {
    if (store.enabled) await store.list();
  } catch (error) {
    firebaseStatus = `firebase-error: ${error.message}`;
  }
  res.json({
    status: firebaseStatus.startsWith('firebase-error') ? 'degraded' : 'ok',
    message: 'StockSync Backend is running',
    database: firebaseStatus,
    timestamp: new Date().toISOString()
  });
});

// List inventory
app.get('/api/inventory', async (req, res) => {
  try {
    const dishes = await getInventory();
    res.json({
      success: true,
      database: store.mode(),
      totalCount: dishes.length,
      dishes,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[GET /api/inventory]', error);
    res.status(500).json({ success: false, error: 'Unable to load inventory.', details: error.message });
  }
});

// Add dish
app.post('/api/inventory', async (req, res) => {
  try {
    if (!req.body?.name?.trim()) {
      return res.status(400).json({ success: false, error: 'Dish name is required' });
    }
    const requestedId = Number(req.body.id);
    const createdDish = normalizeDish({ ...req.body, id: Number.isFinite(requestedId) && requestedId > 0 ? requestedId : Date.now() });
    const dishes = await getInventory();
    if (dishes.some((dish) => dish.sku?.toLowerCase() === createdDish.sku.toLowerCase())) {
      return res.status(409).json({ success: false, error: `SKU ${createdDish.sku} already exists.` });
    }
    const saved = store.enabled ? await store.upsert(createdDish) : upsertLocal(createdDish);
    res.status(201).json({ success: true, message: 'Dish added successfully', database: store.mode(), dish: saved });
  } catch (error) {
    console.error('[POST /api/inventory]', error);
    res.status(500).json({ success: false, error: 'Unable to add dish.', details: error.message });
  }
});

// Update any inventory fields (used for portion adjustments)
app.put('/api/inventory/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const dishes = await getInventory();
    const existing = dishes.find((dish) => String(dish.id) === String(id));
    if (!existing) return res.status(404).json({ success: false, error: 'Dish not found' });
    const updatedDish = normalizeDish({ ...existing, ...req.body, id: existing.id }, existing);
    const saved = store.enabled ? await store.upsert(updatedDish) : upsertLocal(updatedDish);
    res.json({ success: true, message: 'Dish updated successfully', database: store.mode(), dish: saved });
  } catch (error) {
    console.error(`[PUT /api/inventory/${req.params.id}]`, error);
    res.status(500).json({ success: false, error: 'Unable to update dish.', details: error.message });
  }
});

// Delete a dish
app.delete('/api/inventory/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const dishes = await getInventory();
    const existing = dishes.find((dish) => String(dish.id) === String(id));
    if (!existing) return res.status(404).json({ success: false, error: 'Dish not found' });
    if (store.enabled) await store.remove(existing.id);
    localInventory = localInventory.filter((dish) => String(dish.id) !== String(existing.id));
    res.json({ success: true, message: 'Dish deleted successfully', database: store.mode() });
  } catch (error) {
    console.error(`[DELETE /api/inventory/${req.params.id}]`, error);
    res.status(500).json({ success: false, error: 'Unable to delete dish.', details: error.message });
  }
});

// Production-only static hosting. Vite is a separate dev server during development.
const distPath = path.resolve(process.cwd(), 'dist');
if (process.env.NODE_ENV === 'production' && fs.existsSync(path.join(distPath, 'index.html'))) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// JSON 404 for API/unknown routes.
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

async function startServer() {
  try {
    if (store.enabled) {
      await store.seed(foodInventory);
      console.log(`Firebase Firestore connected: project=${store.projectId}, collection=${store.collection}`);
    } else {
      console.log('Firebase not configured. Running in local-memory demo mode. Add Firebase credentials to enable persistence.');
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`StockSync API running on http://localhost:${PORT}`);
      console.log(`Database mode: ${store.mode()}`);
    });
  } catch (error) {
    console.error('StockSync startup failed:', error);
    process.exit(1);
  }
}

startServer();
