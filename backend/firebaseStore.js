import fs from 'node:fs';
import path from 'node:path';
import { JWT } from 'google-auth-library';

const DEFAULT_COLLECTION = process.env.FIREBASE_COLLECTION || 'inventory';

function parseServiceAccount() {
  const file = process.env.FIREBASE_SERVICE_ACCOUNT_FILE;
  const inline = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (inline) {
    return JSON.parse(inline);
  }

  if (file) {
    const absolute = path.isAbsolute(file) ? file : path.resolve(process.cwd(), file);
    if (!fs.existsSync(absolute)) {
      throw new Error(`Firebase service account file not found: ${absolute}`);
    }
    return JSON.parse(fs.readFileSync(absolute, 'utf8'));
  }

  return null;
}

function toFirestoreValue(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }
  return { stringValue: String(value) };
}

function fromFirestoreValue(value) {
  if (!value) return null;
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return Number(value.doubleValue);
  if ('booleanValue' in value) return value.booleanValue;
  if ('nullValue' in value) return null;
  if ('timestampValue' in value) return value.timestampValue;
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(fromFirestoreValue);
  if ('mapValue' in value) return fromFirestoreFields(value.mapValue.fields || {});
  return null;
}

function fromFirestoreFields(fields = {}) {
  const result = {};
  for (const [key, value] of Object.entries(fields)) {
    result[key] = fromFirestoreValue(value);
  }
  return result;
}

function toFirestoreFields(object) {
  const fields = {};
  for (const [key, value] of Object.entries(object)) {
    fields[key] = toFirestoreValue(value);
  }
  return fields;
}

export class FirebaseInventoryStore {
  constructor() {
    this.collection = DEFAULT_COLLECTION;
    this.account = parseServiceAccount();
    this.projectId = process.env.FIREBASE_PROJECT_ID || this.account?.project_id || '';
    this.dbId = process.env.FIREBASE_DATABASE_ID || '(default)';
    this.enabled = Boolean(this.account && this.projectId);
    this.authClient = null;

    if (this.enabled) {
      if (!this.account.client_email || !this.account.private_key) {
        throw new Error('Firebase service account must contain client_email and private_key.');
      }
      this.authClient = new JWT({
        email: this.account.client_email,
        key: this.account.private_key,
        scopes: ['https://www.googleapis.com/auth/datastore']
      });
    }
  }

  mode() {
    return this.enabled ? 'firebase-firestore' : 'local-memory-fallback';
  }

  baseUrl() {
    if (!this.projectId) throw new Error('FIREBASE_PROJECT_ID is not configured.');
    return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(this.projectId)}/databases/${encodeURIComponent(this.dbId)}/documents`;
  }

  async request(url, options = {}) {
    if (!this.enabled) throw new Error('Firebase Firestore is not configured.');
    const headers = { ...(options.headers || {}), 'Content-Type': 'application/json' };
    const token = await this.authClient.getAccessToken();
    headers.Authorization = `Bearer ${token.token}`;
    const response = await fetch(url, { ...options, headers });
    const text = await response.text();
    let payload = null;
    try { payload = text ? JSON.parse(text) : null; } catch { payload = { raw: text }; }
    if (!response.ok) {
      const detail = payload?.error?.message || payload?.raw || `${response.status} ${response.statusText}`;
      throw new Error(`Firestore request failed (${response.status}): ${detail}`);
    }
    return payload;
  }

  documentUrl(id) {
    return `${this.baseUrl()}/${encodeURIComponent(this.collection)}/${encodeURIComponent(id)}`;
  }

  async list() {
    if (!this.enabled) return [];
    const response = await this.request(`${this.baseUrl()}/${encodeURIComponent(this.collection)}?pageSize=1000`);
    return (response?.documents || []).map((doc) => {
      const fields = fromFirestoreFields(doc.fields || {});
      return this.withId(fields, doc.name);
    });
  }

  withId(fields, resourceName) {
    if (fields.id !== undefined && fields.id !== null) return fields;
    const id = resourceName?.split('/').pop();
    return { id: Number(id?.replace(/^dish-/, '')) || id, ...fields };
  }

  async get(id) {
    if (!this.enabled) return null;
    try {
      const response = await this.request(this.documentUrl(id));
      return this.withId(fromFirestoreFields(response.fields || {}), response.name);
    } catch (error) {
      if (String(error.message).includes('(404)')) return null;
      throw error;
    }
  }

  async upsert(dish) {
    if (!this.enabled) return dish;
    const docId = `dish-${dish.id}`;
    const response = await this.request(`${this.baseUrl()}/${encodeURIComponent(this.collection)}/${encodeURIComponent(docId)}`, {
      method: 'PATCH',
      body: JSON.stringify({ fields: toFirestoreFields(dish) })
    });
    return this.withId(fromFirestoreFields(response.fields || {}), response.name);
  }

  async remove(id) {
    if (!this.enabled) return;
    await this.request(this.documentUrl(`dish-${id}`), { method: 'DELETE' });
  }

  async seed(seedDishes) {
    if (!this.enabled) return;
    const current = await this.list();
    if (current.length > 0) return { seeded: false, count: current.length };
    await Promise.all(seedDishes.map((dish) => this.upsert(dish)));
    return { seeded: true, count: seedDishes.length };
  }
}
