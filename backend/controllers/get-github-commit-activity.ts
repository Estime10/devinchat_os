import { getOwnGithubAccessToken } from "@/backend/features/02_github/services/get-own-github-access-token";
import {
  fetchGithubCommitActivity,
  parseGithubFullName,
} from "@/lib/github/commit-activity";
import { NextResponse } from "next/server";

const MAX_REPOS_PER_REQUEST = 12;

type CommitActivityBody = {
  fullNames?: unknown;
};

/**
 * POST — tendances commits (12 semaines) pour les repos visibles uniquement.
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

  const entries = await Promise.all(
    fullNames.map(async (fullName) => {
      const parsed = parseGithubFullName(fullName);
      if (!parsed) {
        return [fullName, null] as const;
      }

      const weeks = await fetchGithubCommitActivity({
        accessToken,
        owner: parsed.owner,
        repo: parsed.repo,
      });

      return [fullName, weeks] as const;
    }),
  );

  return NextResponse.json({
    activity: Object.fromEntries(entries) as Record<string, number[] | null>,
  });
}
