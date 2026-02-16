import React from 'react';
import { AppProvider } from './context/AppContext';
import DeveloperManager from './components/DeveloperManager';
import RcDateManager from './components/RcDateManager';
import QuarterSelector from './components/QuarterSelector';
import SprintTimeline from './components/SprintTimeline';
import AddTaskButton from './components/AddTaskButton';
import GoogleSheetSync from './components/GoogleSheetSync';

function App() {
  return (
    <AppProvider>
      <div className="app-container">
        <div className="toolbar">
          <div className="toolbar-left">
            <h1>Nanit Home Planning 2026</h1>
            <QuarterSelector />
          </div>
          <div className="toolbar-controls">
            <GoogleSheetSync />
            <DeveloperManager />
            <RcDateManager />
          </div>
        </div>

        <div className="timeline-container">
          <SprintTimeline />
        </div>

        <AddTaskButton />
      </div>
    </AppProvider>
  );
}

export default App;
