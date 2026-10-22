// Runs trusted base-branch code only. PR content is fetched as JSON, never executed.
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { validateCatalog } from './validate-food.mjs';

export async function runFoodPr({ event, repo, api, previous }) {
  const pr = event.pull_request;
  if (!pr || pr.draft || pr.base.ref !== 'main' || pr.head.repo?.full_name !== repo || pr.user.login !== '50thycal') {
    return { merged: false, reason: 'Not eligible for catalog auto-merge.' };
  }

  // changed_files and page length together prevent a truncated listing from widening scope.
  const files = await api(`/pulls/${pr.number}/files?per_page=100`);
  if (pr.changed_files !== 1 || files.length !== 1 || files[0].filename !== 'data/food/catalog.json' || files[0].status !== 'modified') {
    return { merged: false, reason: 'Only catalog modifications are eligible.' };
  }
  const head = pr.head.sha;
  const content = await api(`/contents/data/food/catalog.json?ref=${head}`);
  if (content.encoding !== 'base64') throw new Error('Expected a JSON catalog file');
  const candidate = validateCatalog(JSON.parse(Buffer.from(content.content, 'base64').toString('utf8')));
  for (const entry of previous.entries) {
    if (!candidate.entries.some(item => item.id === entry.id)) throw new Error(`Preserve ${entry.id}; archive old entries instead of deleting them.`);
  }
  const current = await api(`/pulls/${pr.number}`);
  if (current.head.sha !== head || current.state !== 'open' || current.draft || current.base.ref !== 'main' || current.user.login !== '50thycal') throw new Error('PR changed during validation; retry on the latest event');
  const result = await api(`/pulls/${pr.number}/merge`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sha: head, merge_method: 'squash' }),
  });
  if (!result.merged) throw new Error('GitHub did not merge the PR');
  return { merged: true, sha: result.sha };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
  const repo = process.env.GITHUB_REPOSITORY;
  const api = async (path, options = {}) => {
    const response = await fetch(`https://api.github.com/repos/${repo}${path}`, {
      ...options,
      headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', ...options.headers },
    });
    if (!response.ok) throw new Error(`GitHub request failed (${response.status})`);
    return response.json();
  };
  const previous = JSON.parse(fs.readFileSync('data/food/catalog.json', 'utf8'));
  console.log(await runFoodPr({ event, repo, api, previous }));
}
