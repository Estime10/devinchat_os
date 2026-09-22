"use server";

import { ROUTES } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server/server";
import { redirect } from "next/navigation";

export async function logoutUser() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(ROUTES.authWithMode("login"));
}
