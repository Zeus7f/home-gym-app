/**
 * src/api/_client.ts
 * Central adapter that decides whether to read from mockStore or Supabase.
 * Changing the backend in the future = changing only this file.
 */

import { gymStore } from '../lib/supabase/mockStore';
import { isCloudActive } from '../lib/data/cloudSync';

/** True when the active gym is loaded from and saved to Supabase (B-03). */
export const isLiveBackend = (): boolean => isCloudActive();

/** Expose the store directly for lower-level reads (used within this api/ folder only). */
export { gymStore };
