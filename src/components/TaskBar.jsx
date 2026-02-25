import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useDragResize } from '../hooks/useDragResize';
import { useDragTask } from '../hooks/useDragTask';
import { useQuarterSprints } from '../hooks/useQuarterSprints';

const TASK_COLORS = [
  { name: 'Sky Blue',     value: '#93C5FD' },
  { name: 'Medium Blue',  value: '#60A5FA' },
  { name: 'Royal Blue',   value: '#3B82F6' },
  { name: 'Deep Blue',    value: '#2563EB' },
  { name: 'Navy Blue',    value: '#1E40AF' },
  { name: 'Dark Navy',    value: '#1E3A8A' },
  { name: 'Light Cyan',   value: '#67E8F9' },
  { name: 'Cyan Blue',    value: '#06B6D4' },
  { name: 'Indigo',       value: '#6366F1' },
  { name: 'Slate Blue',   value: '#475569' },
  { name: 'Light Green',  value: '#86EFAC' },
  { name: 'Medium Green', value: '#4ADE80' },
  { name: 'Green',        value: '#22C55E' },
  { name: 'Dark Green',   value: '#16A34A' },
  { name: 'Forest Green', value: '#15803D' },
];

const TaskBar = ({ task }) => {
  const { state, updateTask, deleteTask } = useApp();
  const { FIRST_SPRINT, LAST_SPRINT, TOTAL_SPRINTS } = useQuarterSprints();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState({});

  const {
    isDragging: isResizing,
    leftPosition,
    width,
    handleMouseDownLeft,
    handleMouseDownRight,
  } = useDragResize(task, updateTask);

  const {
    isDragging: isDraggingTask,
    handleMouseDown: handleDragStart,
  } = useDragTask(task, updateTask, state.developers);

  const isDragging = isResizing || isDraggingTask;

  const openDialog = () => {
    if (isDragging) return;
    setForm({
      title: task.title,
      color: task.color || '#3B82F6',
      startSprint: task.startSprint,
      duration: task.duration,
      developerId: task.developerId,
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.title.trim()) return;
    updateTask(task.id, {
      title: form.title.trim(),
      color: form.color,
      startSprint: parseFloat(form.startSprint),
      duration: parseFloat(form.duration),
      developerId: form.developerId,
    });
    setIsDialogOpen(false);
  };

  const handleDelete = () => {
    setIsDialogOpen(false);
    if (window.confirm(`Delete "${task.title}"?`)) {
      deleteTask(task.id);
    }
  };

  return (
    <>
      <div
        className={`task-bar ${isDragging ? 'dragging' : ''}`}
        style={{
          left: `${leftPosition}px`,
          width: `${width}px`,
          backgroundColor: task.color || '#93C5FD',
          top: '16px',
        }}
        onClick={openDialog}
        onMouseDown={(e) => handleDragStart(e)}
      >
        <div className="resize-handle resize-handle-left" onMouseDown={handleMouseDownLeft} onClick={(e) => e.stopPropagation()} />
        <span className="task-title">{task.title}</span>
        <div className="resize-handle resize-handle-right" onMouseDown={handleMouseDownRight} onClick={(e) => e.stopPropagation()} />
      </div>

      {isDialogOpen && (
        <div className="modal-overlay" onClick={() => setIsDialogOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <h2>Edit Task</h2>

            <div className="form-group">
              <label className="form-label">Task Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                className="form-input"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setIsDialogOpen(false); }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Developer</label>
              <select
                value={form.developerId}
                onChange={(e) => setForm(f => ({ ...f, developerId: e.target.value }))}
                className="form-select"
              >
                {state.developers.map(dev => (
                  <option key={dev.id} value={dev.id}>{dev.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Start Sprint</label>
                <input
                  type="number"
                  value={form.startSprint}
                  onChange={(e) => setForm(f => ({ ...f, startSprint: e.target.value }))}
                  className="form-input"
                  min={FIRST_SPRINT}
                  max={LAST_SPRINT}
                  step="0.5"
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Duration (sprints)</label>
                <input
                  type="number"
                  value={form.duration}
                  onChange={(e) => setForm(f => ({ ...f, duration: e.target.value }))}
                  className="form-input"
                  min="0.5"
                  max={TOTAL_SPRINTS}
                  step="0.5"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Color</label>
              <div className="color-picker">
                {TASK_COLORS.map(color => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, color: color.value }))}
                    className={`color-option ${form.color === color.value ? 'selected' : ''}`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            <div className="modal-buttons">
              <button type="button" onClick={handleDelete} className="btn btn-full" style={{ background: '#dc2626', color: 'white' }}>
                Delete Task
              </button>
              <button type="button" onClick={() => setIsDialogOpen(false)} className="btn btn-full btn-secondary">
                Cancel
              </button>
              <button type="button" onClick={handleSave} className="btn btn-full btn-primary">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TaskBar;
