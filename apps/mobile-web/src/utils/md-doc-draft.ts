const DB_NAME = "owl-md-doc-drafts";
const STORE_NAME = "drafts";
const DB_VERSION = 1;

interface DraftRecord {
  docId: string;
  content: string;
  updatedAt: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "docId" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveDraft(docId: string, content: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put({ docId, content, updatedAt: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getDraft(docId: string): Promise<string | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(docId);
    req.onsuccess = () => resolve(req.result?.content ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteDraft(docId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(docId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAllDrafts(): Promise<DraftRecord[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result ?? []);
    req.onerror = () => reject(req.error);
  });
}

export async function syncDraftsToServer(apiClient: {
  put: (url: string, data: unknown) => Promise<unknown>;
}): Promise<{ synced: number; failed: number }> {
  const drafts = await getAllDrafts();
  let synced = 0;
  let failed = 0;

  for (const draft of drafts) {
    try {
      await apiClient.put(`/api/md-docs/${draft.docId}`, { content: draft.content });
      await deleteDraft(draft.docId);
      synced++;
    } catch {
      failed++;
    }
  }

  return { synced, failed };
}
