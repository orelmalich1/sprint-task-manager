import { google } from 'googleapis';

const TASKS_SHEET = 'Tasks';
const DEVELOPERS_SHEET = 'Developers';

async function getAuthClient() {
  const privateKey = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;

  if (!clientEmail || !privateKey) {
    throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_PRIVATE_KEY environment variables');
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return auth;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const sheetId = process.env.GOOGLE_SHEET_ID ||
                    (req.query && req.query.sheetId) ||
                    (req.body && req.body.sheetId);

    if (!sheetId) {
      return res.status(400).json({
        success: false,
        error: 'Sheet ID not configured. Set GOOGLE_SHEET_ID in Vercel environment variables or pass sheetId parameter.'
      });
    }

    const auth = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    // ── GET: Pull data from sheet ─────────────────────────────────────────────
    if (req.method === 'GET') {
      // Fetch Tasks and Developers sheets in parallel
      const [tasksRes, devsRes] = await Promise.all([
        sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range: `${TASKS_SHEET}!A:G` }),
        sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range: `${DEVELOPERS_SHEET}!A:E` }),
      ]);

      const tasksRows = tasksRes.data.values || [];
      const tasks = [];
      for (let i = 1; i < tasksRows.length; i++) {
        const row = tasksRows[i];
        if (row[0]) {
          tasks.push({
            id: row[6] || `task-${Date.now()}-${i}`,
            title: row[0],
            developer: row[1],
            quarter: row[2],
            startSprint: parseFloat(row[3]),
            duration: parseFloat(row[4]),
            color: row[5] || '#3B82F6',
          });
        }
      }

      const devsRows = devsRes.data.values || [];
      const developers = [];
      for (let i = 1; i < devsRows.length; i++) {
        const row = devsRows[i];
        if (row[0]) {
          developers.push({
            id: row[4] || `dev-${Date.now()}-${i}`,
            name: row[0],
            quarter: row[1],
            startDate: row[2] || null,
            endDate: row[3] || null,
          });
        }
      }

      return res.status(200).json({ success: true, tasks, developers });
    }

    // ── POST: Push data to sheet ──────────────────────────────────────────────
    if (req.method === 'POST') {
      const body = req.body;
      const action = (body.data ? body.data.action : body.action) || 'syncAll';
      const tasks = body.data ? body.data.tasks : body.tasks;
      const developers = body.data ? body.data.developers : body.developers;

      if (action === 'syncAll' || action === 'updateTasks') {
        await sheets.spreadsheets.values.clear({ spreadsheetId: sheetId, range: `${TASKS_SHEET}!A:Z` });
        const taskValues = [
          ['Task', 'Developer', 'Quarter', 'Start Sprint', 'Duration', 'Color', 'ID'],
          ...(tasks || []).map(t => [t.title, t.developer, t.quarter || '', t.startSprint, t.duration, t.color, t.id]),
        ];
        await sheets.spreadsheets.values.update({
          spreadsheetId: sheetId,
          range: `${TASKS_SHEET}!A1`,
          valueInputOption: 'RAW',
          requestBody: { values: taskValues },
        });
      }

      if (action === 'syncAll' || action === 'updateDevelopers') {
        await sheets.spreadsheets.values.clear({ spreadsheetId: sheetId, range: `${DEVELOPERS_SHEET}!A:Z` });
        const devValues = [
          ['Name', 'Quarter', 'Start Date', 'End Date', 'ID'],
          ...(developers || []).map(d => [d.name, d.quarter || '', d.startDate || '', d.endDate || '', d.id]),
        ];
        await sheets.spreadsheets.values.update({
          spreadsheetId: sheetId,
          range: `${DEVELOPERS_SHEET}!A1`,
          valueInputOption: 'RAW',
          requestBody: { values: devValues },
        });
      }

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });

  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
