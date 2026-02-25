import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

const GitHubSync = () => {
  const { state, addDeveloper, addTask, removeDeveloper, deleteTask } = useApp();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [syncStatus, setSyncStatus] = useState('');
  const [autoSync, setAutoSync] = useState(localStorage.getItem('autoSync') === 'true');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (autoSync) {
      const interval = setInterval(() => syncFromGist(false), 30000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSync]);

  const convertTasksForStorage = (tasks, developers) =>
    tasks.map(task => {
      const dev = developers.find(d => d.id === task.developerId);
      return {
        id: task.id,
        title: task.title,
        developer: dev ? dev.name : 'Unknown',
        startSprint: task.startSprint,
        duration: task.duration,
        color: task.color,
      };
    });

  const convertDevelopersForStorage = (developers) =>
    developers.map(dev => ({
      id: dev.id,
      name: dev.name,
      startDate: dev.startDate || '',
      endDate: dev.endDate || '',
    }));

  const syncToGist = async () => {
    setIsSyncing(true);
    setSyncStatus('Pushing to GitHub...');
    try {
      const response = await fetch('/api/sheets-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks: convertTasksForStorage(state.tasks, state.developers),
          developers: convertDevelopersForStorage(state.developers),
        }),
      });

      const result = await response.json();

      if (result.success) {
        setLastSync(new Date());
        if (result.newGistId) {
          setSyncStatus(`✓ Gist created! Add GITHUB_GIST_ID=${result.newGistId} to Vercel env vars, then redeploy.`);
        } else {
          setSyncStatus('✓ Pushed to GitHub');
          setTimeout(() => setSyncStatus(''), 3000);
        }
      } else {
        setSyncStatus(`Error: ${result.error}`);
      }
    } catch (error) {
      setSyncStatus(`Push failed: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const syncFromGist = async (showStatus = true) => {
    if (showStatus && state.tasks.length > 0) {
      const confirmed = window.confirm(
        `⚠️ Pull will replace ALL current data (${state.tasks.length} tasks, ${state.developers.length} developers) with data from GitHub.\n\nMake sure you've Pushed first so nothing is lost.\n\nContinue?`
      );
      if (!confirmed) return;
    }
    setIsSyncing(true);
    if (showStatus) setSyncStatus('Pulling from GitHub...');
    try {
      const response = await fetch('/api/sheets-proxy');

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(err.error || `HTTP ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        state.developers.forEach(dev => removeDeveloper(dev.id));
        state.tasks.forEach(task => deleteTask(task.id));

        const developerMap = {};

        (result.developers || []).forEach(sheetDev => {
          const name = (sheetDev.name || '').trim();
          if (name) {
            const dev = {
              id: sheetDev.id || `dev-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
              name,
              startDate: sheetDev.startDate || null,
              endDate: sheetDev.endDate || null,
            };
            addDeveloper(dev);
            developerMap[name] = dev.id;
          }
        });

        if (Object.keys(developerMap).length === 0 && result.tasks?.length > 0) {
          [...new Set(result.tasks.map(t => (t.developer || '').trim()).filter(Boolean))].forEach(name => {
            const dev = {
              id: `dev-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
              name,
              startDate: null,
              endDate: null,
            };
            addDeveloper(dev);
            developerMap[name] = dev.id;
          });
        }

        (result.tasks || []).forEach(t => {
          const developerId = developerMap[(t.developer || '').trim()];
          if (developerId) {
            addTask({
              id: t.id || `task-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
              title: (t.title || '').trim(),
              developerId,
              startSprint: parseFloat(t.startSprint),
              duration: parseFloat(t.duration),
              color: t.color || '#3B82F6',
            });
          }
        });

        setLastSync(new Date());
        if (showStatus) {
          setSyncStatus('✓ Pulled from GitHub');
          setTimeout(() => setSyncStatus(''), 3000);
        }
      } else {
        if (showStatus) setSyncStatus(`Error: ${result.error}`);
      }
    } catch (error) {
      if (showStatus) setSyncStatus(`Pull failed: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleAutoSync = () => {
    const v = !autoSync;
    setAutoSync(v);
    localStorage.setItem('autoSync', v.toString());
  };

  return (
    <>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-secondary" title="Sync info">
          ⚙️ Sync
        </button>

        <button onClick={() => syncFromGist(true)} className="btn btn-secondary" disabled={isSyncing}>
          ⬇️ Pull
        </button>

        <button onClick={syncToGist} className="btn btn-primary" disabled={isSyncing}>
          ⬆️ Push
        </button>

        {syncStatus && (
          <span style={{
            fontSize: '13px',
            color: syncStatus.includes('✓') ? '#16a34a' : syncStatus.includes('failed') || syncStatus.includes('Error') ? '#dc2626' : '#6b7280',
            fontWeight: 500,
            maxWidth: '400px',
          }}>
            {syncStatus}
          </span>
        )}

        {lastSync && !syncStatus && (
          <span style={{ fontSize: '12px', color: '#9ca3af' }}>
            Last sync: {lastSync.toLocaleTimeString()}
          </span>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <h2>GitHub Sync Setup</h2>

            <div style={{ fontSize: '14px', color: '#374151', lineHeight: '1.7' }}>
              <p style={{ marginBottom: '12px' }}>
                Data is synced via a <strong>private GitHub Gist</strong>. Add these two environment variables to your Vercel project:
              </p>

              <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', marginBottom: '16px', fontFamily: 'monospace', fontSize: '13px' }}>
                <div style={{ marginBottom: '8px' }}><strong>GITHUB_TOKEN</strong> = your Personal Access Token</div>
                <div><strong>GITHUB_GIST_ID</strong> = your Gist ID (auto-created on first Push)</div>
              </div>

              <p style={{ fontWeight: 600, marginBottom: '6px' }}>How to create a Personal Access Token:</p>
              <ol style={{ paddingLeft: '20px', marginBottom: '16px' }}>
                <li>Go to <strong>github.com → Settings → Developer settings</strong></li>
                <li>Click <strong>Personal access tokens → Tokens (classic)</strong></li>
                <li>Click <strong>Generate new token (classic)</strong></li>
                <li>Check only the <strong>gist</strong> scope</li>
                <li>Click <strong>Generate token</strong> and copy it</li>
              </ol>

              <p style={{ fontWeight: 600, marginBottom: '6px' }}>First-time setup:</p>
              <ol style={{ paddingLeft: '20px' }}>
                <li>Add only <strong>GITHUB_TOKEN</strong> to Vercel and redeploy</li>
                <li>Click <strong>⬆️ Push</strong> — a Gist will be created automatically</li>
                <li>Copy the <strong>GITHUB_GIST_ID</strong> shown in the status message</li>
                <li>Add it to Vercel env vars and redeploy once more</li>
              </ol>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" id="autoSync" checked={autoSync} onChange={toggleAutoSync} />
              <label htmlFor="autoSync" style={{ fontSize: '14px', cursor: 'pointer' }}>
                Auto-sync every 30 seconds
              </label>
            </div>

            <div className="modal-buttons" style={{ marginTop: '20px' }}>
              <button onClick={() => setIsModalOpen(false)} className="btn btn-full btn-primary">Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GitHubSync;
