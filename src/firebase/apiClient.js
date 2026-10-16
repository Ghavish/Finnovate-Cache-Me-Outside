// --- src/firebase/apiClient.js ---
import { auth } from "./config";
import { getIdToken } from "./authService";

// Main workflow: saves data and runs the AI extractors.
const PROCESS_URL = import.meta.env.VITE_N8N_WEBHOOK_URL;
// Read API workflow: dashboard, goals and transactions. Defaults to the same n8n host.
const READ_URL =
  import.meta.env.VITE_N8N_READ_URL || PROCESS_URL?.replace(/\/process$/, "/read");

// --- Read cache ---
// Screens show the last answer straight away and refresh it in the background.
// Any save through callN8n clears it, so nobody sees old numbers after a change.
const readCache = new Map(); // key -> data
const pendingReads = new Map(); // key -> promise, so two screens asking at once share one request

const cacheKey = (payload) => `${auth.currentUser?.uid || ""}:${JSON.stringify(payload)}`;

export function clearReadCache() {
  readCache.clear();
  pendingReads.clear();
}

// Last known answer for this read, or undefined. Use it as a screen's starting state.
export function peekRead(payload) {
  return readCache.get(cacheKey(payload));
}

async function post(payload, url) {
  const token = await getIdToken();
  if (!token) throw new Error("Not logged in");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => null);
  if (!response.ok || body?.success === false) {
    throw new Error(body?.error || body?.message || `n8n error: ${response.status}`);
  }
  return body;
}

// Main workflow calls (AI previews and every save).
export async function callN8n(payload, url = PROCESS_URL) {
  const body = await post(payload, url);
  if (url === PROCESS_URL) clearReadCache();
  return body;
}

// Read-only requests (getDashboard, listGoals, ...). Returns the "data" part.
export function readN8n(payload) {
  const key = cacheKey(payload);
  if (pendingReads.has(key)) return pendingReads.get(key);

  const request = post(payload, READ_URL)
    .then((body) => {
      readCache.set(key, body.data);
      return body.data;
    })
    .finally(() => pendingReads.delete(key));
  pendingReads.set(key, request);
  return request;
}

// AI Coach workflow. Defaults to the same n8n host.
// COMMENT OUT IF AI COACH FAILS
const COACH_URL =
  import.meta.env.VITE_N8N_COACH_URL || PROCESS_URL?.replace(/\/process$/, "/coach");

// Asks the AI Coach a question. Returns { answer, verdict, intent, facts }.
export async function askCoach(question) {
  return post({ question }, COACH_URL);
}
