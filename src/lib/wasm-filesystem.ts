/**
 * WASM Filesystem for browser
 *
 * Provides an in-memory filesystem with IndexedDB backing for the Otium OS WASM build.
 * All filesystem callbacks are synchronous (required by WASM), with IndexedDB writes
 * happening asynchronously in the background.
 */

// =============================================================================
// Types
// =============================================================================

interface FileEntry {
  type: 'file';
  data: Uint8Array;
}

interface DirEntry {
  type: 'dir';
  children: Set<string>;
}

type FsEntry = FileEntry | DirEntry;

export interface WasmFilesystem {
  // Sync operations for WASM callbacks
  fsExists(path: string): 'file' | 'dir' | null;
  fsFileSize(path: string): number;
  fsReadFile(path: string): Uint8Array | null;
  fsWriteFile(path: string, data: Uint8Array): boolean;
  fsCreateFile(path: string): boolean;
  fsCreateDir(path: string): boolean;
  fsDeleteFile(path: string): boolean;
  fsDeleteDir(path: string): boolean;

  // Async setup
  init(): Promise<void>;
}

// =============================================================================
// Path Utilities
// =============================================================================

function normalizePath(p: string): string {
  if (!p || p === '') return '/';
  if (!p.startsWith('/')) p = '/' + p;
  while (p.length > 1 && p.endsWith('/')) {
    p = p.slice(0, -1);
  }
  return p;
}

function getParentPath(p: string): string {
  const normalized = normalizePath(p);
  if (normalized === '/') return '/';
  const lastSlash = normalized.lastIndexOf('/');
  if (lastSlash === 0) return '/';
  return normalized.slice(0, lastSlash);
}

function getBasename(p: string): string {
  const normalized = normalizePath(p);
  if (normalized === '/') return '';
  const lastSlash = normalized.lastIndexOf('/');
  return normalized.slice(lastSlash + 1);
}

// =============================================================================
// IndexedDB Helpers
// =============================================================================

interface IndexedDBEntry {
  path: string;
  type: 'file' | 'dir';
  data: Uint8Array | null;
}

async function openDatabase(name: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('files')) {
        db.createObjectStore('files', { keyPath: 'path' });
      }
    };
  });
}

function saveEntryToDb(db: IDBDatabase, path: string, entry: FsEntry): void {
  // Fire and forget - we don't wait for this to complete
  const transaction = db.transaction(['files'], 'readwrite');
  const store = transaction.objectStore('files');

  const dbEntry: IndexedDBEntry = {
    path,
    type: entry.type,
    data: entry.type === 'file' ? entry.data : null,
  };

  store.put(dbEntry);
}

function deleteEntryFromDb(db: IDBDatabase, path: string): void {
  // Fire and forget
  const transaction = db.transaction(['files'], 'readwrite');
  const store = transaction.objectStore('files');
  store.delete(path);
}

// =============================================================================
// Filesystem Implementation
// =============================================================================

export function createWasmFilesystem(): WasmFilesystem {
  // In-memory storage
  const storage = new Map<string, FsEntry>();

  // IndexedDB connection (set during init)
  let db: IDBDatabase | null = null;

  // Ensure all parent directories exist
  function ensureParentDirs(p: string): void {
    const normalized = normalizePath(p);
    const parts = normalized.split('/').filter((x) => x);
    let current = '';

    for (let i = 0; i < parts.length - 1; i++) {
      current += '/' + parts[i];
      if (!storage.has(current)) {
        const dirEntry: DirEntry = { type: 'dir', children: new Set() };
        storage.set(current, dirEntry);

        const parent = getParentPath(current);
        const parentEntry = storage.get(parent);
        if (parentEntry && parentEntry.type === 'dir') {
          parentEntry.children.add(parts[i]);
        }

        if (db) saveEntryToDb(db, current, dirEntry);
      }
    }
  }

  return {
    async init(): Promise<void> {
      // Generate unique session ID
      const sessionId = Date.now().toString(36) + Math.random().toString(36).slice(2);
      const dbName = `otium-fs-${sessionId}`;

      db = await openDatabase(dbName);

      // Initialize root directory
      const rootEntry: DirEntry = { type: 'dir', children: new Set() };
      storage.set('/', rootEntry);
      saveEntryToDb(db, '/', rootEntry);
    },

    fsExists(path: string): 'file' | 'dir' | null {
      const normalized = normalizePath(path);
      const entry = storage.get(normalized);
      if (!entry) return null;
      return entry.type;
    },

    fsFileSize(path: string): number {
      const normalized = normalizePath(path);
      const entry = storage.get(normalized);
      if (!entry || entry.type !== 'file') return -1;
      return entry.data.length;
    },

    fsReadFile(path: string): Uint8Array | null {
      const normalized = normalizePath(path);
      const entry = storage.get(normalized);
      if (!entry || entry.type !== 'file') return null;
      return entry.data;
    },

    fsWriteFile(path: string, data: Uint8Array): boolean {
      const normalized = normalizePath(path);
      const existing = storage.get(normalized);

      // Can't write to a directory
      if (existing && existing.type === 'dir') {
        return false;
      }

      // Create parent directories if needed
      if (!existing) {
        ensureParentDirs(normalized);
      }

      const fileEntry: FileEntry = { type: 'file', data };
      storage.set(normalized, fileEntry);

      // Update parent's children set
      const parent = getParentPath(normalized);
      const parentEntry = storage.get(parent);
      if (parentEntry && parentEntry.type === 'dir') {
        parentEntry.children.add(getBasename(normalized));
      }

      if (db) saveEntryToDb(db, normalized, fileEntry);
      return true;
    },

    fsCreateFile(path: string): boolean {
      const normalized = normalizePath(path);

      // Already exists
      if (storage.has(normalized)) {
        return false;
      }

      ensureParentDirs(normalized);
      const fileEntry: FileEntry = { type: 'file', data: new Uint8Array(0) };
      storage.set(normalized, fileEntry);

      const parent = getParentPath(normalized);
      const parentEntry = storage.get(parent);
      if (parentEntry && parentEntry.type === 'dir') {
        parentEntry.children.add(getBasename(normalized));
      }

      if (db) saveEntryToDb(db, normalized, fileEntry);
      return true;
    },

    fsCreateDir(path: string): boolean {
      const normalized = normalizePath(path);

      // Already exists
      if (storage.has(normalized)) {
        return false;
      }

      ensureParentDirs(normalized);
      const dirEntry: DirEntry = { type: 'dir', children: new Set() };
      storage.set(normalized, dirEntry);

      const parent = getParentPath(normalized);
      const parentEntry = storage.get(parent);
      if (parentEntry && parentEntry.type === 'dir') {
        parentEntry.children.add(getBasename(normalized));
      }

      if (db) saveEntryToDb(db, normalized, dirEntry);
      return true;
    },

    fsDeleteFile(path: string): boolean {
      const normalized = normalizePath(path);
      const entry = storage.get(normalized);

      if (!entry || entry.type !== 'file') {
        return false;
      }

      // Remove from parent's children
      const parent = getParentPath(normalized);
      const parentEntry = storage.get(parent);
      if (parentEntry && parentEntry.type === 'dir') {
        parentEntry.children.delete(getBasename(normalized));
      }

      storage.delete(normalized);
      if (db) deleteEntryFromDb(db, normalized);
      return true;
    },

    fsDeleteDir(path: string): boolean {
      const normalized = normalizePath(path);
      const entry = storage.get(normalized);

      if (!entry || entry.type !== 'dir') {
        return false;
      }

      // Can't delete non-empty directory
      if (entry.children.size > 0) {
        return false;
      }

      // Remove from parent's children
      const parent = getParentPath(normalized);
      const parentEntry = storage.get(parent);
      if (parentEntry && parentEntry.type === 'dir') {
        parentEntry.children.delete(getBasename(normalized));
      }

      storage.delete(normalized);
      if (db) deleteEntryFromDb(db, normalized);
      return true;
    },
  };
}
