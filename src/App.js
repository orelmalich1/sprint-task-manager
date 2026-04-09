import React, { useState } from 'react';
import { AppProvider, useApp, PODS } from './context/AppContext';
import DeveloperManager from './components/DeveloperManager';
import RcDateManager from './components/RcDateManager';
import QuarterSelector from './components/QuarterSelector';
import SprintTimeline from './components/SprintTimeline';
import InitiativesTimeline from './components/InitiativesTimeline';
import AddTaskButton from './components/AddTaskButton';
import GoogleSheetSync from './components/GoogleSheetSync';

const AppInner = () => {
  const { state, setPod } = useApp();
  const [viewMode, setViewMode] = useState('devs');

  return (
    <div className="app-container">
      <div className="toolbar">
        <div className="toolbar-left">
          <select
            className="pod-selector"
            value={state.currentPod}
            onChange={(e) => setPod(e.target.value)}
          >
            {PODS.map(pod => (
              <option key={pod.id} value={pod.id}>{pod.label}</option>
            ))}
          </select>
          <QuarterSelector />
          <div className="view-toggle">
            <button
              className={`view-toggle-btn ${viewMode === 'devs' ? 'active' : ''}`}
              onClick={() => setViewMode('devs')}
              title="Devs Gantt"
            >
              👤 Devs
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'initiatives' ? 'active' : ''}`}
              onClick={() => setViewMode('initiatives')}
              title="Initiatives Gantt"
            >
              🕐 Initiatives
            </button>
          </div>
        </div>
        <div className="toolbar-controls">
          <GoogleSheetSync />
          <DeveloperManager />
          <RcDateManager />
        </div>
      </div>

      <div className="timeline-container">
        {viewMode === 'devs' ? <SprintTimeline /> : <InitiativesTimeline />}
      </div>

      {viewMode === 'devs' && <AddTaskButton />}
    </div>
  );
};

function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}

export default App;
