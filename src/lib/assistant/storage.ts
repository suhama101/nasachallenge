import { chatMessageSchema, type ChatMessage, type DatasetKey } from "./types";
const DATABASE = "missionpulse-chat-demo-v1";
function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore("conversations");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(Error("Chat storage unavailable"));
    request.onblocked = () => reject(Error("Chat storage blocked"));
  });
}
async function transact<T>(
  mode: IDBTransactionMode,
  work: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("conversations", mode);
    const request = work(tx.objectStore("conversations"));
    tx.oncomplete = () => {
      db.close();
      resolve(request.result);
    };
    tx.onerror = tx.onabort = () => {
      db.close();
      reject(Error("Chat storage unavailable"));
    };
  });
}
export async function loadChat(dataset: DatasetKey): Promise<ChatMessage[]> {
  const value = await transact("readonly", (store) => store.get(dataset));
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 100)
    throw Error("Saved chat is inconsistent");
  const messages = value.map((item) => chatMessageSchema.parse(item));
  if (messages.some((message) => message.dataset !== dataset))
    throw Error("Saved chat scope mismatch");
  return messages;
}
export async function saveChat(dataset: DatasetKey, messages: ChatMessage[]) {
  const valid = messages
    .slice(-100)
    .map((message) => chatMessageSchema.parse(message));
  if (valid.some((message) => message.dataset !== dataset))
    throw Error("Chat scope mismatch");
  await transact("readwrite", (store) => store.put(valid, dataset));
}
export async function clearChat(dataset: DatasetKey) {
  await transact("readwrite", (store) => store.delete(dataset));
}
