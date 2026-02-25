// This proxy is no longer used — sync is handled client-side via Google OAuth.
// Kept as a placeholder in case a server-side fallback is needed in the future.

export default function handler(req, res) {
  res.status(410).json({ success: false, error: 'This endpoint is deprecated. Sync is now handled client-side.' });
}
