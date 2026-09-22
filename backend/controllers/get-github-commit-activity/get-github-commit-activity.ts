import { getOwnGithubCommitActivity } from "@/backend/features/02_github/services/get-own-github-commit-activity/get-own-github-commit-activity";
import { getOwnGithubAccessToken } from "@/backend/features/02_github/services/get-own-github-access-token/get-own-github-access-token";
import { NextResponse } from "next/server";

const MAX_REPOS_PER_REQUEST = 12;

type CommitActivityBody = {
  fullNames?: unknown;
};

/**
 * POST — tendances commits (délègue au service whitelist + cache).
 */
export async function getGithubCommitActivityController(request: Request) {
  const accessToken = await getOwnGithubAccessToken();
  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: CommitActivityBody;
  try {
    body = (await request.json()) as CommitActivityBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!Array.isArray(body.fullNames)) {
    return NextResponse.json({ error: "fullNames required" }, { status: 400 });
  }

  const fullNames = body.fullNames
    .filter((name): name is string => typeof name === "string")
    .slice(0, MAX_REPOS_PER_REQUEST);

  const activity = await getOwnGithubCommitActivity(fullNames);

  return NextResponse.json({ activity });
}
