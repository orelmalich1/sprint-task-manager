import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useQuarterSprints } from '../hooks/useQuarterSprints';
import { getQuarterConfig } from '../utils/quarterConfig';

// Same palette and hash as InitiativesTimeline
const INITIATIVE_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#22C55E',
  '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
  '#8B5CF6', '#A855F7', '#EC4899', '#F43F5E',
];

const hashTitle = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(hash);
};

const RcDateManager = () => {
  const { state, addRcDate, removeRcDate, updateRcDate } = useApp();
  const { SPRINTS, SPRINT_WIDTH_PX, Q_START_DATE, SPRINT_DURATION_DAYS, FIRST_SPRINT } = useQuarterSprints();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [date, setDate] = useState('');
  const [selectedRcId, setSelectedRcId] = useState(null);

  const quarterConfig = getQuarterConfig(state.currentQuarter);

  // Only RC dates belonging to the current quarter
  const quarterRcDates = state.rcDates.filter(rc => rc.quarter === state.currentQuarter);
  const selectedRc = quarterRcDates.find(rc => rc.id === selectedRcId) || null;

  const dateToPixels = (dateString) => {
    const rcDate = new Date(dateString);
    const days = (rcDate - Q_START_DATE) / (1000 * 60 * 60 * 24);
    return (days / SPRINT_DURATION_DAYS) * SPRINT_WIDTH_PX;
  };

  const dateToSprint = (dateString) => {
    const rcDate = new Date(dateString);
    const days = (rcDate - Q_START_DATE) / (1000 * 60 * 60 * 24);
    return FIRST_SPRINT + days / SPRINT_DURATION_DAYS;
  };

  // Build initiatives from all tasks (same logic as InitiativesTimeline, excluding #475569)
  const buildInitiatives = () => {
    const map = {};
    state.tasks
      .filter(t => t.color !== '#475569')
      .forEach(task => {
        const title = task.title.trim();
        const taskEnd = task.startSprint + task.duration;
        if (!map[title]) {
          map[title] = {
            title,
            color: INITIATIVE_COLORS[hashTitle(title) % INITIATIVE_COLORS.length],
            startSprint: task.startSprint,
            endSprint: taskEnd,
          };
        } else {
          map[title].startSprint = Math.min(map[title].startSprint, task.startSprint);
          map[title].endSprint = Math.max(map[title].endSprint, taskEnd);
        }
      });
    return Object.values(map);
  };

  // Initiatives whose full span ends within this RC's window (prevRC < endSprint <= thisRC)
  const getInitiativesForRc = (rc) => {
    const rcSprint = dateToSprint(rc.date);
    const excluded = rc.excludedInitiatives || [];
    const sortedRcs = [...quarterRcDates].sort((a, b) => new Date(a.date) - new Date(b.date));
    const rcIndex = sortedRcs.findIndex(r => r.id === rc.id);
    const prevRc = rcIndex > 0 ? sortedRcs[rcIndex - 1] : null;
    const prevSprint = prevRc ? dateToSprint(prevRc.date) : -Infinity;

    return buildInitiatives().filter(initiative =>
      initiative.endSprint <= rcSprint &&
      initiative.endSprint > prevSprint &&
      !excluded.includes(initiative.title)
    );
  };

  const removeInitiativeFromRc = (rc, title) => {
    updateRcDate(rc.id, {
      excludedInitiatives: [...(rc.excludedInitiatives || []), title],
    });
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!label.trim() || !date) return;

    const selectedDate = new Date(date);
    if (selectedDate < quarterConfig.startDate || selectedDate > quarterConfig.endDate) {
      alert(`Date must be within ${quarterConfig.name}`);
      return;
    }

    addRcDate({
      id: `rc-${Date.now()}`,
      label: label.trim(),
      date: selectedDate.toISOString(),
      quarter: state.currentQuarter,
    });
    setLabel('');
    setDate('');
    setIsAddOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Remove this RC date?')) {
      removeRcDate(id);
      if (selectedRcId === id) setSelectedRcId(null);
    }
  };

  return (
    <>
      <div className="developer-row rc-manager-row">
        <div className="developer-name rc-name-cell">
          <span style={{ flex: 1, fontSize: '12px', fontWeight: 700, letterSpacing: '0.5px' }}>
            RC Dates
          </span>
          <button
            className="rc-add-btn"
            onClick={() => setIsAddOpen(true)}
            title={`Add RC date for ${quarterConfig.name}`}
          >
            +
          </button>
        </div>

        <div className="timeline-area">
          <div className="sprint-grid">
            {SPRINTS.map(sprint => (
              <div
                key={sprint.number}
                className="sprint-column"
                style={{ width: `${SPRINT_WIDTH_PX}px` }}
              />
            ))}
          </div>

          <div className="tasks-container">
            {quarterRcDates.map(rc => {
              const left = dateToPixels(rc.date);
              return (
                <div key={rc.id} className="rc-inline-marker" style={{ left: `${left}px` }}>
                  <span
                    className="rc-inline-label"
                    onClick={() => setSelectedRcId(rc.id)}
                    title={`${rc.label} — ${new Date(rc.date).toLocaleDateString()}\nClick to see initiatives`}
                  >
                    {rc.label}
                  </span>
                  <button
                    className="rc-inline-delete"
                    onClick={() => handleDelete(rc.id)}
                    title="Remove RC date"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add RC modal */}
      {isAddOpen && (
        <div className="modal-overlay" onClick={() => setIsAddOpen(false)}>
          <div className="modal" style={{ maxWidth: 360 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: 8 }}>Add RC Date</h2>
            <p style={{ marginBottom: 16, color: '#6b7280', fontSize: 14 }}>{quarterConfig.name}</p>
            <form onSubmit={handleAdd}>
              <div className="form-group">
                <label className="form-label">Label</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="RC1, RC2, etc."
                  required
                  autoFocus
                  value={label}
                  onChange={e => setLabel(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input
                  className="form-input"
                  type="date"
                  required
                  value={date}
                  onChange={e => setDate(e.target.value)}
                />
              </div>
              <div className="modal-buttons">
                <button type="button" className="btn-secondary" onClick={() => setIsAddOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Add RC</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Initiatives modal */}
      {selectedRc && (
        <div className="modal-overlay" onClick={() => setSelectedRcId(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Completed by {selectedRc.label}</h2>
            <p style={{ color: '#6b7280', marginBottom: 20, fontSize: 14 }}>
              {new Date(selectedRc.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>

            <div className="rc-tasks-list">
              {getInitiativesForRc(selectedRc).length === 0 ? (
                <p style={{ color: '#9ca3af', textAlign: 'center', padding: 20 }}>
                  No initiatives completed before this RC date
                </p>
              ) : (
                getInitiativesForRc(selectedRc).map(initiative => (
                  <div key={initiative.title} className="rc-task-item">
                    <div className="rc-task-color" style={{ backgroundColor: initiative.color }} />
                    <div className="rc-task-details">
                      <div className="rc-task-title">{initiative.title}</div>
                      <div className="rc-task-meta">
                        Sprint {initiative.startSprint}–{initiative.endSprint}
                      </div>
                    </div>
                    <button
                      onClick={() => removeInitiativeFromRc(selectedRc, initiative.title)}
                      title="Remove from this RC"
                      style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 16, padding: '0 4px' }}
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="modal-buttons">
              <button onClick={() => setSelectedRcId(null)} className="btn btn-full btn-primary">Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RcDateManager;
