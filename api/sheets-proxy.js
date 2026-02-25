/**
 * Vercel Serverless Function — GitHub Gist sync backend
 * Stores sprint data as JSON in a private GitHub Gist.
 *
 * Required Vercel environment variables:
 *   GITHUB_TOKEN   — Personal Access Token with "gist" scope
 *   GITHUB_GIST_ID — ID of the private Gist to use (created on first push if missing)
 */

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GIST_FILENAME = 'sprint-data.json';

const githubHeaders = () => ({
  Authorization: `Bearer ${GITHUB_TOKEN}`,
  Accept: 'application/vnd.github.v3+json',
  'Content-Type': 'application/json',
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!GITHUB_TOKEN) {
    return res.status(500).json({
      success: false,
      error: 'GITHUB_TOKEN not configured in Vercel environment variables.',
    });
  }

  const gistId = process.env.GITHUB_GIST_ID;

  try {
    // ── GET: Pull data ────────────────────────────────────────────────────────
    if (req.method === 'GET') {
      if (!gistId) {
        // No gist yet — return empty data (first-time use)
        return res.status(200).json({ success: true, tasks: [], developers: [] });
      }

      const response = await fetch(`https://api.github.com/gists/${gistId}`, {
        headers: githubHeaders(),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(`GitHub API error ${response.status}: ${err.message || response.statusText}`);
      }

      const gist = await response.json();
      const file = gist.files[GIST_FILENAME];

      if (!file) {
        return res.status(200).json({ success: true, tasks: [], developers: [] });
      }

      const data = JSON.parse(file.content);
      return res.status(200).json({
        success: true,
        tasks: data.tasks || [],
        developers: data.developers || [],
      });
    }

    // ── POST: Push data ───────────────────────────────────────────────────────
    if (req.method === 'POST') {
      const { tasks, developers } = req.body;
      const content = JSON.stringify({ tasks: tasks || [], developers: developers || [] }, null, 2);

      if (!gistId) {
        // First push — create a new private Gist automatically
        const createRes = await fetch('https://api.github.com/gists', {
          method: 'POST',
          headers: githubHeaders(),
          body: JSON.stringify({
            description: 'Sprint Task Manager Data',
            public: false,
            files: { [GIST_FILENAME]: { content } },
          }),
        });

        if (!createRes.ok) {
          const err = await createRes.json().catch(() => ({}));
          throw new Error(`Failed to create Gist: ${err.message || createRes.status}`);
        }

        const newGist = await createRes.json();
        return res.status(200).json({
          success: true,
          newGistId: newGist.id,
          message: `Gist created! Add GITHUB_GIST_ID=${newGist.id} to Vercel environment variables, then redeploy.`,
        });
      }

      // Update existing Gist
      const updateRes = await fetch(`https://api.github.com/gists/${gistId}`, {
        method: 'PATCH',
        headers: githubHeaders(),
        body: JSON.stringify({
          files: { [GIST_FILENAME]: { content } },
        }),
      });

      if (!updateRes.ok) {
        const err = await updateRes.json().catch(() => ({}));
        throw new Error(`Failed to update Gist: ${err.message || updateRes.status}`);
      }

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
