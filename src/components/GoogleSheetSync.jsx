import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';

const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';
const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';
const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

const GoogleSheetSync = () => {
  const { state, addDeveloper, addTask, removeDeveloper, deleteTask } = useApp();
  const [sheetId, setSheetId] = useState(localStorage.getItem('googleSheetId') || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [syncStatus, setSyncStatus] = useState('');
  const [autoSync, setAutoSync] = useState(localStorage.getItem('autoSync') === 'true');
  const [isSignedIn, setIsSignedIn] = useState(false);

  const tokenClientRef = useRef(null);
  const accessTokenRef = useRef(null);
  const tokenExpiryRef = useRef(null);
  const pendingResolveRef = useRef(null);

  // Initialize Google Identity Services once the script loads
  useEffect(() => {
    const initClient = () => {
      if (!window.google || !CLIENT_ID) return;
      tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (response) => {
          if (response.access_token) {
            accessTokenRef.current = response.access_token;
            tokenExpiryRef.current = Date.now() + (response.expires_in - 60) * 1000;
            setIsSignedIn(true);
            if (pendingResolveRef.current) {
              pendingResolveRef.current(response.access_token);
              pendingResolveRef.current = null;
            }
          }
        },
      });
    };

    if (window.google) {
      initClient();
    } else {
      // Wait for the GIS script to load
      const interval = setInterval(() => {
        if (window.google) {
          clearInterval(interval);
          initClient();
        }
      }, 200);
      return () => clearInterval(interval);
    }
  }, []);

  // Auto-sync every 30 seconds if enabled
  useEffect(() => {
    if (autoSync && sheetId && isSignedIn) {
      const interval = setInterval(() => syncFromSheet(false), 30000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSync, sheetId, isSignedIn]);

  const getAccessToken = useCallback(() => {
    return new Promise((resolve, reject) => {
      // Reuse valid token
      if (accessTokenRef.current && tokenExpiryRef.current && Date.now() < tokenExpiryRef.current) {
        return resolve(accessTokenRef.current);
      }
      if (!tokenClientRef.current) {
        return reject(new Error('Google auth not initialized. Make sure REACT_APP_GOOGLE_CLIENT_ID is set.'));
      }
      pendingResolveRef.current = resolve;
      // prompt='' means re-use existing session silently if possible
      tokenClientRef.current.requestAccessToken({ prompt: '' });
    });
  }, []);

  const sheetsGet = async (token, range) => {
    const res = await fetch(`${SHEETS_API}/${sheetId}/values/${encodeURIComponent(range)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `HTTP ${res.status}`);
    }
    return res.json();
  };

  const sheetsClear = async (token, range) => {
    await fetch(`${SHEETS_API}/${sheetId}/values/${encodeURIComponent(range)}:clear`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
  };

  const sheetsUpdate = async (token, range, values) => {
    const res = await fetch(
      `${SHEETS_API}/${sheetId}/values/${encodeURIComponent(range)}?valueInputOption=RAW`,
      {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ values }),
      }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `HTTP ${res.status}`);
    }
  };

  const convertTasksToSheetFormat = (tasks, developers) => {
    return tasks.map(task => {
      const dev = developers.find(d => d.id === task.developerId);
      const s = task.startSprint;
      let quarter = 'Q2';
      if (s >= 1 && s < 7) quarter = 'Q1';
      else if (s >= 7 && s < 14) quarter = 'Q2';
      else if (s >= 14 && s < 20) quarter = 'Q3';
      else if (s >= 20) quarter = 'Q4';
      return { id: task.id, title: task.title, developer: dev ? dev.name : 'Unknown', quarter, startSprint: task.startSprint, duration: task.duration, color: task.color };
    });
  };

  const convertDevelopersToSheetFormat = (developers) => {
    return developers.map(dev => {
      let quarter = 'Q1';
      if (dev.startDate) {
        const m = new Date(dev.startDate).getMonth();
        if (m < 3) quarter = 'Q1';
        else if (m < 6) quarter = 'Q2';
        else if (m < 9) quarter = 'Q3';
        else quarter = 'Q4';
      }
      return { id: dev.id, name: dev.name, quarter, startDate: dev.startDate || '', endDate: dev.endDate || '' };
    });
  };

  const syncToSheet = async () => {
    if (!sheetId) { setSyncStatus('Please configure Sheet ID first'); return; }
    setIsSyncing(true);
    setSyncStatus('Pushing to Google Sheets...');
    try {
      const token = await getAccessToken();
      const tasks = convertTasksToSheetFormat(state.tasks, state.developers);
      const devs = convertDevelopersToSheetFormat(state.developers);

      await sheetsClear(token, 'Tasks!A:Z');
      await sheetsUpdate(token, 'Tasks!A1', [
        ['Task', 'Developer', 'Quarter', 'Start Sprint', 'Duration', 'Color', 'ID'],
        ...tasks.map(t => [t.title, t.developer, t.quarter, t.startSprint, t.duration, t.color, t.id]),
      ]);

      await sheetsClear(token, 'Developers!A:Z');
      await sheetsUpdate(token, 'Developers!A1', [
        ['Name', 'Quarter', 'Start Date', 'End Date', 'ID'],
        ...devs.map(d => [d.name, d.quarter, d.startDate, d.endDate, d.id]),
      ]);

      setLastSync(new Date());
      setSyncStatus('✓ Synced to Google Sheets');
      setTimeout(() => setSyncStatus(''), 3000);
    } catch (error) {
      setSyncStatus(`Push failed: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const syncFromSheet = async (showStatus = true) => {
    if (!sheetId) { if (showStatus) setSyncStatus('Please configure Sheet ID first'); return; }
    setIsSyncing(true);
    if (showStatus) setSyncStatus('Loading from Google Sheets...');
    try {
      const token = await getAccessToken();

      const [tasksData, devsData] = await Promise.all([
        sheetsGet(token, 'Tasks!A:G'),
        sheetsGet(token, 'Developers!A:E'),
      ]);

      const tasksRows = tasksData.values || [];
      const devsRows = devsData.values || [];

      const tasks = [];
      for (let i = 1; i < tasksRows.length; i++) {
        const r = tasksRows[i];
        if (r[0]) tasks.push({ id: r[6], title: r[0], developer: r[1], startSprint: parseFloat(r[3]), duration: parseFloat(r[4]), color: r[5] || '#3B82F6' });
      }

      const developers = [];
      for (let i = 1; i < devsRows.length; i++) {
        const r = devsRows[i];
        if (r[0]) developers.push({ id: r[4], name: r[0], startDate: r[2] || null, endDate: r[3] || null });
      }

      // Clear and reload state
      state.developers.forEach(dev => removeDeveloper(dev.id));
      state.tasks.forEach(task => deleteTask(task.id));

      const developerMap = {};
      developers.forEach(sheetDev => {
        const name = (sheetDev.name || '').trim();
        if (name) {
          const dev = { id: sheetDev.id || `dev-${Date.now()}-${Math.random().toString(36).substr(2,9)}`, name, startDate: sheetDev.startDate, endDate: sheetDev.endDate };
          addDeveloper(dev);
          developerMap[name] = dev.id;
        }
      });

      if (Object.keys(developerMap).length === 0) {
        [...new Set(tasks.map(t => (t.developer || '').trim()).filter(Boolean))].forEach(name => {
          const dev = { id: `dev-${Date.now()}-${Math.random().toString(36).substr(2,9)}`, name, startDate: null, endDate: null };
          addDeveloper(dev);
          developerMap[name] = dev.id;
        });
      }

      tasks.forEach(t => {
        const developerId = developerMap[(t.developer || '').trim()];
        if (developerId) {
          addTask({ id: t.id || `task-${Date.now()}-${Math.random().toString(36).substr(2,9)}`, title: (t.title || '').trim(), developerId, startSprint: t.startSprint, duration: t.duration, color: t.color });
        }
      });

      setLastSync(new Date());
      if (showStatus) { setSyncStatus('✓ Loaded from Google Sheets'); setTimeout(() => setSyncStatus(''), 3000); }
    } catch (error) {
      if (showStatus) setSyncStatus(`Pull failed: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSignIn = async () => {
    try {
      await getAccessToken();
    } catch (e) {
      setSyncStatus(`Sign-in failed: ${e.message}`);
    }
  };

  const saveSheetId = () => {
    localStorage.setItem('googleSheetId', sheetId);
    setSyncStatus('Sheet ID saved!');
    setTimeout(() => setSyncStatus(''), 3000);
    setIsModalOpen(false);
  };

  const toggleAutoSync = () => {
    const v = !autoSync;
    setAutoSync(v);
    localStorage.setItem('autoSync', v.toString());
  };

  const isReady = sheetId && isSignedIn;

  return (
    <>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-secondary" title="Configure Google Sheets Sync">
          ⚙️ Sync Settings
        </button>

        {sheetId && !isSignedIn && (
          <button onClick={handleSignIn} className="btn btn-secondary" title="Connect Google Account">
            🔑 Connect Google
          </button>
        )}

        {isReady && (
          <>
            <button onClick={() => syncFromSheet(true)} className="btn btn-secondary" disabled={isSyncing}>
              ⬇️ Pull
            </button>
            <button onClick={syncToSheet} className="btn btn-primary" disabled={isSyncing}>
              ⬆️ Push
            </button>
          </>
        )}

        {syncStatus && (
          <span style={{
            fontSize: '13px',
            color: syncStatus.includes('✓') ? '#16a34a' : syncStatus.includes('failed') || syncStatus.includes('Error') ? '#dc2626' : '#6b7280',
            fontWeight: 500
          }}>
            {syncStatus}
          </span>
        )}

        {lastSync && !syncStatus && (
          <span style={{ fontSize: '12px', color: '#9ca3af' }}>
            Last: {lastSync.toLocaleTimeString()}
          </span>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <h2>Google Sheets Sync Setup</h2>

            <div style={{ marginBottom: '20px', fontSize: '14px', color: '#6b7280', lineHeight: '1.6' }}>
              <p style={{ marginBottom: '8px', fontWeight: 600, color: '#1f2937' }}>How to find your Sheet ID:</p>
              <p style={{ marginBottom: '12px' }}>
                Open your Google Sheet and look at the URL:<br />
                <code style={{ background: '#f3f4f6', padding: '4px 6px', borderRadius: '4px', fontSize: '12px' }}>
                  docs.google.com/spreadsheets/d/<strong style={{ color: '#2563eb' }}>YOUR_SHEET_ID</strong>/edit
                </code>
              </p>
              <p style={{ fontSize: '13px', color: '#2563eb', background: '#eff6ff', padding: '8px', borderRadius: '4px' }}>
                After saving, click <strong>🔑 Connect Google</strong> and sign in with your nanit.com account to authorize access.
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">
                Google Sheet ID <span className="required">*</span>
              </label>
              <input
                type="text"
                value={sheetId}
                onChange={e => setSheetId(e.target.value)}
                className="form-input"
                placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
              />
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={autoSync} onChange={toggleAutoSync} />
                <span className="form-label" style={{ margin: 0 }}>Enable auto-sync (pulls every 30 seconds)</span>
              </label>
            </div>

            <div className="modal-buttons">
              <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-full btn-secondary">Cancel</button>
              <button onClick={saveSheetId} className="btn btn-full btn-primary">Save & Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GoogleSheetSync;
