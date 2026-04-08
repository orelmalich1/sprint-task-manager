import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuarterSprints } from './useQuarterSprints';

const DRAG_THRESHOLD_PX = 5;

export const useDragTask = (task, onUpdate, developers) => {
  const { snapToHalfSprint, clampSprintPosition, SPRINT_WIDTH_PX, SPRINTS } = useQuarterSprints();
  const [isDragging, setIsDragging] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const dragStartRef = useRef(null);
  const taskElementRef = useRef(null);
  const hasMovedRef = useRef(false);

  const handleMouseDown = useCallback((event, taskElement) => {
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

    hasMovedRef.current = false;
    taskElementRef.current = taskElement;
    setIsMouseDown(true);
  }, [task]);

  const handleMouseMove = useCallback((event) => {
    if (!dragStartRef.current) return;

    const deltaX = Math.abs(event.clientX - dragStartRef.current.clientX);
    const deltaY = Math.abs(event.clientY - dragStartRef.current.clientY);

    if (!hasMovedRef.current && (deltaX > DRAG_THRESHOLD_PX || deltaY > DRAG_THRESHOLD_PX)) {
      hasMovedRef.current = true;
      setIsDragging(true);
    }
  }, []);

  const handleMouseUp = useCallback((event) => {
    if (!dragStartRef.current) return;

    if (hasMovedRef.current && taskElementRef.current) {
      const deltaX = event.clientX - dragStartRef.current.clientX;
      const newStartSprint = dragStartRef.current.startSprint + deltaX / SPRINT_WIDTH_PX;
      const clampedSprint = clampSprintPosition(snapToHalfSprint(newStartSprint));

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

      if (targetDeveloperId !== dragStartRef.current.developerId) {
        const targetDeveloper = developers.find(d => d.id === targetDeveloperId);
        if (targetDeveloper && targetDeveloper.endDate) {
          const startSprintData = SPRINTS.find(s => s.number === Math.floor(clampedSprint));
          if (startSprintData) {
            const devEndDate = new Date(targetDeveloper.endDate);
            if (devEndDate < startSprintData.start) {
              alert(`Cannot assign task to ${targetDeveloper.name}. This developer left on ${devEndDate.toLocaleDateString()} which is before the task starts.`);
              setIsDragging(false);
              setIsMouseDown(false);
              dragStartRef.current = null;
              taskElementRef.current = null;
              hasMovedRef.current = false;
              return;
            }
          }
        }
      }

      if (clampedSprint !== task.startSprint || targetDeveloperId !== task.developerId) {
        onUpdate(task.id, { startSprint: clampedSprint, developerId: targetDeveloperId });
      }
    }

    setIsDragging(false);
    setIsMouseDown(false);
    dragStartRef.current = null;
    taskElementRef.current = null;
    hasMovedRef.current = false;
  }, [task, developers, onUpdate, SPRINT_WIDTH_PX, snapToHalfSprint, clampSprintPosition, SPRINTS]);

  useEffect(() => {
    if (!isMouseDown) return;
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isMouseDown, handleMouseMove, handleMouseUp]);

  return { isDragging, handleMouseDown };
};
