import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

const GoogleSheetSync = () => {
  const { state, addDeveloper, addTask, removeDeveloper, deleteTask } = useApp();
  const [sheetId, setSheetId] = useState(localStorage.getItem('googleSheetId') || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [syncStatus, setSyncStatus] = useState('');
  const [autoSync, setAutoSync] = useState(localStorage.getItem('autoSync') === 'true');

  // Auto-sync every 30 seconds if enabled
  useEffect(() => {
    if (autoSync && sheetId) {
      const interval = setInterval(() => {
        syncFromSheet(false);
      }, 30000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSync, sheetId]);

  const saveSheetId = () => {
    localStorage.setItem('googleSheetId', sheetId);
    setSyncStatus('Sheet ID saved!');
    setTimeout(() => setSyncStatus(''), 3000);
    setIsModalOpen(false);
  };

  const convertTasksToSheetFormat = (tasks, developers) => {
    return tasks.map(task => {
      const dev = developers.find(d => d.id === task.developerId);
      const sprintNum = task.startSprint;
      let quarter = 'Q2';
      if (sprintNum >= 1 && sprintNum < 7) quarter = 'Q1';
      else if (sprintNum >= 7 && sprintNum < 14) quarter = 'Q2';
      else if (sprintNum >= 14 && sprintNum < 20) quarter = 'Q3';
      else if (sprintNum >= 20) quarter = 'Q4';
      return {
        id: task.id,
        title: task.title,
        developer: dev ? dev.name : 'Unknown',
        quarter,
        startSprint: task.startSprint,
        duration: task.duration,
        color: task.color,
      };
    });
  };

  const convertDevelopersToSheetFormat = (developers) => {
    return developers.map(dev => {
      let quarter = 'Q1';
      if (dev.startDate) {
        const month = new Date(dev.startDate).getMonth();
        if (month >= 0 && month < 3) quarter = 'Q1';
        else if (month >= 3 && month < 6) quarter = 'Q2';
        else if (month >= 6 && month < 9) quarter = 'Q3';
        else quarter = 'Q4';
      }
      return {
        id: dev.id,
        name: dev.name,
        quarter,
        startDate: dev.startDate || '',
        endDate: dev.endDate || '',
      };
    });
  };

  const syncToSheet = async () => {
    if (!sheetId) {
      setSyncStatus('Please configure Sheet ID first');
      return;
    }
    setIsSyncing(true);
    setSyncStatus('Pushing to Google Sheets...');
    try {
      const tasksData = convertTasksToSheetFormat(state.tasks, state.developers);
      const developersData = convertDevelopersToSheetFormat(state.developers);

      const response = await fetch('/api/sheets-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sheetId,
          action: 'syncAll',
          tasks: tasksData,
          developers: developersData,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setLastSync(new Date());
        setSyncStatus('✓ Synced to Google Sheets');
        setTimeout(() => setSyncStatus(''), 3000);
      } else {
        setSyncStatus(`Error: ${result.error}`);
      }
    } catch (error) {
      setSyncStatus(`Push failed: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const syncFromSheet = async (showStatus = true) => {
    if (!sheetId) {
      if (showStatus) setSyncStatus('Please configure Sheet ID first');
      return;
    }
    setIsSyncing(true);
    if (showStatus) setSyncStatus('Loading from Google Sheets...');
    try {
      const response = await fetch(`/api/sheets-proxy?sheetId=${encodeURIComponent(sheetId)}`);

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(err.error || `HTTP ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        state.developers.forEach(dev => removeDeveloper(dev.id));
        state.tasks.forEach(task => deleteTask(task.id));

        const developerMap = {};

        if (result.developers && result.developers.length > 0) {
          result.developers.forEach(sheetDev => {
            const devName = (sheetDev.name || '').trim();
            if (devName) {
              const dev = {
                id: sheetDev.id || `dev-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: devName,
                startDate: sheetDev.startDate || null,
                endDate: sheetDev.endDate || null,
              };
              addDeveloper(dev);
              developerMap[devName] = dev.id;
            }
          });
        }

        if (Object.keys(developerMap).length === 0 && result.tasks && result.tasks.length > 0) {
          const uniqueDevNames = [...new Set(result.tasks.map(t => (t.developer || '').trim()).filter(n => n))];
          uniqueDevNames.forEach(devName => {
            const dev = {
              id: `dev-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: devName,
              startDate: null,
              endDate: null,
            };
            addDeveloper(dev);
            developerMap[devName] = dev.id;
          });
        }

        result.tasks.forEach(sheetTask => {
          const devName = (sheetTask.developer || '').trim();
          const developerId = developerMap[devName];
          if (developerId) {
            addTask({
              id: sheetTask.id || `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              title: (sheetTask.title || '').trim(),
              developerId,
              startSprint: parseFloat(sheetTask.startSprint),
              duration: parseFloat(sheetTask.duration),
              color: (sheetTask.color || '#3B82F6').trim(),
            });
          }
        });

        setLastSync(new Date());
        if (showStatus) {
          setSyncStatus('✓ Loaded from Google Sheets');
          setTimeout(() => setSyncStatus(''), 3000);
        }
      } else {
        setSyncStatus(`Error: ${result.error}`);
      }
    } catch (error) {
      if (showStatus) setSyncStatus(`Pull failed: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleAutoSync = () => {
    const newValue = !autoSync;
    setAutoSync(newValue);
    localStorage.setItem('autoSync', newValue.toString());
  };

  return (
    <>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-secondary" title="Configure Google Sheets Sync">
          ⚙️ Sync Settings
        </button>

        {sheetId && (
          <>
            <button onClick={() => syncFromSheet(true)} className="btn btn-secondary" disabled={isSyncing} title="Pull from Google Sheets">
              ⬇️ Pull
            </button>
            <button onClick={syncToSheet} className="btn btn-primary" disabled={isSyncing} title="Push to Google Sheets">
              ⬆️ Push
            </button>
          </>
        )}

        {syncStatus && (
          <span style={{
            fontSize: '13px',
            color: syncStatus.includes('✓') ? '#16a34a' : syncStatus.includes('Error') || syncStatus.includes('failed') ? '#dc2626' : '#6b7280',
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
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <h2>Google Sheets Sync Setup</h2>

            <div style={{ marginBottom: '20px', fontSize: '14px', color: '#6b7280', lineHeight: '1.6' }}>
              <p style={{ marginBottom: '8px', fontWeight: 600, color: '#1f2937' }}>How to find your Sheet ID:</p>
              <p style={{ marginBottom: '12px' }}>
                Open your Google Sheet and look at the URL:<br />
                <code style={{ background: '#f3f4f6', padding: '4px 6px', borderRadius: '4px', fontSize: '12px' }}>
                  docs.google.com/spreadsheets/d/<strong style={{ color: '#2563eb' }}>YOUR_SHEET_ID</strong>/edit
                </code>
              </p>
              <p style={{ fontSize: '13px', color: '#d97706', background: '#fef3c7', padding: '8px', borderRadius: '4px' }}>
                Make sure your sheet is shared with the service account email configured in Vercel.
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">
                Google Sheet ID <span className="required">*</span>
              </label>
              <input
                type="text"
                value={sheetId}
                onChange={(e) => setSheetId(e.target.value)}
                className="form-input"
                placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
              />
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={autoSync} onChange={toggleAutoSync} />
                <span className="form-label" style={{ margin: 0 }}>
                  Enable auto-sync (pulls changes every 30 seconds)
                </span>
              </label>
            </div>

            <div className="modal-buttons">
              <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-full btn-secondary">
                Cancel
              </button>
              <button onClick={saveSheetId} className="btn btn-full btn-primary">
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GoogleSheetSync;
