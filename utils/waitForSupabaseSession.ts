import { Session } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

const SESSION_READ_TIMEOUT_MS = 800;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readSessionWithTimeout(): Promise<Session | null> {
  return Promise.race([
    supabase.auth.getSession().then(({ data }) => data.session ?? null),
    new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), SESSION_READ_TIMEOUT_MS)
    ),
  ]);
}

export async function waitForSupabaseSessionUser(
  expectedUserId: string,
  options?: { attempts?: number; delayMs?: number }
): Promise<boolean> {
  const attempts = options?.attempts ?? 3;
  const delayMs = options?.delayMs ?? 200;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const session = await readSessionWithTimeout().catch(() => null);
    if (session?.user?.id === expectedUserId) {
      return true;
    }
    if (attempt < attempts - 1) {
      await delay(delayMs);
    }
  }

  return false;
}
