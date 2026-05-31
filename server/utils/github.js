// Octokit wrapper. @octokit/rest is ESM-only, so we lazy-load via dynamic import
// to stay compatible with our CommonJS server.
let _Octokit = null;
async function getOctokit(token) {
  if (!_Octokit) {
    ({ Octokit: _Octokit } = await import('@octokit/rest'));
  }
  return new _Octokit({ auth: token });
}

// Register a pull_request webhook on a repo. Returns the hook id.
async function registerWebhook(token, owner, repo, webhookUrl, secret) {
  const octokit = await getOctokit(token);
  const { data } = await octokit.repos.createWebhook({
    owner,
    repo,
    events: ['pull_request'],
    config: { url: webhookUrl, content_type: 'json', secret },
  });
  return data.id;
}

async function deleteWebhook(token, owner, repo, hookId) {
  const octokit = await getOctokit(token);
  await octokit.repos.deleteWebhook({ owner, repo, hook_id: hookId });
}

// Commit Status API: POST /repos/:owner/:repo/statuses/:sha
async function postStatus(token, owner, repo, sha, { state, description, context, target_url }) {
  const octokit = await getOctokit(token);
  await octokit.repos.createCommitStatus({
    owner,
    repo,
    sha,
    state, // 'success' | 'failure' | 'pending' | 'error'
    description,
    context, // 'prova/manual-qa'
    target_url,
  });
}

// Create an issue. Returns { number, url }.
async function createIssue(token, owner, repo, { title, body, labels }) {
  const octokit = await getOctokit(token);
  const { data } = await octokit.issues.create({ owner, repo, title, body, labels });
  return { number: data.number, url: data.html_url };
}

module.exports = { registerWebhook, deleteWebhook, postStatus, createIssue };
