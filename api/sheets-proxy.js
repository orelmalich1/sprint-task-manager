/**
 * Vercel Serverless Function - Proxy for Google Apps Script
 * This avoids CORS issues by making server-side requests
 */

export default async function handler(req, res) {
  // Enable CORS for your frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Get the Google Apps Script URL from environment variable
    const SHEETS_URL = process.env.GOOGLE_SHEETS_URL || req.body.sheetsUrl || req.query.sheetsUrl;

    if (!SHEETS_URL) {
      return res.status(400).json({
        success: false,
        error: 'Google Sheets URL not configured'
      });
    }

    // Handle GET requests (Pull)
    if (req.method === 'GET') {
      const action = req.query.action || 'getAll';
      const url = `${SHEETS_URL}?action=${action}`;

      const response = await fetch(url, {
        method: 'GET',
        redirect: 'follow'
      });

      const data = await response.json();
      return res.status(200).json(data);
    }

    // Handle POST requests (Push)
    if (req.method === 'POST') {
      const response = await fetch(SHEETS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body.data || req.body),
        redirect: 'follow'
      });

      const data = await response.json();
      return res.status(200).json(data);
    }

    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });

  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
