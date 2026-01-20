import { supabase } from "./client";
import type { PostgrestError } from "@supabase/supabase-js";
import type { Database } from "./types";

type RpcResult<TData = unknown> = Promise<{ data: TData; error: PostgrestError | null }>;

type RpcCall = <TData = unknown>(
  fn: string,
  args?: Record<string, unknown>
) => RpcResult<TData>;

const rpcCall = supabase.rpc as unknown as RpcCall;

// NOTE:
// Some TS language-service configurations incorrectly infer Supabase RPC args as `never`
// even when the generated `Database` types contain the correct function signatures.
// These small wrappers keep call sites type-safe-ish and avoid editor red squiggles.

export function setMyPassword(p_password: string): RpcResult<void> {
  return rpcCall<void>("set_my_password", { p_password });
}

export function setUserPassword(p_auth_user_id: string, p_password: string): RpcResult<void> {
  return rpcCall<void>("set_user_password", { p_auth_user_id, p_password });
}

export function adminResetUserPassword(
  p_auth_user_id: string,
  p_password: string
): RpcResult<void> {
  return rpcCall<void>("admin_reset_user_password", { p_auth_user_id, p_password });
}

export function isAdmin(): RpcResult<Database["public"]["Functions"]["is_admin"]["Returns"]> {
  return rpcCall<Database["public"]["Functions"]["is_admin"]["Returns"]>("is_admin");
}
