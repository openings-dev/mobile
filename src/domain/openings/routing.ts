export function buildJobRoute(id: string): string {
  return `/jobs/${encodeURIComponent(id)}`;
}

export function buildAuthorRoute(handle: string): string {
  return `/authors/${encodeURIComponent(handle)}`;
}

export function buildCommunityRoute(repository: string): string {
  const [owner = repository, name = "repository"] = repository.split("/");
  return `/communities/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`;
}
