import { SplashScreen } from "@/frontend/features/00_splash/splash-screen";
import { createClient } from "@/lib/supabase/server/server";

export default async function SplashPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <SplashScreen isAuthenticated={user !== null} />;
}
