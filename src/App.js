import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import DeveloperManager from './components/DeveloperManager';
import RcDateManager from './components/RcDateManager';
import QuarterSelector from './components/QuarterSelector';
import SprintTimeline from './components/SprintTimeline';
import InitiativesTimeline from './components/InitiativesTimeline';
import AddTaskButton from './components/AddTaskButton';
import GoogleSheetSync from './components/GoogleSheetSync';

function App() {
  const [viewMode, setViewMode] = useState('devs');

  return (
    <AppProvider>
      <div className="app-container">
        <div className="toolbar">
          <div className="toolbar-left">
            <h1>Nanit Home Planning 2026</h1>
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
    </AppProvider>
  );
}

export default App;
