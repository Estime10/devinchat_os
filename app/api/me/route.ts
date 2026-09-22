import { getMeController } from "@/backend/controllers";

export async function GET() {
  return getMeController();
}
