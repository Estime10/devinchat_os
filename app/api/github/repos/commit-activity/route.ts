import { getGithubCommitActivityController } from "@/backend/controllers";

export async function POST(request: Request) {
  return getGithubCommitActivityController(request);
}
