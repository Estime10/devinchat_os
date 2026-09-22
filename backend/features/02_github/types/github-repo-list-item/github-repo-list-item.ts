/** Item liste repos homescreen (colonne). */
export type GithubRepoListItem = {
  id: number;
  fullName: string;
  htmlUrl: string;
  createdAt: string | null;
  pushedAt: string | null;
};
