import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Service role 키로 RLS를 우회하는 서버 전용 클라이언트.
 * 반드시 서버(Server Action, Route Handler)에서만 사용하고, 클라이언트 번들에 포함되면 안 됩니다.
 */
export function createAdminClient() {
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
