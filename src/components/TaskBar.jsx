import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useDragResize } from '../hooks/useDragResize';
import { useDragTask } from '../hooks/useDragTask';

const TaskBar = ({ task, rowIndex }) => {
  const { state, updateTask, deleteTask } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const taskRef = useRef(null);

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

  const handleSaveEdit = () => {
    if (editTitle.trim()) {
      updateTask(task.id, { title: editTitle.trim() });
    }
    setIsEditing(false);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm('Delete this task?')) {
      deleteTask(task.id);
    }
  };

  const handleTaskClick = () => {
    if (!isDragging) {
      setIsEditing(true);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      setEditTitle(task.title);
      setIsEditing(false);
    }
  };

  return (
    <div
      ref={taskRef}
      className={`task-bar ${isDragging ? 'dragging' : ''}`}
      style={{
        left: `${leftPosition}px`,
        width: `${width}px`,
        backgroundColor: task.color || '#93C5FD',
        color: '#000',
        top: '16px',
      }}
      onClick={handleTaskClick}
      onMouseDown={(e) => handleDragStart(e, taskRef.current)}
    >
      <div
        className="resize-handle resize-handle-left"
        onMouseDown={handleMouseDownLeft}
        onClick={(e) => e.stopPropagation()}
      />

      <div className="task-content">
        {isEditing ? (
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleSaveEdit}
            onKeyDown={handleKeyDown}
            className="task-edit-input"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <>
            <span className="task-title">{task.title}</span>
            <button
              onClick={handleDelete}
              className="task-delete"
              title="Delete task"
            >
              ✕
            </button>
          </>
        )}
      </div>

      <div
        className="resize-handle resize-handle-right"
        onMouseDown={handleMouseDownRight}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};

export default TaskBar;
