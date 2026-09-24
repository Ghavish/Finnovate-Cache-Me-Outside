// --- src/firebase/apiClient.js ---
import { getIdToken } from "./authService";

// Main workflow: saves data and runs the AI extractors.
const PROCESS_URL = import.meta.env.VITE_N8N_WEBHOOK_URL;
// Read API workflow: dashboard, goals and transactions. Defaults to the same n8n host.
const READ_URL =
  import.meta.env.VITE_N8N_READ_URL || PROCESS_URL?.replace(/\/process$/, "/read");

export async function callN8n(payload, url = PROCESS_URL) {
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

// Read-only requests (getDashboard, listGoals, ...). Returns the "data" part.
export async function readN8n(payload) {
  const body = await callN8n(payload, READ_URL);
  return body.data;
}
