import React, { useState } from 'react';
import TaskBar from './TaskBar';
import DeveloperEditModal from './DeveloperEditModal';
import { useQuarterSprints } from '../hooks/useQuarterSprints';
import { useApp } from '../context/AppContext';

const DeveloperRow = ({ developer, tasks }) => {
  const { removeDeveloper } = useApp();
  const { SPRINTS, SPRINT_WIDTH_PX } = useQuarterSprints();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const sortedTasks = [...tasks].sort((a, b) => a.startSprint - b.startSprint);

  const handleRemove = () => {
    const tasksCount = tasks.length;
    const confirmMessage = tasksCount > 0
      ? `Remove ${developer.name} and their ${tasksCount} task(s)?`
      : `Remove ${developer.name}?`;

    if (window.confirm(confirmMessage)) {
      removeDeveloper(developer.id);
    }
  };

  // Check if developer is inactive (has an end date in the past)
  const isInactive = developer.endDate && new Date(developer.endDate) < new Date();

  return (
    <>
      <div className="developer-row">
        <div className={`developer-name ${isInactive ? 'inactive' : ''}`}>
          <span
            onClick={() => setIsEditModalOpen(true)}
            style={{ cursor: 'pointer', flex: 1 }}
            title="Click to edit"
          >
            {developer.name}
            {isInactive && <span className="inactive-badge">Left</span>}
          </span>
          <button
            onClick={handleRemove}
            className="delete-btn"
            title="Remove developer"
          >
            ✕
          </button>
        </div>

        <div className="timeline-area">
          <div className="sprint-grid">
            {SPRINTS.map((sprint) => (
              <div
                key={sprint.number}
                className="sprint-column"
                style={{ width: `${SPRINT_WIDTH_PX}px` }}
              />
            ))}
          </div>

          <div className="tasks-container">
            {sortedTasks.map((task, index) => (
              <TaskBar key={task.id} task={task} rowIndex={index} />
            ))}
          </div>
        </div>
      </div>

      {isEditModalOpen && (
        <DeveloperEditModal
          developer={developer}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}
    </>
  );
};

export default DeveloperRow;
