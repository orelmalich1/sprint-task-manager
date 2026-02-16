import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

const GoogleSheetSync = () => {
  const { state, addDeveloper, addTask, removeDeveloper, deleteTask } = useApp();
  const [webAppUrl, setWebAppUrl] = useState(localStorage.getItem('googleSheetsWebAppUrl') || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [syncStatus, setSyncStatus] = useState('');
  const [autoSync, setAutoSync] = useState(localStorage.getItem('autoSync') === 'true');

  // Auto-sync every 30 seconds if enabled
  useEffect(() => {
    if (autoSync && webAppUrl) {
      const interval = setInterval(() => {
        syncFromSheet(false); // Silent sync
      }, 30000);

      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSync, webAppUrl]);

  const saveWebAppUrl = () => {
    localStorage.setItem('googleSheetsWebAppUrl', webAppUrl);
    setSyncStatus('Web App URL saved!');
    setTimeout(() => setSyncStatus(''), 3000);
    setIsModalOpen(false);
  };

  const convertTasksToSheetFormat = (tasks, developers) => {
    return tasks.map(task => {
      const dev = developers.find(d => d.id === task.developerId);
      const sprintNum = task.startSprint;
      let quarter = 'Q2'; // Default
      if (sprintNum >= 1 && sprintNum < 7) quarter = 'Q1';
      else if (sprintNum >= 7 && sprintNum < 14) quarter = 'Q2';
      else if (sprintNum >= 14 && sprintNum < 20) quarter = 'Q3';
      else if (sprintNum >= 20) quarter = 'Q4';

      return {
        id: task.id,
        title: task.title,
        developer: dev ? dev.name : 'Unknown',
        quarter: quarter,
        startSprint: task.startSprint,
        duration: task.duration,
        color: task.color
      };
    });
  };

  const convertDevelopersToSheetFormat = (developers) => {
    return developers.map(dev => {
      let quarter = 'Q1'; // Default
      if (dev.startDate) {
        const date = new Date(dev.startDate);
        const month = date.getMonth();
        if (month >= 0 && month < 3) quarter = 'Q1';
        else if (month >= 3 && month < 6) quarter = 'Q2';
        else if (month >= 6 && month < 9) quarter = 'Q3';
        else quarter = 'Q4';
      }

      return {
        id: dev.id,
        name: dev.name,
        quarter: quarter,
        startDate: dev.startDate || '',
        endDate: dev.endDate || ''
      };
    });
  };

  const syncToSheet = async () => {
    if (!webAppUrl) {
      setSyncStatus('Please configure Web App URL first');
      return;
    }

    // Validate URL format
    if (webAppUrl.includes('/dev')) {
      setSyncStatus('❌ Error: Use /exec URL, not /dev. Redeploy as production.');
      return;
    }

    setIsSyncing(true);
    setSyncStatus('Pushing changes to Google Sheets...');

    try {
      const tasksData = convertTasksToSheetFormat(state.tasks, state.developers);
      const developersData = convertDevelopersToSheetFormat(state.developers);

      // Use proxy API instead of direct Google Apps Script call
      const response = await fetch('/api/sheets-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sheetsUrl: webAppUrl,
          data: {
            action: 'syncAll',
            tasks: tasksData,
            developers: developersData
          }
        })
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
      console.error('Sync error:', error);
      setSyncStatus(`Sync failed: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const syncFromSheet = async (showStatus = true) => {
    if (!webAppUrl) {
      if (showStatus) setSyncStatus('Please configure Web App URL first');
      return;
    }

    // Validate URL format
    if (webAppUrl.includes('/dev')) {
      setSyncStatus('❌ Error: Use /exec URL, not /dev. Redeploy as production.');
      return;
    }

    setIsSyncing(true);
    if (showStatus) setSyncStatus('Loading from Google Sheets...');

    try {
      // Use proxy API instead of direct Google Apps Script call
      const url = `/api/sheets-proxy?action=getAll&sheetsUrl=${encodeURIComponent(webAppUrl)}`;
      console.log('Fetching via proxy');

      const response = await fetch(url, {
        method: 'GET'
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        // Clear existing data
        state.developers.forEach(dev => removeDeveloper(dev.id));
        state.tasks.forEach(task => deleteTask(task.id));

        // Create developer map for matching
        const developerMap = {};

        // Add developers from sheet (if any exist)
        if (result.developers && result.developers.length > 0) {
          result.developers.forEach(sheetDev => {
            const devName = (sheetDev.name || '').trim();
            if (devName) {
              const dev = {
                id: sheetDev.id || `dev-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: devName,
                startDate: sheetDev.startDate || null,
                endDate: sheetDev.endDate || null
              };
              addDeveloper(dev);
              developerMap[devName] = dev.id;
            }
          });
        }

        // If no developers in sheet, auto-create from tasks
        if (Object.keys(developerMap).length === 0 && result.tasks && result.tasks.length > 0) {
          // Extract unique developer names from tasks
          const uniqueDevNames = [...new Set(result.tasks.map(t => (t.developer || '').trim()).filter(n => n))];
          uniqueDevNames.forEach(devName => {
            const dev = {
              id: `dev-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: devName,
              startDate: null,
              endDate: null
            };
            addDeveloper(dev);
            developerMap[devName] = dev.id;
          });
        }

        // Add tasks from sheet
        result.tasks.forEach(sheetTask => {
          const devName = (sheetTask.developer || '').trim();
          const developerId = developerMap[devName];
          if (developerId) {
            addTask({
              id: sheetTask.id || `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              title: (sheetTask.title || '').trim(),
              developerId: developerId,
              startSprint: parseFloat(sheetTask.startSprint),
              duration: parseFloat(sheetTask.duration),
              color: (sheetTask.color || '#3B82F6').trim()
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
      console.error('Sync error:', error);
      let errorMsg = 'Load failed';

      if (error.message === 'Failed to fetch') {
        errorMsg = 'Connection failed. Check: 1) Web App URL is correct, 2) Apps Script is deployed, 3) Check browser console';
      } else if (error.message.includes('HTTP')) {
        errorMsg = error.message;
      } else {
        errorMsg = `Load failed: ${error.message}`;
      }

      if (showStatus) setSyncStatus(errorMsg);
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
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-secondary"
          title="Configure Google Sheets Sync"
        >
          ⚙️ Sync Settings
        </button>

        {webAppUrl && (
          <>
            <button
              onClick={() => syncFromSheet(true)}
              className="btn btn-secondary"
              disabled={isSyncing}
              title="Pull changes from Google Sheets (May not work from localhost due to Google Workspace restrictions)"
            >
              ⬇️ Pull
            </button>

            <button
              onClick={syncToSheet}
              className="btn btn-primary"
              disabled={isSyncing}
              title="Push changes to Google Sheets"
            >
              ⬆️ Push
            </button>
          </>
        )}

        {syncStatus && (
          <span style={{
            fontSize: '13px',
            color: syncStatus.includes('✓') ? '#16a34a' : syncStatus.includes('Error') ? '#dc2626' : '#6b7280',
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
              <p style={{ marginBottom: '12px', fontWeight: 600, color: '#1f2937' }}>
                Setup Instructions:
              </p>
              <ol style={{ paddingLeft: '20px', marginBottom: '16px' }}>
                <li style={{ marginBottom: '8px' }}>
                  Open your Google Sheet (keep it <strong>private</strong>!)
                </li>
                <li style={{ marginBottom: '8px' }}>
                  Go to <strong>Extensions → Apps Script</strong>
                </li>
                <li style={{ marginBottom: '8px' }}>
                  Delete any code and paste the code from <code>GoogleAppsScript.js</code>
                </li>
                <li style={{ marginBottom: '8px' }}>
                  Click <strong>Deploy → New deployment</strong>
                </li>
                <li style={{ marginBottom: '8px' }}>
                  Choose type: <strong>Web app</strong>
                </li>
                <li style={{ marginBottom: '8px' }}>
                  Set "Execute as" to <strong>Me</strong>
                </li>
                <li style={{ marginBottom: '8px' }}>
                  Set "Who has access" to <strong>Anyone</strong>
                </li>
                <li style={{ marginBottom: '8px' }}>
                  Click <strong>Deploy</strong> and copy the Web App URL
                </li>
                <li style={{ marginBottom: '8px' }}>
                  Paste the URL below
                </li>
              </ol>
              <p style={{ fontSize: '13px', color: '#ef4444', background: '#fef2f2', padding: '8px', borderRadius: '4px', marginBottom: '8px' }}>
                ⚠️ Your sheet stays private! The Web App URL is only accessible by you after authorization.
              </p>
              <p style={{ fontSize: '13px', color: '#d97706', background: '#fef3c7', padding: '8px', borderRadius: '4px' }}>
                🏢 <strong>Google Workspace Note:</strong> If "Who has access" is restricted to your organization, Pull may not work from localhost. Deploy your app to a public URL (Vercel/Netlify) or use Push only for now.
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">
                Google Apps Script Web App URL <span className="required">*</span>
              </label>
              <input
                type="text"
                value={webAppUrl}
                onChange={(e) => setWebAppUrl(e.target.value)}
                className="form-input"
                placeholder="https://script.google.com/macros/s/.../exec"
              />
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={autoSync}
                  onChange={toggleAutoSync}
                />
                <span className="form-label" style={{ margin: 0 }}>
                  Enable auto-sync (pulls changes every 30 seconds)
                </span>
              </label>
            </div>

            <div className="modal-buttons">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="btn btn-full btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={saveWebAppUrl}
                className="btn btn-full btn-primary"
              >
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
