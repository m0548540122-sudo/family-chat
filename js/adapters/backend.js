// Picks the backend. The practice backend can only ever load on this computer.
import { config } from '../../config/app.js';

const local = ['localhost', '127.0.0.1'].includes(location.hostname);

export const isConfigured = Boolean(config.supabaseUrl && config.supabaseAnonKey);
export const isPractice = local && new URLSearchParams(location.search).has('practice');

export async function loadBackend() {
  if (isPractice) return (await import('./practice.js')).createPracticeBackend();
  if (!isConfigured) return null;
  return (await import('./supabase.js')).createSupabaseBackend();
}
