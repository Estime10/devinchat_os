import { connectGithubController } from "@/backend/controllers";

export async function GET(request: Request) {
  return connectGithubController(request);
}
