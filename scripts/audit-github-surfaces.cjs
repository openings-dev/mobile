const { spawnSync } = require("node:child_process");

function defaultRequest(endpoint) {
  const result = spawnSync("gh", ["api", endpoint, "--paginate", "--slurp"], {
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.status !== 0) throw new Error("GitHub endpoint inaccessible");
  const pages = JSON.parse(result.stdout);
  return pages.length === 1 ? pages[0] : pages.flatMap((page) => Array.isArray(page) ? page : [page]);
}

function list(value, key) {
  if (Array.isArray(value)) return value;
  return Array.isArray(value?.[key]) ? value[key] : [];
}

async function safely(request, endpoint, project) {
  try {
    return project(await request(endpoint));
  } catch {
    return { status: "inaccessible" };
  }
}

async function auditGithubSurfaces({ repository, request = defaultRequest }) {
  const base = `repos/${repository}`;
  const repositoryResult = await safely(request, base, (value) => ({
    nameWithOwner: String(value.full_name || repository),
    visibility: String(value.visibility || (value.private ? "private" : "public")).toUpperCase(),
    defaultBranch: String(value.default_branch || ""),
  }));

  const surfaces = {
    branches: await safely(request, `${base}/branches`, (value) => list(value).map((item) => ({
      name: String(item.name), protected: Boolean(item.protected), headSha: String(item.commit?.sha || ""),
    }))),
    tags: await safely(request, `${base}/tags`, (value) => list(value).map((item) => ({
      name: String(item.name), commitSha: String(item.commit?.sha || ""),
    }))),
    releases: await safely(request, `${base}/releases`, (value) => list(value).map((item) => ({
      id: Number(item.id), tagName: String(item.tag_name), draft: Boolean(item.draft), prerelease: Boolean(item.prerelease), publishedAt: item.published_at || null,
    }))),
    workflows: await safely(request, `${base}/actions/workflows`, (value) => list(value, "workflows").map((item) => ({
      id: Number(item.id), name: String(item.name), path: String(item.path), state: String(item.state),
    }))),
    artifacts: await safely(request, `${base}/actions/artifacts`, (value) => list(value, "artifacts").map((item) => ({
      id: Number(item.id), name: String(item.name), sizeBytes: Number(item.size_in_bytes), expired: Boolean(item.expired), createdAt: item.created_at || null,
    }))),
    rulesets: await safely(request, `${base}/rulesets`, (value) => list(value).map((item) => ({
      id: Number(item.id), name: String(item.name), target: String(item.target), enforcement: String(item.enforcement),
    }))),
    environments: await safely(request, `${base}/environments`, (value) => list(value, "environments").map((item) => ({
      id: Number(item.id), name: String(item.name), protectionRuleTypes: list(item, "protection_rules").map((rule) => String(rule.type)),
    }))),
  };

  const metadata = {
    actionsPermissions: await safely(request, `${base}/actions/permissions`, (value) => ({
      status: "accessible", enabled: Boolean(value.enabled), allowedActions: String(value.allowed_actions || "unknown"),
    })),
    actionsPublicKey: await safely(request, `${base}/actions/secrets/public-key`, (value) => ({
      status: "accessible", keyId: String(value.key_id || ""),
    })),
  };
  const inaccessible = [repositoryResult, ...Object.values(surfaces), ...Object.values(metadata)]
    .some((value) => value?.status === "inaccessible");

  return {
    generatedAt: new Date().toISOString(),
    clearance: inaccessible ? "blocked" : "remote-inventory-complete",
    repository: repositoryResult,
    surfaces,
    metadata,
  };
}

module.exports = { auditGithubSurfaces, defaultRequest };
