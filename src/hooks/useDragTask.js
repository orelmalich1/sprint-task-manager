import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuarterSprints } from './useQuarterSprints';

/**
 * Custom hook for dragging tasks between sprints and developers
 * @param {object} task - Task object
 * @param {function} onUpdate - Callback when task is updated
 * @param {array} developers - Array of all developers
 * @returns {object} Event handlers and state
 */
export const useDragTask = (task, onUpdate, developers) => {
  const { snapToHalfSprint, clampSprintPosition, SPRINT_WIDTH_PX, SPRINTS } = useQuarterSprints();
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef(null);
  const taskElementRef = useRef(null);

  // Handle mouse down on task bar (not on resize handles)
  const handleMouseDown = useCallback((event, taskElement) => {
    // Don't start drag if clicking on resize handles or buttons
    if (event.target.classList.contains('resize-handle') ||
        event.target.classList.contains('task-delete') ||
        event.target.tagName === 'INPUT') {
      return;
    }

    event.stopPropagation();
    event.preventDefault();

    dragStartRef.current = {
      clientX: event.clientX,
      clientY: event.clientY,
      startSprint: task.startSprint,
      developerId: task.developerId,
    };

    taskElementRef.current = taskElement;
    setIsDragging(true);
  }, [task]);

  // Handle mouse move during drag
  const handleMouseMove = useCallback((event) => {
    if (!isDragging || !dragStartRef.current || !taskElementRef.current) return;

    // We could add visual feedback here in the future
    // For now, we just track the movement and update on mouse up
  }, [isDragging]);

  // Handle mouse up - commit changes
  const handleMouseUp = useCallback((event) => {
    if (!isDragging || !dragStartRef.current || !taskElementRef.current) return;

    // Calculate final position
    const deltaX = event.clientX - dragStartRef.current.clientX;
    const deltaSprints = deltaX / SPRINT_WIDTH_PX;
    const newStartSprint = dragStartRef.current.startSprint + deltaSprints;
    const snappedSprint = snapToHalfSprint(newStartSprint);
    const clampedSprint = clampSprintPosition(snappedSprint);

    // Find target developer
    const timelineElement = taskElementRef.current.closest('.timeline');
    let targetDeveloperId = dragStartRef.current.developerId;

    if (timelineElement) {
      const developerRows = timelineElement.querySelectorAll('.developer-row');
      developerRows.forEach((row, index) => {
        const rect = row.getBoundingClientRect();
        if (event.clientY >= rect.top && event.clientY <= rect.bottom) {
          if (developers[index]) {
            targetDeveloperId = developers[index].id;
          }
        }
      });
    }

    // Validate that the target developer is available for the task period
    if (targetDeveloperId !== dragStartRef.current.developerId) {
      const targetDeveloper = developers.find(d => d.id === targetDeveloperId);
      if (targetDeveloper && targetDeveloper.endDate) {
        const taskStartSprint = clampedSprint;
        const taskEndSprint = taskStartSprint + task.duration;

        const startSprintData = SPRINTS.find(s => s.number === Math.floor(taskStartSprint));
        const endSprintData = SPRINTS.find(s => s.number === Math.floor(taskEndSprint));

        if (startSprintData && endSprintData) {
          const devEndDate = new Date(targetDeveloper.endDate);
          const taskStartDate = startSprintData.start;

          if (devEndDate < taskStartDate) {
            alert(`Cannot assign task to ${targetDeveloper.name}. This developer left on ${devEndDate.toLocaleDateString()} which is before the task starts.`);
            setIsDragging(false);
            dragStartRef.current = null;
            taskElementRef.current = null;
            return;
          }
        }
      }
    }

    // Only update if something changed
    if (clampedSprint !== task.startSprint || targetDeveloperId !== task.developerId) {
      onUpdate(task.id, {
        startSprint: clampedSprint,
        developerId: targetDeveloperId,
      });
    }

    setIsDragging(false);
    dragStartRef.current = null;
    taskElementRef.current = null;
  }, [isDragging, task, developers, onUpdate, SPRINT_WIDTH_PX, snapToHalfSprint, clampSprintPosition, SPRINTS]);

  // Add global event listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return {
    isDragging,
    handleMouseDown,
  };
};
