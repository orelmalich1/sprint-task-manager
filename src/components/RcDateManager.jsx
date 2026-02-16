import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Q2_START_DATE, TOTAL_SPRINTS, SPRINT_DURATION_DAYS } from '../utils/sprintCalculations';

const RcDateManager = () => {
  const { state, addRcDate, removeRcDate } = useApp();
  const [isAdding, setIsAdding] = useState(false);
  const [label, setLabel] = useState('');
  const [date, setDate] = useState('');

  const handleAdd = () => {
    if (!label.trim() || !date) {
      alert('Please enter both label and date');
      return;
    }

    const selectedDate = new Date(date);
    const endDate = new Date(Q2_START_DATE);
    endDate.setDate(endDate.getDate() + (TOTAL_SPRINTS * SPRINT_DURATION_DAYS));

    if (selectedDate < Q2_START_DATE || selectedDate > endDate) {
      alert(`Date must be between ${Q2_START_DATE.toLocaleDateString()} and ${endDate.toLocaleDateString()}`);
      return;
    }

    const newRcDate = {
      id: `rc-${Date.now()}`,
      label: label.trim(),
      date: selectedDate.toISOString(),
    };

    addRcDate(newRcDate);
    setLabel('');
    setDate('');
    setIsAdding(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Remove this RC date?')) {
      removeRcDate(id);
    }
  };

  return (
    <div className="rc-manager">
      {!isAdding ? (
        <button onClick={() => setIsAdding(true)} className="btn btn-rc">
          + RC Date
        </button>
      ) : (
        <div className="rc-input-group">
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="RC1, RC2, etc."
            className="rc-input"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rc-input"
          />
          <button onClick={handleAdd} className="btn btn-add btn-small">
            Add
          </button>
          <button onClick={() => setIsAdding(false)} className="btn btn-cancel btn-small">
            Cancel
          </button>
        </div>
      )}

      {state.rcDates.length > 0 && (
        <div className="rc-list">
          {state.rcDates.map((rc) => (
            <div key={rc.id} className="rc-item">
              <span className="rc-label">{rc.label}</span>
              <span className="rc-date">{new Date(rc.date).toLocaleDateString()}</span>
              <button
                onClick={() => handleDelete(rc.id)}
                className="rc-delete"
                title="Remove RC date"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RcDateManager;
