"use client";
import { createBrowserClient } from "@supabase/ssr";
import { readAuthConfig } from "./config";
export function browserAuthClient() {
  const config = readAuthConfig();
  return config ? createBrowserClient(config.url, config.key) : null;
}
