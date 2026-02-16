import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuarterSprints } from './useQuarterSprints';

/**
 * Custom hook for drag-to-resize functionality
 * @param {object} task - Task object { id, startSprint, duration, ... }
 * @param {function} onUpdate - Callback when task is updated (taskId, updates)
 * @returns {object} Event handlers and state
 */
export const useDragResize = (task, onUpdate) => {
  const { sprintToPixels, snapToHalfSprint, clampTask, SPRINT_WIDTH_PX } = useQuarterSprints();
  const [isDragging, setIsDragging] = useState(false);
  const [dragEdge, setDragEdge] = useState(null); // 'left' or 'right'
  const [tempPosition, setTempPosition] = useState(null);

  const dragStartRef = useRef(null);
  const initialTaskRef = useRef(null);

  // Handle mouse down on resize handle
  const handleMouseDown = useCallback((edge, event) => {
    event.stopPropagation();
    event.preventDefault();

    setIsDragging(true);
    setDragEdge(edge);
    dragStartRef.current = event.clientX;
    initialTaskRef.current = {
      startSprint: task.startSprint,
      duration: task.duration,
    };
  }, [task]);

  // Handle mouse move during drag
  const handleMouseMove = useCallback((event) => {
    if (!isDragging || !dragStartRef.current || !initialTaskRef.current) return;

    const deltaX = event.clientX - dragStartRef.current;
    const deltaSprints = deltaX / SPRINT_WIDTH_PX;

    if (dragEdge === 'right') {
      // Resizing from right edge - change duration
      const newDuration = initialTaskRef.current.duration + deltaSprints;
      const snappedDuration = snapToHalfSprint(newDuration);
      const clamped = clampTask(initialTaskRef.current.startSprint, snappedDuration);

      setTempPosition({
        startSprint: clamped.startSprint,
        duration: clamped.duration,
      });
    } else if (dragEdge === 'left') {
      // Resizing from left edge - change start position and duration
      const newStart = initialTaskRef.current.startSprint + deltaSprints;
      const snappedStart = snapToHalfSprint(newStart);

      // Calculate new duration (end position stays the same)
      const originalEnd = initialTaskRef.current.startSprint + initialTaskRef.current.duration;
      const newDuration = originalEnd - snappedStart;

      if (newDuration >= 0.5) {
        const clamped = clampTask(snappedStart, newDuration);
        setTempPosition({
          startSprint: clamped.startSprint,
          duration: clamped.duration,
        });
      }
    }
  }, [isDragging, dragEdge, SPRINT_WIDTH_PX, snapToHalfSprint, clampTask]);

  // Handle mouse up - commit changes
  const handleMouseUp = useCallback(() => {
    if (isDragging && tempPosition) {
      onUpdate(task.id, {
        startSprint: tempPosition.startSprint,
        duration: tempPosition.duration,
      });
    }

    setIsDragging(false);
    setDragEdge(null);
    setTempPosition(null);
    dragStartRef.current = null;
    initialTaskRef.current = null;
  }, [isDragging, tempPosition, task.id, onUpdate]);

  // Add global event listeners for mouse move and mouse up
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

  // Calculate current display position (use temp during drag, otherwise actual)
  const displayTask = tempPosition || {
    startSprint: task.startSprint,
    duration: task.duration,
  };

  const leftPosition = sprintToPixels(displayTask.startSprint) + 6; // 6px left gap
  const width = (displayTask.duration * SPRINT_WIDTH_PX) - 12; // minus 12px total gap (6px on each side)

  return {
    isDragging,
    dragEdge,
    leftPosition,
    width,
    handleMouseDownLeft: (e) => handleMouseDown('left', e),
    handleMouseDownRight: (e) => handleMouseDown('right', e),
  };
};
