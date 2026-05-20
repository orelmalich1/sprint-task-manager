import React, { useState } from 'react';
import TaskBar from './TaskBar';
import DeveloperEditModal from './DeveloperEditModal';
import { useQuarterSprints } from '../hooks/useQuarterSprints';
import { useApp } from '../context/AppContext';

const DeveloperRow = ({ developer, tasks, ooo }) => {
  const { removeDeveloper, addOoo, removeOoo } = useApp();
  const { SPRINTS, SPRINT_WIDTH_PX, sprintToPixels } = useQuarterSprints();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddOooOpen, setIsAddOooOpen] = useState(false);
  const [oooForm, setOooForm] = useState({ startSprint: '', duration: 1, note: '' });

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

  const handleAddOoo = (e) => {
    e.preventDefault();
    const start = parseFloat(oooForm.startSprint);
    const dur = parseFloat(oooForm.duration);
    if (isNaN(start) || isNaN(dur) || dur <= 0) return;
    addOoo({
      id: crypto.randomUUID(),
      developerId: developer.id,
      startSprint: start,
      duration: dur,
      note: oooForm.note.trim(),
    });
    setIsAddOooOpen(false);
    setOooForm({ startSprint: '', duration: 1, note: '' });
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
            onClick={() => setIsAddOooOpen(true)}
            className="ooo-add-btn"
            title="Add Out of Office"
          >
            ✈
          </button>
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
            {ooo.map((entry) => {
              const left = sprintToPixels(entry.startSprint) + 6;
              const width = entry.duration * SPRINT_WIDTH_PX - 12;
              return (
                <div
                  key={entry.id}
                  className="ooo-bar"
                  style={{ left: `${left}px`, width: `${Math.max(width, 20)}px` }}
                  title={entry.note ? `OoO: ${entry.note}` : 'Out of Office'}
                  onClick={() => {
                    if (window.confirm('Remove this Out of Office entry?')) {
                      removeOoo(entry.id);
                    }
                  }}
                >
                  <span className="ooo-label">{entry.note || 'OoO'}</span>
                </div>
              );
            })}
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

      {isAddOooOpen && (
        <div className="modal-overlay" onClick={() => setIsAddOooOpen(false)}>
          <div className="modal" style={{ maxWidth: 360 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: 16 }}>Add Out of Office</h2>
            <p style={{ marginBottom: 16, color: '#6b7280', fontSize: 14 }}>
              {developer.name}
            </p>
            <form onSubmit={handleAddOoo}>
              <div className="form-group">
                <label className="form-label">Start Sprint</label>
                <input
                  className="form-input"
                  type="number"
                  step="0.5"
                  min="1"
                  required
                  autoFocus
                  value={oooForm.startSprint}
                  onChange={e => setOooForm(f => ({ ...f, startSprint: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Duration (sprints)</label>
                <input
                  className="form-input"
                  type="number"
                  step="0.5"
                  min="0.5"
                  required
                  value={oooForm.duration}
                  onChange={e => setOooForm(f => ({ ...f, duration: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Note (optional)</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="e.g. Vacation, Conference…"
                  value={oooForm.note}
                  onChange={e => setOooForm(f => ({ ...f, note: e.target.value }))}
                />
              </div>
              <div className="modal-buttons">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsAddOooOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add OoO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default DeveloperRow;
