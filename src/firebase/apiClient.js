import { getIdToken } from "./authService";

const N8N_URL = import.meta.env.VITE_N8N_WEBHOOK_URL;

export async function callN8n(payload) {
    const token = await getIdToken();
    if (!token) throw new Error("Not logged in");
    
    const response = await fetch(N8N_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });
    
    if (!response.ok) throw new Error(`n8n error: ${response.status}`);
    return response.json();
}