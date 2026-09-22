import { getOwnProfile } from "@/backend/features/01_authentification/services/get-own-profile";
import { createClient } from "@/lib/supabase/server/server";
import { NextResponse } from "next/server";

/**
 * GET /api/me — profil du user connecté uniquement.
 */
export async function getMeController() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await getOwnProfile();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  if (profile.id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
    },
    profile,
  });
}
