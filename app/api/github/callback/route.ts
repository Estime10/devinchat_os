import { callbackGithubController } from "@/backend/controllers";

export async function GET(request: Request) {
  return callbackGithubController(request);
}
