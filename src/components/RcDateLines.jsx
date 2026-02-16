import React, { useState } from 'react';
import { useQuarterSprints } from '../hooks/useQuarterSprints';
import { useApp } from '../context/AppContext';

const RcDateLines = ({ rcDates }) => {
  const { state } = useApp();
  const { Q_START_DATE, SPRINT_WIDTH_PX, SPRINT_DURATION_DAYS, FIRST_SPRINT } = useQuarterSprints();
  const [selectedRc, setSelectedRc] = useState(null);

  const calculatePosition = (dateString) => {
    const rcDate = new Date(dateString);
    const daysSinceStart = Math.floor((rcDate - Q_START_DATE) / (1000 * 60 * 60 * 24));
    const sprintsFraction = daysSinceStart / SPRINT_DURATION_DAYS;
    return sprintsFraction * SPRINT_WIDTH_PX;
  };

  const calculateSprintPosition = (dateString) => {
    const rcDate = new Date(dateString);
    const daysSinceStart = Math.floor((rcDate - Q_START_DATE) / (1000 * 60 * 60 * 24));
    const sprintsFromStart = daysSinceStart / SPRINT_DURATION_DAYS;
    return FIRST_SPRINT + sprintsFromStart;
  };

  const getTasksForRc = (rc) => {
    const rcSprintPosition = calculateSprintPosition(rc.date);

    return state.tasks.filter(task => {
      const taskStart = task.startSprint;
      const taskEnd = task.startSprint + task.duration;
      return rcSprintPosition >= taskStart && rcSprintPosition < taskEnd;
    });
  };

  const handleRcClick = (rc) => {
    setSelectedRc(rc);
  };

  const handleCloseModal = () => {
    setSelectedRc(null);
  };

  const getDeveloperName = (developerId) => {
    const developer = state.developers.find(dev => dev.id === developerId);
    return developer ? developer.name : 'Unknown';
  };

  return (
    <>
      {rcDates.map((rc) => {
        const position = calculatePosition(rc.date);
        return (
          <div
            key={rc.id}
            className="rc-date-line"
            style={{ left: `${position}px` }}
          >
            <div
              className="rc-date-label"
              onClick={() => handleRcClick(rc)}
              style={{ cursor: 'pointer' }}
            >
              {rc.label}
            </div>
          </div>
        );
      })}

      {selectedRc && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Tasks for {selectedRc.label}</h2>
            <p style={{ color: '#6b7280', marginBottom: '20px', fontSize: '14px' }}>
              {new Date(selectedRc.date).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>

            <div className="rc-tasks-list">
              {getTasksForRc(selectedRc).length === 0 ? (
                <p style={{ color: '#9ca3af', textAlign: 'center', padding: '20px' }}>
                  No tasks scheduled during this RC date
                </p>
              ) : (
                getTasksForRc(selectedRc).map(task => (
                  <div key={task.id} className="rc-task-item">
                    <div
                      className="rc-task-color"
                      style={{ backgroundColor: task.color || '#93C5FD' }}
                    />
                    <div className="rc-task-details">
                      <div className="rc-task-title">{task.title}</div>
                      <div className="rc-task-meta">
                        {getDeveloperName(task.developerId)} •
                        Sprint {task.startSprint} - {task.startSprint + task.duration}
                        ({task.duration} sprint{task.duration !== 1 ? 's' : ''})
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="modal-buttons">
              <button
                onClick={handleCloseModal}
                className="btn btn-full btn-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RcDateLines;
