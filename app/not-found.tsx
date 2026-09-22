import { NotFoundView } from "@/frontend/components/states/not-found/not-found-view";

/**
 * 404 globale — URLs inconnues + `notFound()` (ex. repo hors périmètre).
 */
export default function GlobalNotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <NotFoundView />
    </div>
  );
}
