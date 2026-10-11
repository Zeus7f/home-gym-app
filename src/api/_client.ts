/**
 * src/api/_client.ts
 * Central adapter that decides whether to read from mockStore or Supabase.
 * Changing the backend in the future = changing only this file.
 */

import { gymStore } from '../lib/supabase/mockStore';

/** True when Supabase credentials are configured and the store reports a live connection. */
export const isLiveBackend = (): boolean => gymStore.isSupabaseConnected;

/** Expose the store directly for lower-level reads (used within this api/ folder only). */
export { gymStore };
