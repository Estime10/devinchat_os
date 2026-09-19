import { ROUTES } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type AuthUser = {
  id: string;
  email: string | undefined;
};

/**
 * Exige une session. Sinon redirect vers la page auth.
 */
export async function requireUser(): Promise<AuthUser> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.auth);
  }

  return {
    id: user.id,
    email: user.email,
  };
}
